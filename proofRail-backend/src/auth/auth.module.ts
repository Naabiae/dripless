import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        privateKey: configService.get<string>('jwt.privateKey') || 'secret',
        publicKey: configService.get<string>('jwt.publicKey') || 'secret',
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessExpiresIn') as any,
          algorithm: configService.get<string>('NODE_ENV') === 'test' ? 'HS256' : 'RS256',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
