import { RedisService } from '../core/redis/redis.service';
export declare class TxMonitorService {
    private redisService;
    private readonly logger;
    constructor(redisService: RedisService);
    recordTradeVolume(userId: string, amountUsd: number): Promise<void>;
    checkVolume(userId: string): Promise<{
        withinLimits: boolean;
        totalVolumeUsd: number;
    }>;
}
