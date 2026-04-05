import { Module } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CredentialsController } from './credentials.controller';
import { MidnightAdapter } from './adapters/midnight.adapter';
import { AleoAdapter } from './adapters/aleo.adapter';
import { FhenixAdapter } from './adapters/fhenix.adapter';
import { MidnightModule } from '../midnight/midnight.module';

@Module({
  imports: [MidnightModule],
  providers: [
    CredentialsService,
    MidnightAdapter,
    AleoAdapter,
    FhenixAdapter,
  ],
  controllers: [CredentialsController],
  exports: [CredentialsService],
})
export class CredentialsModule {}
