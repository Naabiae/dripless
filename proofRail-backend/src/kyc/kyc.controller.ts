import { Controller, Post, Get, UseGuards, Req, Body, HttpCode, HttpStatus, UnauthorizedException, Headers } from '@nestjs/common';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@ApiTags('KYC')
@Controller('kyc')
export class KycController {
  constructor(
    private readonly kycService: KycService,
    private configService: ConfigService,
    @InjectQueue('kyc') private kycQueue: Queue,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('initiate')
  initiate(@Req() req: any) {
    return this.kycService.createSession(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('status')
  getStatus(@Req() req: any) {
    return this.kycService.getStatus(req.user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('webhook')
  async webhook(@Body() payload: any, @Headers('X-Signature-V2') signature: string) {
    if (!signature) throw new UnauthorizedException('Missing signature');
    
    await this.kycQueue.add('processWebhook', payload);
    return { received: true };
  }
}
