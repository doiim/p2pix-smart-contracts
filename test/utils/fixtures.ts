import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Signer } from "ethers";
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

import { Call, RepFixture, P2PixAndReputation, DepositArgs, LockArgs, ReleaseArgs } from "./interfaces";

// exported constants
export const getSignerAddrs = (
  amount: number,
  addrs: SignerWithAddress[],
): string[] => {
  return addrs.slice(0, amount).map(({ address }) => address);
};

export const getBnFrom = (nums: number[]): BigInt[] => {
  const bns = nums.map(num => BigInt(num));
  return bns;
};

export const getLockData = (
  addr: string,
  locks: BigInt[][],
): Call[] => {
  const iface = new ethers.Interface(
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
  const reputation = await ethers.deployContract("Reputation");
  return { reputation: await reputation.waitForDeployment()  };
}

export async function p2pixFixture(): Promise<P2PixAndReputation> {
  const validSigners = getSignerAddrs(
    2,
    await ethers.getSigners(),
  );

  const reputation = await ethers.deployContract("Reputation");

  const erc20 = await ethers.deployContract("MockToken", [
    ethers.parseEther("20000000") // 20M
  ]) as MockToken;

  const p2pix = await ethers.deployContract("P2PIX", [
    10,
    validSigners,
    reputation.target,
    [erc20.target],
    [true],
    ethers.ZeroAddress,
  ]);

  const multicall = await ethers.deployContract("Multicall");

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
    multicall: await multicall.waitForDeployment(),
    reputation: await reputation.waitForDeployment(),
    erc20: await erc20.waitForDeployment(),
    p2pix: await p2pix.waitForDeployment(),
    merkleRoot,
    proof,
  };
}
