import type {
  MockToken,
  Multicall,
  P2PIX,
  Reputation,
} from "../../src/types/index.ts";

// exported interfaces
export interface Deploys {
  signers: string[];
  p2pix: string;
  token: string;
}

export interface DepositArgs {
  pixTarget: string;
  allowlistRoot: string;
  token: string;
  amount: bigint;
  valid: boolean;
}

export interface LockArgs {
  seller: string;
  token: string;
  amount: bigint;
  merkleProof: string[];
  expiredLocks: bigint[];
}

export interface Attestor {
  privateKey: string;
  address: string;
}

export interface Lock {
  counter: bigint;
  expirationBlock: bigint;
  pixTarget: string;
  amount: bigint;
  token: string;
  buyerAddress: string;
  seller: string;
}

export interface Call {
  target: string;
  callData: string;
}

export interface Result {
  success: boolean;
  returnData: string;
}

export interface P2pixFixture {
  p2pix: P2PIX;
  erc20: MockToken;
  proof: string[];
  merkleRoot: string;
  /** The Primus attestor the fixture allows. */
  attestor: Attestor;
  /** The prover's task wallet: the only accepted proof recipient. */
  prover: string;
}

export interface RepFixture {
  reputation: Reputation;
}

export interface MtcFixture {
  multicall: Multicall;
}

export type P2PixAndReputation = P2pixFixture &
  RepFixture &
  MtcFixture;
