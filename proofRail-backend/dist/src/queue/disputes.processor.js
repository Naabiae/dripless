"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DisputesProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputesProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const prisma_service_1 = require("../core/prisma/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const common_1 = require("@nestjs/common");
let DisputesProcessor = DisputesProcessor_1 = class DisputesProcessor extends bullmq_1.WorkerHost {
    prisma;
    eventEmitter;
    logger = new common_1.Logger(DisputesProcessor_1.name);
    constructor(prisma, eventEmitter) {
        super();
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async process(job) {
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
};
exports.DisputesProcessor = DisputesProcessor;
exports.DisputesProcessor = DisputesProcessor = DisputesProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('disputes'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], DisputesProcessor);
//# sourceMappingURL=disputes.processor.js.map