import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProviderService implements OnModuleInit {
  private readonly logger = new Logger(ProviderService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Checking proof server connection...');
    const proofServerUrl = this.configService.get<string>('MIDNIGHT_PROOF_SERVER_URL') || 'http://localhost:6300';
    try {
      const response = await fetch(`${proofServerUrl}/health`);
      if (response.ok) {
        this.logger.log('Proof server is online.');
      } else {
        this.logger.warn(`Proof server returned status: ${response.status}`);
      }
    } catch (e) {
      this.logger.warn(`Failed to connect to proof server at ${proofServerUrl}. Ensure it is running.`);
    }
  }

  getProofServerUrl(): string {
    return this.configService.get<string>('MIDNIGHT_PROOF_SERVER_URL') || 'http://localhost:6300';
  }

  getIndexerUrl(): string {
    return this.configService.get<string>('MIDNIGHT_INDEXER_URL') || 'https://indexer.preprod.midnight.network';
  }

  getNodeUrl(): string {
    return this.configService.get<string>('MIDNIGHT_NODE_URL') || 'https://rpc.preprod.midnight.network';
  }
}
