import { Controller, Get, UseGuards, Req, Param } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { KycVerifiedGuard } from '../core/guards/kyc-verified.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Credentials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, KycVerifiedGuard)
@Controller('credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Get('me')
  getCredential(@Req() req: any) {
    return this.credentialsService.getCredential(req.user.id);
  }

  @Get('midnight')
  getMidnightProof(@Req() req: any) {
    return this.credentialsService.getFormattedProof(req.user.id, 'midnight');
  }

  @Get('aleo')
  getAleoProof(@Req() req: any) {
    return this.credentialsService.getFormattedProof(req.user.id, 'aleo');
  }

  @Get('fhenix')
  getFhenixProof(@Req() req: any) {
    return this.credentialsService.getFormattedProof(req.user.id, 'fhenix');
  }
}
