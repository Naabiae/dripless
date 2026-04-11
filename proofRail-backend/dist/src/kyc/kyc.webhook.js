"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycWebhookController = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const bullmq_2 = require("@nestjs/bullmq");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
const swagger_1 = require("@nestjs/swagger");
let KycWebhookController = class KycWebhookController {
    kycQueue;
    configService;
    constructor(kycQueue, configService) {
        this.kycQueue = kycQueue;
        this.configService = configService;
    }
    async webhook(req, signature) {
        if (!signature) {
            throw new common_1.UnauthorizedException('Missing signature');
        }
        const secret = this.configService.get('DIDIT_WEBHOOK_SECRET');
        if (secret) {
            if (!req.rawBody) {
                throw new common_1.UnauthorizedException('Raw body not available for signature verification');
            }
            const computedSignature = crypto
                .createHmac('sha256', secret)
                .update(req.rawBody)
                .digest('hex');
            if (computedSignature !== signature) {
                throw new common_1.UnauthorizedException('Invalid signature');
            }
        }
        else {
            if (signature !== 'mock-signature') {
                throw new common_1.UnauthorizedException('Invalid signature');
            }
        }
        let payload;
        try {
            payload = JSON.parse(req.rawBody ? req.rawBody.toString('utf8') : '{}');
        }
        catch (err) {
            payload = req.body;
        }
        await this.kycQueue.add('processWebhook', payload);
        return { received: true };
    }
};
exports.KycWebhookController = KycWebhookController;
__decorate([
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('X-Signature-V2')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], KycWebhookController.prototype, "webhook", null);
exports.KycWebhookController = KycWebhookController = __decorate([
    (0, swagger_1.ApiTags)('KYC'),
    (0, common_1.Controller)('kyc'),
    __param(0, (0, bullmq_2.InjectQueue)('kyc')),
    __metadata("design:paramtypes", [bullmq_1.Queue,
        config_1.ConfigService])
], KycWebhookController);
//# sourceMappingURL=kyc.webhook.js.map