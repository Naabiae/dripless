import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TxMonitorService } from './tx-monitor.service';

@Injectable()
export class AmlService {
  constructor(
    private configService: ConfigService,
    private txMonitor: TxMonitorService,
  ) {}

  async runAml(userId: string): Promise<{ status: 'CLEAR' | 'FLAGGED'; result: any }> {
    const { withinLimits, totalVolumeUsd } = await this.txMonitor.checkVolume(userId);

    if (!withinLimits) {
      return { status: 'FLAGGED', result: { reason: 'Rolling 30-day volume exceeded threshold', volume: totalVolumeUsd } };
    }

    return { status: 'CLEAR', result: { reason: 'Within AML thresholds', volume: totalVolumeUsd } };
  }

  async checkThresholds(userId: string, tradeAmountUsd: number): Promise<boolean> {
    const singleThreshold = Number(this.configService.get('AML_VOLUME_THRESHOLD_USD')) || 10000;
    if (tradeAmountUsd > singleThreshold) {
      return false; // FLAGGED
    }

    const { totalVolumeUsd } = await this.txMonitor.checkVolume(userId);
    const rollingThreshold = Number(this.configService.get('AML_ROLLING_30D_THRESHOLD_USD')) || 50000;

    if (totalVolumeUsd + tradeAmountUsd > rollingThreshold) {
      return false; // FLAGGED
    }

    return true; // CLEAR
  }
}
