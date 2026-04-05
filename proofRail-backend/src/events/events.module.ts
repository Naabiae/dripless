import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
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
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
