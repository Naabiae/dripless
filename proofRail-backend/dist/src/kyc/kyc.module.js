"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const kyc_service_1 = require("./kyc.service");
const kyc_controller_1 = require("./kyc.controller");
const kyc_webhook_1 = require("./kyc.webhook");
const webhook_processor_1 = require("../queue/webhook.processor");
let KycModule = class KycModule {
};
exports.KycModule = KycModule;
exports.KycModule = KycModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({
                name: 'kyc',
            }),
        ],
        controllers: [kyc_controller_1.KycController, kyc_webhook_1.KycWebhookController],
        providers: [kyc_service_1.KycService, webhook_processor_1.WebhookProcessor],
        exports: [kyc_service_1.KycService],
    })
], KycModule);
//# sourceMappingURL=kyc.module.js.map