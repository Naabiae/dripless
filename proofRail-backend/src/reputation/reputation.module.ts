import { Module } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { ReputationController } from './reputation.controller';
import { PrismaService } from '../core/prisma/prisma.service';

@Module({
  providers: [ReputationService, PrismaService],
  controllers: [ReputationController],
  exports: [ReputationService],
})
export class ReputationModule {}
