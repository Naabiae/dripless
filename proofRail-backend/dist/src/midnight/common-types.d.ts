import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import type { DeployedContract, FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { ImpureCircuitId } from '@midnight-ntwrk/compact-js';
export declare const ProofRailKYCPrivateStateId = "proofRailKYCPrivateState";
export declare const ProofRailEscrowPrivateStateId = "proofRailEscrowPrivateState";
export type ProofRailKYCCircuits = ImpureCircuitId<any>;
export type ProofRailEscrowCircuits = ImpureCircuitId<any>;
export type ProofRailKYCProviders = MidnightProviders<ProofRailKYCCircuits, typeof ProofRailKYCPrivateStateId, any>;
export type ProofRailEscrowProviders = MidnightProviders<ProofRailEscrowCircuits, typeof ProofRailEscrowPrivateStateId, any>;
export type ProofRailKYCCContract = any;
export type ProofRailEscrowContract = any;
export type DeployedProofRailKYCCContract = DeployedContract<ProofRailKYCCContract> | FoundContract<ProofRailKYCCContract>;
export type DeployedProofRailEscrowContract = DeployedContract<ProofRailEscrowContract> | FoundContract<ProofRailEscrowContract>;
export interface WalletContext {
    wallet: any;
    shieldedSecretKeys: any;
    dustSecretKey: any;
    unshieldedKeystore: any;
}
export interface DeploymentRecord {
    network: string;
    timestamp: string;
    kycContract?: {
        address: string;
        deploymentHash: string;
    };
    escrowContract?: {
        address: string;
        deploymentHash: string;
    };
}
