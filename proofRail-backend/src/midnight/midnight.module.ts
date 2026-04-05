import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProviderService } from './provider.service';
import { WalletService } from './wallet.service';
import { MidnightKycService } from './midnight-kyc.service';
import { MidnightEscrowService } from './midnight-escrow.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    ProviderService,
    WalletService,
    MidnightKycService,
    MidnightEscrowService,
  ],
  exports: [
    ProviderService,
    WalletService,
    MidnightKycService,
    MidnightEscrowService,
  ],
})
export class MidnightModule {}
