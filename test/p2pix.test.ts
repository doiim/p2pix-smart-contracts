import "@nomicfoundation/hardhat-chai-matchers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Wallet } from "ethers";
import { ethers, network } from "hardhat";

import { MockToken, P2PIX, Reputation } from "../src/types";
import { P2PixErrors } from "./utils/errors";
import {
  // getSignerAddrs,
  p2pixFixture,
  randomSigners,
} from "./utils/fixtures";

describe("P2PIX", () => {
  type WalletWithAddress = Wallet & SignerWithAddress;

  // contract deployer/admin
  let owner: WalletWithAddress;

  // extra EOAs
  let acc01: WalletWithAddress;
  let acc02: WalletWithAddress;
  let acc03: WalletWithAddress;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let res: any;

  let p2pix: P2PIX; // Contract instance
  let erc20: MockToken; // Token instance
  let reputation: Reputation; // Reputation Interface instance;

  const fundAmount: BigNumber =
    ethers.utils.parseEther("10000");
  const price: BigNumber = ethers.utils.parseEther("100");

  const zero = ethers.constants.AddressZero;

  before("Set signers and reset network", async () => {
    [owner, acc01, acc02, acc03] =
      await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ethers as any).getSigners();

    await network.provider.send("hardhat_reset");
  });
  beforeEach("Load deployment fixtures", async () => {
    ({ erc20, p2pix, reputation } = await loadFixture(
      p2pixFixture,
    ));
  });

  describe("Init", async () => {
    it("P2PIX, Reputation and ERC20 should initialize", async () => {
      await p2pix.deployed();
      await erc20.deployed();
      await reputation.deployed();
      expect(p2pix).to.be.ok;
      expect(erc20).to.be.ok;
      expect(reputation).to.be.ok;

      const ownerKey = await p2pix._castAddrToKey(
        owner.address,
      );
      const acc01Key = await p2pix._castAddrToKey(
        acc01.address,
      );

      // storage checks
      expect(
        await p2pix.callStatic.defaultLockBlocks(),
      ).to.eq(4);
      expect(await p2pix.callStatic.reputation()).to.eq(
        reputation.address,
      );
      expect(await p2pix.callStatic.depositCount()).to.eq(0);
      expect(
        await p2pix.callStatic.validBacenSigners(ownerKey),
      ).to.eq(true);
      expect(
        await p2pix.callStatic.validBacenSigners(acc01Key),
      ).to.eq(true);
      expect(
        await p2pix.callStatic.allowedERC20s(erc20.address),
      ).to.eq(true);

      // event emission
      await expect(await p2pix.deployTransaction)
        .to.emit(p2pix, "OwnerUpdated")
        .withArgs(zero, owner.address)
        .and.to.emit(p2pix, "LockBlocksUpdated")
        .withArgs(4)
        .and.to.emit(p2pix, "ReputationUpdated")
        .withArgs(reputation.address)
        .and.to.emit(p2pix, "ValidSignersUpdated")
        .withArgs([owner.address, acc01.address])
        .and.to.emit(p2pix, "AllowedERC20Updated")
        .withArgs(erc20.address, true);
    });

    it("accounts have been funded", async () => {
      // can't be eq to fundAmount due to contract deployment cost
      res = await ethers.provider.getBalance(owner.address);
      expect(res.toString()).to.have.lengthOf(22);
      // console.log(res); // lengthOf = 22
      // console.log(fundAmount); // lengthOf = 23

      // those should eq to hardhat prefunded account's value
      expect(
        await ethers.provider.getBalance(acc01.address),
      ).to.eq(fundAmount);
      expect(
        await ethers.provider.getBalance(acc02.address),
      ).to.eq(fundAmount);
      expect(
        await ethers.provider.getBalance(acc03.address),
      ).to.eq(fundAmount);
    });
  });

  // each describe tests a set of functionalities of the contract's behavior
  describe("Owner Functions", async () => {
    it("should allow owner to withdraw contract's balance", async () => {
      const oldBal = await p2pix.provider.getBalance(
        p2pix.address,
      );
      // this call also tests p2pix's receive() fallback mechanism.
      const tx1 = await acc01.sendTransaction({
        to: p2pix.address,
        value: price,
      });
      const newBal = await p2pix.provider.getBalance(
        p2pix.address,
      );

      expect(tx1).to.be.ok;
      expect(oldBal).to.eq(0);
      expect(newBal).to.eq(price);

      await expect(p2pix.withdrawBalance())
        .to.changeEtherBalances(
          [owner.address, p2pix.address],
          [price, "-100000000000000000000"],
        )
        .and.to.emit(p2pix, "FundsWithdrawn")
        .withArgs(owner.address, price);

      await expect(
        p2pix.connect(acc01).withdrawBalance(),
      ).to.be.revertedWith(P2PixErrors.UNAUTHORIZED);
    });
    it("should allow owner to change reputation instance", async () => {
      const tx = await p2pix.setReputation(acc03.address);
      const newRep = await p2pix.callStatic.reputation();
      const fail = p2pix
        .connect(acc02)
        .setReputation(owner.address);

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "ReputationUpdated")
        .withArgs(acc03.address);
      expect(newRep).to.eq(acc03.address);
      await expect(fail).to.be.revertedWith(
        P2PixErrors.UNAUTHORIZED,
      );
    });
    it("should allow owner to change defaultLockBlocks ", async () => {
      const magicVal = 1337;
      const tx = await p2pix.setDefaultLockBlocks(magicVal);
      const newVal =
        await p2pix.callStatic.defaultLockBlocks();
      const fail = p2pix
        .connect(acc02)
        .setDefaultLockBlocks(0);

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "LockBlocksUpdated")
        .withArgs(magicVal);
      expect(newVal).to.eq(magicVal);
      await expect(fail).to.be.revertedWith(
        P2PixErrors.UNAUTHORIZED,
      );
    });
    it("should allow owner to add valid Bacen signers", async () => {
      const newSigners = randomSigners(2);
      const bob = await newSigners[0].getAddress();
      const alice = await newSigners[1].getAddress();
      const bobCasted = await p2pix._castAddrToKey(bob);
      const aliceCasted = await p2pix._castAddrToKey(alice);
      const tx = await p2pix.setValidSigners([bob, alice]);
      const newSigner1 =
        await p2pix.callStatic.validBacenSigners(bobCasted);
      const newSigner2 =
        await p2pix.callStatic.validBacenSigners(aliceCasted);
      const fail = p2pix
        .connect(acc03)
        .setValidSigners([owner.address, acc02.address]);

      expect(tx).to.be.ok;
      expect(newSigner1).to.eq(true);
      expect(newSigner2).to.eq(true);
      await expect(tx)
        .to.emit(p2pix, "ValidSignersUpdated")
        .withArgs([bob, alice]);
      await expect(fail).to.be.revertedWith(
        P2PixErrors.UNAUTHORIZED,
      );
    });
    it("should allow owner to adjust tokenSettings", async () => {
      const tx = await p2pix.tokenSettings(
        [erc20.address, owner.address],
        [false, true],
      );
      const newTokenState1 =
        await p2pix.callStatic.allowedERC20s(erc20.address);
      const newTokenState2 =
        await p2pix.callStatic.allowedERC20s(owner.address);
      const fail = p2pix
        .connect(acc01)
        .tokenSettings([acc01.address], [false]);

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "AllowedERC20Updated")
        .withArgs(erc20.address, false)
        .and.to.emit(p2pix, "AllowedERC20Updated")
        .withArgs(owner.address, true);
      expect(newTokenState1).to.eq(false);
      expect(newTokenState2).to.eq(true);
      await expect(fail).to.be.revertedWith(
        P2PixErrors.UNAUTHORIZED,
      );
    });
  });
});
