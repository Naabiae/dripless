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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../core/prisma/prisma.service");
const redis_service_1 = require("../core/redis/redis.service");
const argon2 = __importStar(require("argon2"));
const ethers_1 = require("ethers");
const crypto_1 = require("crypto");
const config_1 = require("@nestjs/config");
let AuthService = class AuthService {
    prisma;
    jwtService;
    redisService;
    configService;
    constructor(prisma, jwtService, redisService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.redisService = redisService;
        this.configService = configService;
    }
    async register(dto) {
        const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existingUser) {
            throw new common_1.BadRequestException('User already exists');
        }
        const passwordHash = await argon2.hash(dto.password);
        const user = await this.prisma.user.create({
            data: { email: dto.email, passwordHash },
        });
        return this.generateTokens(user.id);
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const valid = await argon2.verify(user.passwordHash, dto.password);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return this.generateTokens(user.id);
    }
    async walletNonce(address) {
        const nonce = `ProofRail-Login-${(0, crypto_1.randomBytes)(16).toString('hex')}`;
        await this.redisService.getClient().set(`nonce:${address.toLowerCase()}`, nonce, 'EX', 300);
        return { nonce };
    }
    async walletVerify(dto) {
        const { address, signature } = dto;
        const lowerAddress = address.toLowerCase();
        const nonce = await this.redisService.getClient().get(`nonce:${lowerAddress}`);
        if (!nonce) {
            throw new common_1.UnauthorizedException('Nonce expired or invalid');
        }
        let recoveredAddress;
        try {
            recoveredAddress = ethers_1.ethers.utils.verifyMessage(nonce, signature).toLowerCase();
        }
        catch (e) {
            throw new common_1.UnauthorizedException('Invalid signature');
        }
        if (recoveredAddress !== lowerAddress) {
            throw new common_1.UnauthorizedException('Signature does not match address');
        }
        await this.redisService.getClient().del(`nonce:${lowerAddress}`);
        let user = await this.prisma.user.findUnique({ where: { walletAddress: lowerAddress } });
        if (!user) {
            user = await this.prisma.user.create({
                data: { walletAddress: lowerAddress },
            });
        }
        return this.generateTokens(user.id);
    }
    async refreshTokens(refreshToken) {
        const userId = await this.redisService.getClient().get(`refresh:${refreshToken}`);
        if (!userId) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        return this.generateTokens(userId);
    }
    async logout(userId, token) {
        const decoded = this.jwtService.decode(token);
        if (decoded && decoded.exp) {
            const ttl = decoded.exp - Math.floor(Date.now() / 1000);
            if (ttl > 0) {
                await this.redisService.getClient().set(`blacklist:${token}`, 'true', 'EX', ttl);
            }
        }
    }
    async generateTokens(userId) {
        const accessToken = this.jwtService.sign({ sub: userId, id: userId });
        const refreshToken = (0, crypto_1.randomBytes)(32).toString('hex');
        await this.redisService.getClient().set(`refresh:${refreshToken}`, userId, 'EX', 7 * 24 * 60 * 60);
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        redis_service_1.RedisService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map