"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceModule = void 0;
const common_1 = require("@nestjs/common");
const compliance_service_1 = require("./compliance.service");
const sanctions_service_1 = require("./sanctions.service");
const aml_service_1 = require("./aml.service");
const tx_monitor_service_1 = require("./tx-monitor.service");
const compliance_controller_1 = require("./compliance.controller");
const compliance_listener_1 = require("./compliance.listener");
let ComplianceModule = class ComplianceModule {
};
exports.ComplianceModule = ComplianceModule;
exports.ComplianceModule = ComplianceModule = __decorate([
    (0, common_1.Module)({
        providers: [
            compliance_service_1.ComplianceService,
            sanctions_service_1.SanctionsService,
            aml_service_1.AmlService,
            tx_monitor_service_1.TxMonitorService,
            compliance_listener_1.ComplianceListener,
        ],
        controllers: [compliance_controller_1.ComplianceController],
        exports: [compliance_service_1.ComplianceService, aml_service_1.AmlService],
    })
], ComplianceModule);
//# sourceMappingURL=compliance.module.js.map