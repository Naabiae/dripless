import { ConfigService } from '@nestjs/config';
import { TxMonitorService } from './tx-monitor.service';
export declare class AmlService {
    private configService;
    private txMonitor;
    constructor(configService: ConfigService, txMonitor: TxMonitorService);
    runAml(userId: string): Promise<{
        status: 'CLEAR' | 'FLAGGED';
        result: any;
    }>;
    checkThresholds(userId: string, tradeAmountUsd: number): Promise<boolean>;
}
