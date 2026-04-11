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
exports.AmlService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const tx_monitor_service_1 = require("./tx-monitor.service");
let AmlService = class AmlService {
    configService;
    txMonitor;
    constructor(configService, txMonitor) {
        this.configService = configService;
        this.txMonitor = txMonitor;
    }
    async runAml(userId) {
        const { withinLimits, totalVolumeUsd } = await this.txMonitor.checkVolume(userId);
        if (!withinLimits) {
            return { status: 'FLAGGED', result: { reason: 'Rolling 30-day volume exceeded threshold', volume: totalVolumeUsd } };
        }
        return { status: 'CLEAR', result: { reason: 'Within AML thresholds', volume: totalVolumeUsd } };
    }
    async checkThresholds(userId, tradeAmountUsd) {
        const singleThreshold = Number(this.configService.get('AML_VOLUME_THRESHOLD_USD')) || 10000;
        if (tradeAmountUsd > singleThreshold) {
            return false;
        }
        const { totalVolumeUsd } = await this.txMonitor.checkVolume(userId);
        const rollingThreshold = Number(this.configService.get('AML_ROLLING_30D_THRESHOLD_USD')) || 50000;
        if (totalVolumeUsd + tradeAmountUsd > rollingThreshold) {
            return false;
        }
        return true;
    }
};
exports.AmlService = AmlService;
exports.AmlService = AmlService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        tx_monitor_service_1.TxMonitorService])
], AmlService);
//# sourceMappingURL=aml.service.js.map