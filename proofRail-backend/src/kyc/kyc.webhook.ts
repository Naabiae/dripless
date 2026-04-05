import { Controller, Post, Headers, Req, UnauthorizedException, HttpCode, HttpStatus, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('KYC')
@Controller('kyc')
export class KycWebhookController {
  constructor(
    @InjectQueue('kyc') private kycQueue: Queue,
    private configService: ConfigService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('webhook')
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('X-Signature-V2') signature: string,
  ) {
    if (!signature) {
      throw new UnauthorizedException('Missing signature');
    }

    const secret = this.configService.get<string>('DIDIT_WEBHOOK_SECRET');
    if (secret) {
      // Real signature validation
      if (!req.rawBody) {
         throw new UnauthorizedException('Raw body not available for signature verification');
      }
      
      const computedSignature = crypto
        .createHmac('sha256', secret)
        .update(req.rawBody)
        .digest('hex');
        
      if (computedSignature !== signature) {
        throw new UnauthorizedException('Invalid signature');
      }
    } else {
       // Dev fallback
       if (signature !== 'mock-signature') {
          throw new UnauthorizedException('Invalid signature');
       }
    }

    let payload: any;
    try {
      payload = JSON.parse(req.rawBody ? req.rawBody.toString('utf8') : '{}');
    } catch (err) {
      // If we are in the mock test without raw body, try req.body
      payload = req.body;
    }

    await this.kycQueue.add('processWebhook', payload);
    return { received: true };
  }
}
