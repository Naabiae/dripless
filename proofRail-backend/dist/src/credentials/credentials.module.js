"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialsModule = void 0;
const common_1 = require("@nestjs/common");
const credentials_service_1 = require("./credentials.service");
const credentials_controller_1 = require("./credentials.controller");
const midnight_adapter_1 = require("./adapters/midnight.adapter");
const aleo_adapter_1 = require("./adapters/aleo.adapter");
const fhenix_adapter_1 = require("./adapters/fhenix.adapter");
const midnight_module_1 = require("../midnight/midnight.module");
let CredentialsModule = class CredentialsModule {
};
exports.CredentialsModule = CredentialsModule;
exports.CredentialsModule = CredentialsModule = __decorate([
    (0, common_1.Module)({
        imports: [midnight_module_1.MidnightModule],
        providers: [
            credentials_service_1.CredentialsService,
            midnight_adapter_1.MidnightAdapter,
            aleo_adapter_1.AleoAdapter,
            fhenix_adapter_1.FhenixAdapter,
        ],
        controllers: [credentials_controller_1.CredentialsController],
        exports: [credentials_service_1.CredentialsService],
    })
], CredentialsModule);
//# sourceMappingURL=credentials.module.js.map