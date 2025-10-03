import {
  MockToken,
  Multicall,
  P2PIX,
  Reputation,
} from "../../src/types";


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
  amount: BigInt;
  valid: boolean;
} 

export interface LockArgs {
  seller: string;
  token: string;
  amount: BigInt;
  merkleProof: string[];
  expiredLocks: BigInt[];
}

export interface ReleaseArgs {
  lockID: BigInt;
  pixTimestamp: string;
  signature: string;
}

export interface Lock {
  counter: BigInt;
  expirationBlock: BigInt;
  pixTarget: string;
  amount: BigInt;
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