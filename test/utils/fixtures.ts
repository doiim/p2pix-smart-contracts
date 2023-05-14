import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";

import {
  MockToken,
  Multicall,
  P2PIX,
  P2PIX__factory,
  Reputation,
} from "../../src/types";

// exported interfaces
export interface Deploys {
  signers: string[];
  p2pix: string;
  token: string;
}

export interface Lock {
  sellerKey: BigNumber;
  counter: BigNumber;
  relayerPremium: BigNumber;
  amount: BigNumber;
  expirationBlock: BigNumber;
  pixTarget: BigNumber;
  buyerAddress: string;
  relayerAddress: string;
  token: string;
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

type P2PixAndReputation = P2pixFixture &
  RepFixture &
  MtcFixture;

// exported constants
export const getSignerAddrs = (
  amount: number,
  addrs: SignerWithAddress[],
): string[] => {
  return addrs.slice(0, amount).map(({ address }) => address);
};

export const getBnFrom = (nums: number[]): BigNumber[] => {
  const bns = nums.map(num => ethers.BigNumber.from(num));
  return bns;
};

export const getLockData = (
  addr: string,
  locks: BigNumber[][],
): Call[] => {
  const iface = new ethers.utils.Interface(
    P2PIX__factory.abi,
  );
  return locks.map(lock => ({
    target: addr,
    callData: iface.encodeFunctionData("getLocksStatus", [
      lock,
    ]),
  }));
};

export const randomSigners = (amount: number): Signer[] => {
  const signers: Signer[] = [];
  for (let i = 0; i < amount; i++) {
    signers.push(ethers.Wallet.createRandom());
  }
  return signers;
};

export const getError = (Error: string) =>
  ethers.utils
    .keccak256(ethers.utils.toUtf8Bytes(Error))
    .slice(0, 10);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const padBuffer = (addr: any) => {
  return Buffer.from(
    addr.substr(2).padStart(32 * 2, 0),
    "hex",
  );
};

export const curve = (x: number): number => {
  return Math.round(
    1 + (10 ** 6 * x) / Math.sqrt(2.5 * 10 ** 11 + x * x),
  );
};

// exported async functions
export async function repFixture(): Promise<RepFixture> {
  const Reputation = await ethers.getContractFactory(
    "Reputation",
  );
  const reputation =
    (await Reputation.deploy()) as Reputation;

  return { reputation };
}

export async function p2pixFixture(): Promise<P2PixAndReputation> {
  const validSigners = getSignerAddrs(
    2,
    await ethers.getSigners(),
  );

  const Reputation = await ethers.getContractFactory(
    "Reputation",
  );
  const reputation =
    (await Reputation.deploy()) as Reputation;

  const ERC20 = await ethers.getContractFactory("MockToken");
  const erc20 = (await ERC20.deploy(
    ethers.utils.parseEther("20000000"), // 20M
  )) as MockToken;

  const P2PIX = await ethers.getContractFactory("P2PIX");
  const p2pix = (await P2PIX.deploy(
    10,
    validSigners,
    reputation.address,
    [erc20.address],
    [true],
  )) as P2PIX;

  const Multicall = await ethers.getContractFactory(
    "Multicall",
  );
  const multicall = (await Multicall.deploy()) as Multicall;

  const signers = await ethers.getSigners();
  const whitelisted = signers.slice(0, 2);
  const leaves = whitelisted.map(account =>
    padBuffer(account.address),
  );
  const tree = new MerkleTree(leaves, keccak256, {
    sort: true,
  });
  const merkleRoot: string = tree.getHexRoot();
  const proof: string[] = tree.getHexProof(
    padBuffer(whitelisted[1].address),
  );

  return {
    multicall,
    reputation,
    erc20,
    p2pix,
    merkleRoot,
    proof,
  };
}
