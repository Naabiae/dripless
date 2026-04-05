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
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { ScheduleModule } from '@nestjs/schedule';

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
    EventEmitterModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthModule,
    KycModule,
    ComplianceModule,
    CredentialsModule,
    TradesModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
