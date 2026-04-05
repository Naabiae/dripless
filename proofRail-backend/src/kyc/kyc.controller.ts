import { Controller, Post, Get, UseGuards, Req, Body, HttpCode, HttpStatus, UnauthorizedException, Headers } from '@nestjs/common';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('KYC')
@Controller('kyc')
export class KycController {
  constructor(
    private readonly kycService: KycService,
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
}
