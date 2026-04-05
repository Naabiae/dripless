import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../core/prisma/prisma.service';
import { RedisService } from '../core/redis/redis.service';
import * as argon2 from 'argon2';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { WalletVerifyDto } from './dto/wallet-auth.dto';
import { ethers } from 'ethers';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash },
    });

    return this.generateTokens(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id);
  }

  async walletNonce(address: string) {
    const nonce = `ProofRail-Login-${randomBytes(16).toString('hex')}`;
    await this.redisService.getClient().set(`nonce:${address.toLowerCase()}`, nonce, 'EX', 300);
    return { nonce };
  }

  async walletVerify(dto: WalletVerifyDto) {
    const { address, signature } = dto;
    const lowerAddress = address.toLowerCase();
    const nonce = await this.redisService.getClient().get(`nonce:${lowerAddress}`);
    
    if (!nonce) {
      throw new UnauthorizedException('Nonce expired or invalid');
    }

    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.utils.verifyMessage(nonce, signature).toLowerCase();
    } catch (e) {
      throw new UnauthorizedException('Invalid signature');
    }

    if (recoveredAddress !== lowerAddress) {
      throw new UnauthorizedException('Signature does not match address');
    }

    await this.redisService.getClient().del(`nonce:${lowerAddress}`);

    let user = await this.prisma.user.findUnique({ where: { walletAddress: lowerAddress } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { walletAddress: lowerAddress },
      });
    }

    return this.generateTokens(user.id);
  }

  async refreshTokens(refreshToken: string) {
    const userId = await this.redisService.getClient().get(`refresh:${refreshToken}`);
    if (!userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateTokens(userId);
  }

  async logout(userId: string, token: string) {
    const decoded = this.jwtService.decode(token) as any;
    if (decoded && decoded.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redisService.getClient().set(`blacklist:${token}`, 'true', 'EX', ttl);
      }
    }
    // we don't know the refresh token here unless passed, so we might have to scan or let it expire.
    // Or we could store a set of refresh tokens per user.
  }

  private async generateTokens(userId: string) {
    const accessToken = this.jwtService.sign({ sub: userId, id: userId });
    const refreshToken = randomBytes(32).toString('hex');
    
    await this.redisService.getClient().set(
      `refresh:${refreshToken}`,
      userId,
      'EX',
      7 * 24 * 60 * 60 // 7 days
    );

    return { accessToken, refreshToken };
  }
}
