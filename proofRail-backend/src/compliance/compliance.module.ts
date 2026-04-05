import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { SanctionsService } from './sanctions.service';
import { AmlService } from './aml.service';
import { TxMonitorService } from './tx-monitor.service';
import { ComplianceController } from './compliance.controller';
import { ComplianceListener } from './compliance.listener';

@Module({
  providers: [
    ComplianceService,
    SanctionsService,
    AmlService,
    TxMonitorService,
    ComplianceListener,
  ],
  controllers: [ComplianceController],
  exports: [ComplianceService, AmlService],
})
export class ComplianceModule {}
