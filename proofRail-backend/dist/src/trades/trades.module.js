"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradesModule = void 0;
const common_1 = require("@nestjs/common");
const trades_service_1 = require("./trades.service");
const escrow_service_1 = require("./escrow.service");
const trades_controller_1 = require("./trades.controller");
const bullmq_1 = require("@nestjs/bullmq");
const compliance_module_1 = require("../compliance/compliance.module");
const trades_processor_1 = require("../queue/trades.processor");
const midnight_module_1 = require("../midnight/midnight.module");
let TradesModule = class TradesModule {
};
exports.TradesModule = TradesModule;
exports.TradesModule = TradesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({
                name: 'trades',
            }),
            compliance_module_1.ComplianceModule,
            midnight_module_1.MidnightModule,
        ],
        providers: [trades_service_1.TradesService, escrow_service_1.EscrowService, trades_processor_1.TradesProcessor],
        controllers: [trades_controller_1.TradesController],
        exports: [trades_service_1.TradesService, escrow_service_1.EscrowService],
    })
], TradesModule);
//# sourceMappingURL=trades.module.js.map