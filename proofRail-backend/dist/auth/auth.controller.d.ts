import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { WalletNonceDto, WalletVerifyDto } from './dto/wallet-auth.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    walletNonce(dto: WalletNonceDto): Promise<{
        nonce: string;
    }>;
    walletVerify(dto: WalletVerifyDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refreshTokens(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(req: any): Promise<void>;
}
