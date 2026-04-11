"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_config_1 = __importDefault(require("./core/config/app.config"));
const database_config_1 = __importDefault(require("./core/config/database.config"));
const redis_config_1 = __importDefault(require("./core/config/redis.config"));
const jwt_config_1 = __importDefault(require("./core/config/jwt.config"));
const prisma_module_1 = require("./core/prisma/prisma.module");
const redis_module_1 = require("./core/redis/redis.module");
const auth_module_1 = require("./auth/auth.module");
const health_controller_1 = require("./core/health/health.controller");
const kyc_module_1 = require("./kyc/kyc.module");
const compliance_module_1 = require("./compliance/compliance.module");
const credentials_module_1 = require("./credentials/credentials.module");
const trades_module_1 = require("./trades/trades.module");
const disputes_module_1 = require("./disputes/disputes.module");
const reputation_module_1 = require("./reputation/reputation.module");
const bullmq_1 = require("@nestjs/bullmq");
const events_module_1 = require("./events/events.module");
const midnight_module_1 = require("./midnight/midnight.module");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const schedule_1 = require("@nestjs/schedule");
const event_emitter_1 = require("@nestjs/event-emitter");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [app_config_1.default, database_config_1.default, redis_config_1.default, jwt_config_1.default],
            }),
            schedule_1.ScheduleModule.forRoot(),
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    connection: {
                        host: configService.get('redis.host'),
                        port: configService.get('redis.port'),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 100,
                }]),
            event_emitter_1.EventEmitterModule.forRoot(),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            auth_module_1.AuthModule,
            kyc_module_1.KycModule,
            compliance_module_1.ComplianceModule,
            credentials_module_1.CredentialsModule,
            trades_module_1.TradesModule,
            disputes_module_1.DisputesModule,
            reputation_module_1.ReputationModule,
            events_module_1.EventsModule,
            midnight_module_1.MidnightModule,
        ],
        controllers: [health_controller_1.HealthController],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map