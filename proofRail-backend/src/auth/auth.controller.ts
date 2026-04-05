import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { WalletNonceDto, WalletVerifyDto } from './dto/wallet-auth.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('wallet/nonce')
  walletNonce(@Body() dto: WalletNonceDto) {
    return this.authService.walletNonce(dto.address);
  }

  @HttpCode(HttpStatus.OK)
  @Post('wallet/verify')
  walletVerify(@Body() dto: WalletVerifyDto) {
    return this.authService.walletVerify(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Req() req: any) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.authService.logout(req.user.id, token);
  }
}
