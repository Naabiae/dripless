import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './core/config/app.config';
import databaseConfig from './core/config/database.config';
import redisConfig from './core/config/redis.config';
import jwtConfig from './core/config/jwt.config';
import { PrismaModule } from './core/prisma/prisma.module';
import { RedisModule } from './core/redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './core/health/health.controller';
import { KycModule } from './kyc/kyc.module';
import { ComplianceModule } from './compliance/compliance.module';
import { CredentialsModule } from './credentials/credentials.module';
import { TradesModule } from './trades/trades.module';
import { DisputesModule } from './disputes/disputes.module';
import { ReputationModule } from './reputation/reputation.module';
import { BullModule } from '@nestjs/bullmq';
import { EventsModule } from './events/events.module';
import { MidnightModule } from './midnight/midnight.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { ScheduleModule } from '@nestjs/schedule';

import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig],
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    EventEmitterModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthModule,
    KycModule,
    ComplianceModule,
    CredentialsModule,
    TradesModule,
    DisputesModule,
    ReputationModule,
    EventsModule,
    MidnightModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
