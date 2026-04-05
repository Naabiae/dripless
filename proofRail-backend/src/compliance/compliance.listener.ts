import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ComplianceService } from './compliance.service';

@Injectable()
export class ComplianceListener {
  constructor(private complianceService: ComplianceService) {}

  @OnEvent('kyc.approved')
  handleKycApprovedEvent(payload: { userId: string }) {
    this.complianceService.runFullCheck(payload.userId);
  }
}
