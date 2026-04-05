import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { MidnightAdapter } from './adapters/midnight.adapter';
import { AleoAdapter } from './adapters/aleo.adapter';
import { FhenixAdapter } from './adapters/fhenix.adapter';
import { RedisService } from '../core/redis/redis.service';
import * as crypto from 'crypto';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class CredentialsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private midnightAdapter: MidnightAdapter,
    private aleoAdapter: AleoAdapter,
    private fhenixAdapter: FhenixAdapter,
    private redisService: RedisService,
  ) {}

  @OnEvent('compliance.cleared')
  async handleComplianceCleared(payload: { userId: string }) {
    await this.issue(payload.userId);
  }

  async issue(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        complianceRecord: true,
      }
    });

    if (!user || !user.walletAddress || user.kycStatus !== 'APPROVED' || user.complianceRecord?.status !== 'CLEAR') {
      throw new ForbiddenException('User must have completed KYC and Compliance');
    }

    const secret = this.configService.get<string>('CREDENTIAL_SECRET') || 'dev-secret';
    const expiryDays = Number(this.configService.get<string>('CREDENTIAL_EXPIRY_DAYS')) || 365;
    
    const issuedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const credentialId = crypto.randomUUID();

    const claims = {
      kycVerified: true,
      kycTier: 1, // Hardcoded for MVP, dynamic in full prod
      regionAllowed: true,
      sanctionsClear: true,
      complianceStatus: 'CLEAR',
      ageVerified: true, // Assuming KYC validates
    };

    const payload = {
      credentialId,
      userId,
      walletAddress: user.walletAddress,
      issuedAt: Math.floor(issuedAt.getTime() / 1000),
      expiresAt: Math.floor(expiresAt.getTime() / 1000),
      claims,
    };

    const signature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const formattedPayload = {
      ...payload,
      signature,
    };

    const midnightProof = this.midnightAdapter.format(formattedPayload);
    const aleoRecord = this.aleoAdapter.format(formattedPayload);
    const fhenixAttestation = this.fhenixAdapter.format(formattedPayload);

    await this.prisma.credential.upsert({
      where: { userId },
      update: {
        walletAddress: user.walletAddress,
        claims: claims as any,
        signature,
        issuedAt,
        expiresAt,
        revokedAt: null,
        midnightProof: midnightProof as any,
        aleoRecord: aleoRecord as any,
        fhenixAttestation: fhenixAttestation as any,
      },
      create: {
        userId,
        walletAddress: user.walletAddress,
        claims: claims as any,
        signature,
        issuedAt,
        expiresAt,
        midnightProof: midnightProof as any,
        aleoRecord: aleoRecord as any,
        fhenixAttestation: fhenixAttestation as any,
      },
    });

    // Clear caches
    const client = this.redisService.getClient();
    await client.del(`credentials:midnight:${userId}`);
    await client.del(`credentials:aleo:${userId}`);
    await client.del(`credentials:fhenix:${userId}`);
    
    return formattedPayload;
  }

  async getCredential(userId: string) {
    const cred = await this.prisma.credential.findUnique({
      where: { userId },
    });

    if (!cred || cred.revokedAt || cred.expiresAt < new Date()) {
      throw new ForbiddenException('Valid credential not found');
    }

    return cred;
  }

  async revoke(userId: string) {
    await this.prisma.credential.update({
      where: { userId },
      data: { revokedAt: new Date() },
    });

    const client = this.redisService.getClient();
    await client.del(`credentials:midnight:${userId}`);
    await client.del(`credentials:aleo:${userId}`);
    await client.del(`credentials:fhenix:${userId}`);
  }

  async refresh(userId: string) {
    return this.issue(userId);
  }

  async getFormattedProof(userId: string, chain: 'midnight' | 'aleo' | 'fhenix') {
    const cacheKey = `credentials:${chain}:${userId}`;
    const client = this.redisService.getClient();
    const cached = await client.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const cred = await this.getCredential(userId);
    
    let result: any;
    if (chain === 'midnight') result = cred.midnightProof;
    if (chain === 'aleo') result = cred.aleoRecord;
    if (chain === 'fhenix') result = cred.fhenixAttestation;

    if (!result) {
      throw new NotFoundException(`Proof for chain ${chain} not found`);
    }

    // TTL = expiry date - now
    const ttlSeconds = Math.max(1, Math.floor((cred.expiresAt.getTime() - Date.now()) / 1000));
    await client.set(cacheKey, JSON.stringify(result), 'EX', ttlSeconds);

    return result;
  }
}
