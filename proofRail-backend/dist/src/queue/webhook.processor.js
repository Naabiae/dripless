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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const kyc_service_1 = require("../kyc/kyc.service");
let WebhookProcessor = class WebhookProcessor extends bullmq_1.WorkerHost {
    kycService;
    constructor(kycService) {
        super();
        this.kycService = kycService;
    }
    async process(job) {
        await this.kycService.processWebhook(job.data);
    }
};
exports.WebhookProcessor = WebhookProcessor;
exports.WebhookProcessor = WebhookProcessor = __decorate([
    (0, bullmq_1.Processor)('kyc'),
    __metadata("design:paramtypes", [kyc_service_1.KycService])
], WebhookProcessor);
//# sourceMappingURL=webhook.processor.js.map