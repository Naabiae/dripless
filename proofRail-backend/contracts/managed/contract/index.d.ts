import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  getClaimsCommitment(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  getWalletAddressHash(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  registerCredential(context: __compactRuntime.CircuitContext<PS>,
                     walletAddressHash_0: Uint8Array,
                     commitment_0: bigint,
                     expiresAt_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  verifyCredential(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  isVerified(context: __compactRuntime.CircuitContext<PS>,
             walletAddressHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  revokeCredential(context: __compactRuntime.CircuitContext<PS>,
                   walletAddressHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  registerCredential(context: __compactRuntime.CircuitContext<PS>,
                     walletAddressHash_0: Uint8Array,
                     commitment_0: bigint,
                     expiresAt_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  verifyCredential(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  isVerified(context: __compactRuntime.CircuitContext<PS>,
             walletAddressHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  revokeCredential(context: __compactRuntime.CircuitContext<PS>,
                   walletAddressHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  registerCredential(context: __compactRuntime.CircuitContext<PS>,
                     walletAddressHash_0: Uint8Array,
                     commitment_0: bigint,
                     expiresAt_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  verifyCredential(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  isVerified(context: __compactRuntime.CircuitContext<PS>,
             walletAddressHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  revokeCredential(context: __compactRuntime.CircuitContext<PS>,
                   walletAddressHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  credentialRegistry: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { status: number,
                                 expiresAt: bigint,
                                 commitment: bigint
                               };
    [Symbol.iterator](): Iterator<[Uint8Array, { status: number, expiresAt: bigint, commitment: bigint }]>
  };
  readonly round: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
