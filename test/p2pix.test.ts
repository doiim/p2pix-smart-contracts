import "@nomicfoundation/hardhat-chai-matchers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Wallet } from "ethers";
import {
  ethers,
  network,
  /* , tracer */
} from "hardhat";

import { MockToken, P2PIX, Reputation } from "../src/types";
import { P2PixErrors } from "./utils/errors";
import {
  Deposit,
  Lock,
  getSignerAddrs,
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
      // tracer.enabled = true;
      await p2pix.deployed();
      // tracer.enabled = false;
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
      ).to.eq(10);
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
        .withArgs(10)
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
      const fail2 = p2pix.tokenSettings([], [true, false]);
      const fail3 = p2pix.tokenSettings([zero], [true, true]);

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
      await expect(fail).to.be.revertedWith(
        P2PixErrors.UNAUTHORIZED,
      );
      await expect(fail2).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.NoTokens,
      );
      await expect(fail3).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.LengthMismatch,
      );
    });
  });
  describe("Deposit", async () => {
    it("should revert if ERC20 is not allowed", async () => {
      const pTarget = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("_pixTarget"),
      );
      const root = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("root"),
      );
      const tx = p2pix.deposit(
        owner.address,
        1,
        pTarget,
        root,
      );

      await expect(tx).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.TokenDenied,
      );
    });
    /// @todo DepositAlreadyExists() seems to be unreacheable
    // it("should revert if deposit already exists", async () => {
    //   const pTarget = ethers.utils.keccak256(
    //     ethers.utils.toUtf8Bytes("_pixTarget"),
    //   );
    //   const root = ethers.utils.keccak256(
    //     ethers.utils.toUtf8Bytes("0"),
    //   );
    //   await erc20.approve(p2pix.address, 1);
    //   const tx = await p2pix.deposit(
    //     erc20.address,
    //     1,
    //     pTarget,
    //     root,
    //   );
    //   const info: Deposit = await p2pix.mapDeposits(0);
    //   // console.log(info)
    //   // console.log(info.valid);
    // });
    it("should create deposit, update storage and emit event", async () => {
      const pTarget = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("_pixTarget"),
      );
      // we use `hashZero` to avoid updating seller's allowlist settings
      const root = ethers.constants.HashZero;
      await erc20.approve(p2pix.address, price);
      const tx = await p2pix.deposit(
        erc20.address,
        price,
        pTarget,
        root,
      );
      const storage: Deposit = await p2pix.mapDeposits(0);
      const ownerKey = await p2pix.callStatic._castAddrToKey(
        owner.address,
      );
      const allowList = await p2pix.sellerAllowList(ownerKey);

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "DepositAdded")
        .withArgs(owner.address, 0, erc20.address, price);
      await expect(tx).to.changeTokenBalances(
        erc20,
        [owner.address, p2pix.address],
        ["-100000000000000000000", price],
      );
      expect(storage.remaining).to.eq(price);
      expect(storage.pixTarget).to.eq(pTarget);
      expect(storage.seller).to.eq(owner.address);
      expect(storage.token).to.eq(erc20.address);
      expect(storage.valid).to.eq(true);
      expect(allowList).to.eq(root);
    });
    // edge case test
    it("should create multiple deposits", async () => {
      const ownerKey = await p2pix.callStatic._castAddrToKey(owner.address);
      const acc01Key = await p2pix.callStatic._castAddrToKey(acc01.address);
      const acc02Key = await p2pix.callStatic._castAddrToKey(acc02.address);
      const acc03Key = await p2pix.callStatic._castAddrToKey(acc03.address);
      

      const pTarget = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("_pixTarget"),
      );
      const pTarget2 = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("_pixTarget2"),
      );
      const pTarget3 = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("_pixTarget3"),
      );
      // we mock the allowlist root here only to test storage update. In depth
      // allowlist test coverage in both "Lock" and "Seller Allowlist Settings" unit tests.
      const root = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("root"),
      );
      const nullRoot = ethers.constants.HashZero;
      const price2 = price.mul(ethers.BigNumber.from(2));
      const price3 = price.mul(ethers.BigNumber.from(3));
      const price4 = price.mul(ethers.BigNumber.from(4));
      await erc20.mint(
        getSignerAddrs(4, await ethers.getSigners()),
        price4,
      );
      await erc20
        .connect(owner)
        .approve(p2pix.address, price);
      await erc20
        .connect(acc01)
        .approve(p2pix.address, price2);
      await erc20
        .connect(acc02)
        .approve(p2pix.address, price3);
      await erc20
        .connect(acc03)
        .approve(p2pix.address, price4);

      const tx = await p2pix
        .connect(owner)
        .deposit(erc20.address, price, pTarget, root);
      const tx2 = await p2pix
        .connect(acc01)
        .deposit(erc20.address, price2, pTarget2, nullRoot);
      const tx3 = await p2pix
        .connect(acc02)
        .deposit(erc20.address, price3, pTarget3, root);
      const tx4 = await p2pix
        .connect(acc03)
        .deposit(erc20.address, price4, pTarget, nullRoot);

        const storage1: Deposit = await p2pix.mapDeposits(0);
        const storage2: Deposit = await p2pix.mapDeposits(1);
        const storage3: Deposit = await p2pix.mapDeposits(2);
        const storage4: Deposit = await p2pix.mapDeposits(3);

        const allowList1 = await p2pix.sellerAllowList(ownerKey);
        const allowList2 = await p2pix.sellerAllowList(acc01Key);
        const allowList3 = await p2pix.sellerAllowList(acc02Key);
        const allowList4 = await p2pix.sellerAllowList(acc03Key);

      expect(tx).to.be.ok;
      expect(tx2).to.be.ok;
      expect(tx3).to.be.ok;
      expect(tx4).to.be.ok;

      await expect(tx)
        .to.emit(p2pix, "DepositAdded")
        .withArgs(owner.address, 0, erc20.address, price);
      await expect(tx).to.changeTokenBalances(
        erc20,
        [owner.address, p2pix.address],
        ["-100000000000000000000", price],
      );

      await expect(tx2)
        .to.emit(p2pix, "DepositAdded")
        .withArgs(acc01.address, 1, erc20.address, price2);
      await expect(tx2).to.changeTokenBalances(
        erc20,
        [acc01.address, p2pix.address],
        ["-200000000000000000000", price2],
      );

      await expect(tx3)
        .to.emit(p2pix, "DepositAdded")
        .withArgs(acc02.address, 2, erc20.address, price3);
      await expect(tx3).to.changeTokenBalances(
        erc20,
        [acc02.address, p2pix.address],
        ["-300000000000000000000", price3],
      );

      await expect(tx4)
        .to.emit(p2pix, "DepositAdded")
        .withArgs(acc03.address, 3, erc20.address, price4);
      await expect(tx4).to.changeTokenBalances(
        erc20,
        [acc03.address, p2pix.address],
        ["-400000000000000000000", price4],
      );

      expect(storage1.remaining).to.eq(price);
      expect(storage1.pixTarget).to.eq(pTarget);
      expect(storage1.seller).to.eq(owner.address);
      expect(storage1.token).to.eq(erc20.address);
      expect(storage1.valid).to.eq(true);
      expect(allowList1).to.eq(root);

      expect(storage2.remaining).to.eq(price2);
      expect(storage2.pixTarget).to.eq(pTarget2);
      expect(storage2.seller).to.eq(acc01.address);
      expect(storage2.token).to.eq(erc20.address);
      expect(storage2.valid).to.eq(true);
      expect(allowList2).to.eq(nullRoot);

      expect(storage3.remaining).to.eq(price3);
      expect(storage3.pixTarget).to.eq(pTarget3);
      expect(storage3.seller).to.eq(acc02.address);
      expect(storage3.token).to.eq(erc20.address);
      expect(storage3.valid).to.eq(true);
      expect(allowList3).to.eq(root);
    
      expect(storage4.remaining).to.eq(price4);
      expect(storage4.pixTarget).to.eq(pTarget);
      expect(storage4.seller).to.eq(acc03.address);
      expect(storage4.token).to.eq(erc20.address);
      expect(storage4.valid).to.eq(true);
      expect(allowList4).to.eq(nullRoot);
    });
  });
  describe("Lock", async () => {
    // it ("should revert if deposit is invalid")
    // it ("should revert if wished amount is greater than deposit's remaining amount")
    // it ("should revert if a non expired lock has the same ID encoded")
    // it ("should revert if an invalid allowlist merkleproof is provided")
    // it ("should revert if msg.sender does not have enough credit in his spend limit")
    // it ("should create a lock, update storage and emit events via the allowlist path")
    // it ("should create a lock, update storage and emit events via the reputation path")
    // it ("should create multiple locks") - EDGE CASE TEST
    // CHECK UNEXPIRE LOCK
  });
  describe("Cancel Deposit", async () => {
    // it("should revert if the msg.sender isn't the deposit's seller")
    // it("should cancel deposit, update storage and emit events")
    // it("should cancel multiple deposits")
  });
  describe("Release", async () => {
    // it("should revert if lock has expired or has already been released")
    // it("should revert if signed message has already been used")
    // it("should revert if ecrecovered signer is invalid")
    // it("should release lock, update storage and emit events")
    // it("should release multiple locks") - EDGE CASE TEST {
    // TEST 3 CASES (
    // EMPTY PREMIUM,
    // LOCK RELAYER != RELEASE RELAYER, (check userRecord storage update)
    // LOCK RELAYER == RELEASE RELAYER (check userRecord storage update)
    // )}
  });
  describe("Unlock Expired Locks", async () => {
    // it("should revert if lock isn't expired")
    // it("should unlock expired locks, update storage and emit events")
    // CHECK FOR userRecord STORAGE UPDATE
  });
  describe("Seller Withdraw", async () => {
    // it("should revert if the msg.sender isn't the deposit's seller")
    // it -> withdraw remaining funds from deposit
    // CHECK UNEXPIRE LOCKS
  });
  describe("Seller Allowlist Settings", async () => {
    // it -> set root of seller's allowlist
    // (test msg.sender != seller error)
    // i.e., set it in the fixture
  });
});
