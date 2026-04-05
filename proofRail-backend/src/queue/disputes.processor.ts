import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../core/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

@Processor('disputes')
export class DisputesProcessor extends WorkerHost {
  private readonly logger = new Logger(DisputesProcessor.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'checkDisputeSLA') {
      const { disputeId } = job.data;
      const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
      
      if (dispute && (dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW')) {
        this.logger.warn(`Dispute ${disputeId} exceeded 48h SLA. Escalating to SUPER ADMIN.`);
        await this.prisma.dispute.update({
          where: { id: disputeId },
          data: { status: 'ESCALATED' },
        });
        this.eventEmitter.emit('dispute.escalated', { disputeId });
      }
    }
  }
}
