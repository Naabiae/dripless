import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../core/redis/redis.service';

@Injectable()
export class TxMonitorService {
  private readonly logger = new Logger(TxMonitorService.name);

  constructor(private redisService: RedisService) {}

  async recordTradeVolume(userId: string, amountUsd: number) {
    const key = `compliance:volume:${userId}`;
    const client = this.redisService.getClient();
    const timestamp = Date.now();

    // Store trade as a sorted set element with score = timestamp
    await client.zadd(key, timestamp, `${timestamp}:${amountUsd}`);
    
    // Remove trades older than 30 days
    const thirtyDaysAgo = timestamp - 30 * 24 * 60 * 60 * 1000;
    await client.zremrangebyscore(key, '-inf', thirtyDaysAgo);
    
    // Set TTL on the key to 30 days
    await client.expire(key, 30 * 24 * 60 * 60);
  }

  async checkVolume(userId: string): Promise<{ withinLimits: boolean; totalVolumeUsd: number }> {
    const key = `compliance:volume:${userId}`;
    const client = this.redisService.getClient();
    const timestamp = Date.now();
    const thirtyDaysAgo = timestamp - 30 * 24 * 60 * 60 * 1000;

    // Clean up old entries first
    await client.zremrangebyscore(key, '-inf', thirtyDaysAgo);

    // Get all trades in last 30 days
    const trades = await client.zrange(key, 0, -1);
    
    let totalVolumeUsd = 0;
    for (const trade of trades) {
      const [, amountStr] = trade.split(':');
      totalVolumeUsd += Number(amountStr);
    }

    const rollingThreshold = Number(process.env.AML_ROLLING_30D_THRESHOLD_USD) || 50000;

    return {
      withinLimits: totalVolumeUsd <= rollingThreshold,
      totalVolumeUsd,
    };
  }
}
