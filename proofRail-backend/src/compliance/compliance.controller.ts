import { Controller, Get, Post, Param, Body, UseGuards, Req, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { KycVerifiedGuard } from '../core/guards/kyc-verified.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@ApiTags('Compliance')
@Controller()
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, KycVerifiedGuard)
  @Get('compliance/status')
  getStatus(@Req() req: any) {
    return this.complianceService.getStatus(req.user.id);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('admin/compliance/:userId/block')
  blockUser(@Param('userId') userId: string, @Req() req: any) {
    return this.complianceService.blockUser(userId, req.user.id);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('admin/compliance/:userId/clear')
  clearUser(@Param('userId') userId: string, @Req() req: any) {
    return this.complianceService.clearUser(userId, req.user.id);
  }
}
