import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Param, Get } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { RaiseDisputeDto, SubmitEvidenceDto, ResolveDisputeDto } from './dto/raise-dispute.dto';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@ApiTags('Disputes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post('disputes')
  raiseDispute(@Req() req: any, @Body() dto: RaiseDisputeDto) {
    return this.disputesService.raise(req.user.id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('disputes/:id/evidence')
  submitEvidence(@Param('id') disputeId: string, @Req() req: any, @Body() dto: SubmitEvidenceDto) {
    return this.disputesService.submitEvidence(disputeId, req.user.id, dto);
  }

  @Get('disputes/:id')
  getDispute(@Param('id') disputeId: string, @Req() req: any) {
    return this.disputesService.getDispute(disputeId, req.user.id, req.user.role);
  }

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Post('admin/disputes/:id/resolve')
  resolveDispute(@Param('id') disputeId: string, @Req() req: any, @Body() dto: ResolveDisputeDto) {
    return this.disputesService.resolve(disputeId, req.user.id, dto);
  }

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Get('admin/disputes')
  listOpenDisputes() {
    return this.disputesService.listOpen();
  }
}
