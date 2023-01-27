import "@nomicfoundation/hardhat-chai-matchers";
import {
  loadFixture,
  mine,
} from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import {
  BigNumber,
  ContractReceipt,
  ContractTransaction,
  Wallet,
} from "ethers";
import {
  ethers,
  network,
  /* tracer */
} from "hardhat";

// import keccak256 from "keccak256";
import { MockToken, P2PIX, Reputation } from "../src/types";
import { P2PixErrors } from "./utils/errors";
import {
  // Deposit,
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
  let reputation: Reputation; // Reputation Interface instance
  let merkleRoot: string; // MerkleRoot from seller's allowlist
  let proof: string[]; // Owner's proof as whitelisted address

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
    ({ erc20, p2pix, reputation, merkleRoot, proof } =
      await loadFixture(p2pixFixture));
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
      expect(await p2pix.callStatic.lockCounter()).to.eq(0);
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
      const pTarget = ethers.BigNumber.from(7331);
      const root = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("root"),
      );
      const tx = p2pix.deposit(
        owner.address,
        1,
        pTarget,
        true,
        root,
      );

      await expect(tx).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.TokenDenied,
      );
    });
    it("should revert if pixTarget is empty", async () => {
      // const pTarget = ethers.BigNumber.from(7331);
      const root = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("root"),
      );
      const tx = p2pix.deposit(
        erc20.address,
        1,
        0,
        true,
        root,
      );

      await expect(tx).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.EmptyPixTarget,
      );
    });
    it("should revert if amount exceeds the balance limit", async () => {
      const pTarget = ethers.BigNumber.from(7331);
      const root = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("root"),
      );
      const tx = p2pix.deposit(
        erc20.address,
        ethers.utils.parseEther("100000001"),
        pTarget,
        true,
        root,
      );

      await expect(tx).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.MaxBalExceeded,
      );
    });
    it("should create deposit, update storage and emit event", async () => {
      const pTarget = ethers.BigNumber.from(7331);
      // we use `hashZero` to avoid updating seller's allowlist settings
      const root = ethers.constants.HashZero;
      await erc20.approve(p2pix.address, price);
      const tx = await p2pix.deposit(
        erc20.address,
        price,
        pTarget,
        true,
        root,
      );
      const storage = await p2pix.callStatic.getBalance(owner.address, erc20.address);
      const pixTarget = await p2pix.callStatic.getPixTarget(owner.address,erc20.address);
      const valid = await p2pix.callStatic.getValid(owner.address,erc20.address);
      const ownerKey = await p2pix.callStatic._castAddrToKey(
        owner.address,
      );
      const allowList = await p2pix.sellerAllowList(ownerKey);

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "DepositAdded")
        .withArgs(owner.address, erc20.address, price);
      await expect(tx).to.changeTokenBalances(
        erc20,
        [owner.address, p2pix.address],
        ["-100000000000000000000", price],
      );
      expect(storage).to.eq(price);
      expect(pixTarget).to.eq(pTarget);
      expect(valid).to.eq(true);
      expect(allowList).to.eq(root);
    });
    // edge case test
    it("should create multiple deposits", async () => {
      const ownerKey = await p2pix.callStatic._castAddrToKey(
        owner.address,
      );
      const acc01Key = await p2pix.callStatic._castAddrToKey(
        acc01.address,
      );
      const acc02Key = await p2pix.callStatic._castAddrToKey(
        acc02.address,
      );
      const acc03Key = await p2pix.callStatic._castAddrToKey(
        acc03.address,
      );

      const pTarget = ethers.BigNumber.from(7331);
      const pTarget2 = ethers.BigNumber.from(1337);
      const pTarget3 = ethers.BigNumber.from(3731);
      // we mock the allowlist root here only to test storage update. In depth
      // allowlist test coverage in both "Lock" and "Allowlist Settings" unit tests.
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
        .deposit(erc20.address, price, pTarget, true, root);
      const tx2 = await p2pix
        .connect(acc01)
        .deposit(erc20.address, price2, pTarget2, false, nullRoot);
      const tx3 = await p2pix
        .connect(acc02)
        .deposit(erc20.address, price3, pTarget3, true, root);
      const tx4 = await p2pix
        .connect(acc03)
        .deposit(erc20.address, price4, pTarget, false, nullRoot);

      const storage1 = await p2pix.callStatic.getBalance(owner.address, erc20.address);
      const storage2 = await p2pix.callStatic.getBalance(acc01.address, erc20.address);
      const storage3 = await p2pix.callStatic.getBalance(acc02.address, erc20.address);
      const storage4 = await p2pix.callStatic.getBalance(acc03.address, erc20.address);

      const pixTarget1 = await p2pix.callStatic.getPixTarget(owner.address, erc20.address);
      const pixTarget2 = await p2pix.callStatic.getPixTarget(acc01.address, erc20.address);
      const pixTarget3 = await p2pix.callStatic.getPixTarget(acc02.address, erc20.address);
      const pixTarget4 = await p2pix.callStatic.getPixTarget(acc03.address, erc20.address);

      const valid1 = await p2pix.callStatic.getValid(owner.address, erc20.address);
      const valid2 = await p2pix.callStatic.getValid(acc01.address, erc20.address);
      const valid3 = await p2pix.callStatic.getValid(acc02.address, erc20.address);
      const valid4 = await p2pix.callStatic.getValid(acc03.address, erc20.address);

      const allowList1 = await p2pix.sellerAllowList(
        ownerKey,
      );
      const allowList2 = await p2pix.sellerAllowList(
        acc01Key,
      );
      const allowList3 = await p2pix.sellerAllowList(
        acc02Key,
      );
      const allowList4 = await p2pix.sellerAllowList(
        acc03Key,
      );

      expect(tx).to.be.ok;
      expect(tx2).to.be.ok;
      expect(tx3).to.be.ok;
      expect(tx4).to.be.ok;

      await expect(tx)
        .to.emit(p2pix, "DepositAdded")
        .withArgs(owner.address, erc20.address, price);
      await expect(tx).to.changeTokenBalances(
        erc20,
        [owner.address, p2pix.address],
        ["-100000000000000000000", price],
      );

      await expect(tx2)
        .to.emit(p2pix, "DepositAdded")
        .withArgs(acc01.address, erc20.address, price2);
      await expect(tx2).to.changeTokenBalances(
        erc20,
        [acc01.address, p2pix.address],
        ["-200000000000000000000", price2],
      );

      await expect(tx3)
        .to.emit(p2pix, "DepositAdded")
        .withArgs(acc02.address, erc20.address, price3);
      await expect(tx3).to.changeTokenBalances(
        erc20,
        [acc02.address, p2pix.address],
        ["-300000000000000000000", price3],
      );

      await expect(tx4)
        .to.emit(p2pix, "DepositAdded")
        .withArgs(acc03.address, erc20.address, price4);
      await expect(tx4).to.changeTokenBalances(
        erc20,
        [acc03.address, p2pix.address],
        ["-400000000000000000000", price4],
      );

      expect(storage1).to.eq(price);
      expect(pixTarget1).to.eq(pTarget);
      expect(valid1).to.eq(true);
      expect(allowList1).to.eq(root);

      expect(storage2).to.eq(price2);
      expect(pixTarget2).to.eq(pTarget2);
      expect(valid2).to.eq(false);
      expect(allowList2).to.eq(nullRoot);

      expect(storage3).to.eq(price3);
      expect(pixTarget3).to.eq(pTarget3);
      expect(valid3).to.eq(true);
      expect(allowList3).to.eq(root);

      expect(storage4).to.eq(price4);
      expect(pixTarget4).to.eq(pTarget);
      expect(valid4).to.eq(false);
      expect(allowList4).to.eq(nullRoot);
    });
  });
  describe("Lock", async () => {
    it("should revert if deposit is invalid", async () => {
      const pTarget = ethers.BigNumber.from(7331);
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        pTarget,
        true,
        ethers.constants.HashZero,
      );
      await p2pix.setValidState(erc20.address,false);
      const fail = p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          0,
          price,
          [],
          [],
        );
      const fail2 = p2pix.lock(
        zero,
        zero,
        zero,
        zero,
        0,
        price,
        [],
        [],
      );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.InvalidDeposit,
      );
      await expect(fail2).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.InvalidDeposit,
      );
    });
    it("should revert if wished amount is greater than balance's remaining amount", async () => {
      await erc20.approve(p2pix.address, price);
      const pTarget = ethers.BigNumber.from(1337);
      await p2pix.deposit(
        erc20.address,
        price,
        pTarget,
        true,
        ethers.constants.HashZero,
      );
      const fail = p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          0,
          price.mul(ethers.BigNumber.from(2)),
          [],
          [],
        );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.NotEnoughTokens,
      );
    });
    // test invalid since lockID has been replaced by a counter. 
    // it.only("should revert if a non expired lock has the same ID encoded", async () => {
    //   const pTarget = ethers.BigNumber.from(1337);
    //   await erc20.approve(p2pix.address, price);
    //   await p2pix.deposit(
    //     erc20.address,
    //     price,
    //     pTarget,
    //     true,
    //     ethers.constants.HashZero,
    //   );
    //   await p2pix
    //     .connect(acc03)
    //     .lock(
    //       owner.address, 
    //       erc20.address,
    //       acc02.address, 
    //       acc03.address, 
    //       0, 1, [], []);

        // console.log(await p2pix.callStatic.getValid(owner.address,erc20.address))
      // const fail = p2pix
      //   .connect(acc03)
      //   .lock(owner.address, erc20.address, acc02.address, acc03.address, 0, 1, [], []);

      // await expect(fail).to.be.revertedWithCustomError(
      //   p2pix,
      //   P2PixErrors.NotExpired,
      // );
    // });
    it("should revert if an invalid allowlist merkleproof is provided", async () => {
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        ethers.BigNumber.from("1337"),
        true,
        merkleRoot,
      );
      const fail = p2pix
        .connect(acc02)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          0,
          1000,
          [
            ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes("wrong"),
            ),
          ],
          [],
        );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.AddressDenied,
      );
    });
    it("should revert if msg.sender does not have enough credit in his spend limit", async () => {
      await erc20.approve(
        p2pix.address,
        price.mul(BigNumber.from("3")),
      );
      await p2pix.deposit(
        erc20.address,
        price.mul(BigNumber.from("3")),
        ethers.BigNumber.from("1"),
        true,
        merkleRoot,
      );
      const fail = p2pix
        .connect(acc02)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          0,
          price.mul(BigNumber.from("2")),
          [],
          [],
        );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.AmountNotAllowed,
      );
    });
    it("should create a lock, update storage and emit events via the allowlist path", async () => {
      const target = ethers.BigNumber.from(101);
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        target,
        true,
        merkleRoot,
      );
      const tx = await p2pix
        .connect(acc01)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          0,
          price,
          proof,
          [],
        );
      // const storage: Lock = await p2pix.callStatic.mapLocks(1);

      // const rc: ContractReceipt = await tx.wait();
      // const expiration = rc.blockNumber + 10;
      // const key = await p2pix.callStatic._castAddrToKey(owner.address);
      
      // await expect(tx)
      //   .to.emit(p2pix, "LockAdded")
      //   .withArgs(
      //     acc02.address,
      //     ethers.constants.One,
      //     key,
      //     price,
      //   );
      // expect(tx).to.be.ok;
      // expect(storage.sellerKey).to.eq(key);
      // expect(storage.counter).to.eq(1);
      // expect(storage.relayerPremium).to.eq(
      //   ethers.constants.Zero,
      // );
      // expect(storage.amount).to.eq(price);
      // expect(storage.expirationBlock).to.eq(expiration);
      // expect(storage.pixTarget).to.eq(target);
      // expect(storage.buyerAddress).to.eq(acc02.address);
      // expect(storage.relayerTarget).to.eq(acc03.address);
      // expect(storage.relayerAddress).to.eq(acc01.address);
      // expect(storage.token).to.eq(erc20.address);
    });
    it("should create a lock, update storage and emit events via the reputation path", async () => {
      const root = ethers.constants.HashZero;
      const target = ethers.BigNumber.from(101);
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        target,
        true,
        root,
      );
      const tx = await p2pix
        .connect(acc01)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          0,
          price,
          [],
          [],
        );
      const storage: Lock = await p2pix.callStatic.mapLocks(1);

      const rc: ContractReceipt = await tx.wait();
      const expiration = rc.blockNumber + 10;
      const key = await p2pix.callStatic._castAddrToKey(owner.address);

      expect(tx).to.be.ok;
      expect(storage.sellerKey).to.eq(key);
      expect(storage.counter).to.eq(1);
      expect(storage.relayerPremium).to.eq(
        ethers.constants.Zero,
      );
      expect(storage.amount).to.eq(price);
      expect(storage.expirationBlock).to.eq(expiration);
      expect(storage.pixTarget).to.eq(target);
      expect(storage.buyerAddress).to.eq(acc02.address);
      expect(storage.relayerTarget).to.eq(acc03.address);
      expect(storage.relayerAddress).to.eq(acc01.address);
      expect(storage.token).to.eq(erc20.address);
      
      await expect(tx)
        .to.emit(p2pix, "LockAdded")
        .withArgs(
          acc02.address,
          1,
          key,
          storage.amount,
        );
    });
    // edge case test
    it("should create multiple locks", async () => {
      const newPrice = price.div(ethers.BigNumber.from(2));
      const target = ethers.BigNumber.from(101);
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        target,
        true,
        merkleRoot,
      );
      const tx1 = await p2pix
        .connect(acc01)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          0,
          newPrice,
          proof,
          [],
        );
      const storage1: Lock = await p2pix.callStatic.mapLocks(
        1,
      );

      const rc1: ContractReceipt = await tx1.wait();
      const expiration1 = rc1.blockNumber + 10;

      const tx2 = await p2pix
        .connect(acc01)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          0,
          100,
          [],
          [],
        );
      const storage2: Lock = await p2pix.callStatic.mapLocks(2);

      const rc2: ContractReceipt = await tx2.wait();
      const expiration2 = rc2.blockNumber + 10;

      const tx3 = await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.address,
          acc03.address,
          acc03.address,
          0,
          100,
          [],
          [],
        );
      const storage3: Lock = await p2pix.callStatic.mapLocks(3);

      const rc3: ContractReceipt = await tx3.wait();
      const expiration3 = rc3.blockNumber + 10;

      const key = await p2pix.callStatic._castAddrToKey(owner.address);

      expect(tx1).to.be.ok;
      expect(tx2).to.be.ok;
      expect(tx3).to.be.ok;

      expect(key)
        .to.eq(storage1.sellerKey)
        .and.to.eq(storage2.sellerKey)
        .and.to.eq(storage3.sellerKey);

      expect(storage1.counter).to.eq(1);
      expect(storage2.counter).to.eq(2);
      expect(storage3.counter).to.eq(3);

      expect(ethers.constants.Zero)
        .to.eq(storage1.relayerPremium)
        .and.to.eq(storage2.relayerPremium)
        .and.to.eq(storage3.relayerPremium);

      expect(storage1.amount).to.eq(newPrice);
      expect(ethers.BigNumber.from(100))
        .to.eq(storage2.amount)
        .and.to.eq(storage3.amount);

      expect(storage1.expirationBlock).to.eq(expiration1);
      expect(storage2.expirationBlock).to.eq(expiration2);
      expect(storage3.expirationBlock).to.eq(expiration3);

      expect(target)
      .to.eq(storage1.pixTarget)
      .and.to.eq(storage2.pixTarget)
      .and.to.eq(storage3.pixTarget);

      expect(acc02.address)
        .to.eq(storage1.buyerAddress)
        .and.to.eq(storage2.buyerAddress);
      expect(storage3.buyerAddress).to.eq(acc03.address);

      expect(acc03.address)
        .to.eq(storage1.relayerTarget)
        .and.to.eq(storage2.relayerTarget)
        .and.to.eq(storage3.relayerTarget);

      expect(acc01.address)
        .to.eq(storage1.relayerAddress)
        .and.to.eq(storage2.relayerAddress);
      expect(storage3.relayerAddress).to.eq(acc03.address);

      expect(erc20.address)
          .to.eq(storage1.token)
          .and.to.eq(storage2.token)
          .and.to.eq(storage3.token);

      await expect(tx1)
        .to.emit(p2pix, "LockAdded")
        .withArgs(
          acc02.address,
          1,
          key,
          storage1.amount,
        );
      await expect(tx2)
        .to.emit(p2pix, "LockAdded")
        .withArgs(
          acc02.address,
          2,
          key,
          storage2.amount,
        );
      await expect(tx3)
        .to.emit(p2pix, "LockAdded")
        .withArgs(
          acc03.address,
          3,
          key,
          storage3.amount,
        );
    });
  });
  describe("Set sellerBalance Valid State", async () => {
    it("should revert if sellerBalance hasn't been initialized", async () => {
    //   await erc20.approve(p2pix.address, price);
    //   await p2pix.deposit(
    //     erc20.address,
    //     price,
    //     "pixTarget",
    //     merkleRoot,
    //   );
      const fail = p2pix.setValidState(erc20.address,false);
      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.NotInitialized,
      );
    });
    it("should setValidState, update storage and emit events", async () => {
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        ethers.BigNumber.from(10101),
        true,
        merkleRoot,
      );
      const state1 =
        await p2pix.callStatic.getValid(owner.address,erc20.address);
      const tx = await p2pix.setValidState(erc20.address,false);
      const state2 =
        await p2pix.callStatic.getValid(owner.address,erc20.address);

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "ValidSet")
        .withArgs(owner.address, erc20.address, false);
      expect(state1).to.be.true;
      expect(state2).to.be.false;
    });
    it("should cancel multiple balances", async () => {
      const hashZero = ethers.constants.HashZero;
      await erc20.mint([acc01.address,acc02.address],price);
      const target = ethers.BigNumber.from("1");
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        target,
        true,
        hashZero,
      );
      await erc20.connect(acc01).approve(p2pix.address, price);
      await p2pix.connect(acc01).deposit(
        erc20.address,
        price,
        target,
        false,
        hashZero,
      );
      await erc20.connect(acc02).approve(p2pix.address, price);
      await p2pix.connect(acc02).deposit(
        erc20.address,
        price,
        target,
        true,
        hashZero,
      );
      const oldState1 = 
        await p2pix.callStatic.getValid(owner.address,erc20.address);
      const oldState2 =
        await p2pix.callStatic.getValid(acc01.address,erc20.address);
      const oldState3 =
        await p2pix.callStatic.getValid(acc02.address,erc20.address);
      const tx1 = await p2pix.setValidState(erc20.address,false);
      const tx2 = await p2pix.connect(acc01).setValidState(erc20.address,true);
      const tx3 = await p2pix.connect(acc02).setValidState(erc20.address,true);
      const newState1 =
        await p2pix.callStatic.getValid(owner.address,erc20.address);
      const newState2 =
      await p2pix.callStatic.getValid(acc01.address,erc20.address);
      const newState3 =
      await p2pix.callStatic.getValid(acc02.address,erc20.address);

      expect(tx1).to.be.ok;
      expect(tx2).to.be.ok;
      expect(tx3).to.be.ok;
      await expect(tx1)
        .to.emit(p2pix, "ValidSet")
        .withArgs(owner.address, erc20.address,false);
      await expect(tx2)
        .to.emit(p2pix, "ValidSet")
        .withArgs(acc01.address, erc20.address,true);
      await expect(tx3)
        .to.emit(p2pix, "ValidSet")
        .withArgs(acc02.address, erc20.address,true);
      expect(oldState1).to.be.true;
      expect(oldState2).to.be.false;
      expect(oldState3).to.be.true;
      expect(newState1).to.be.false;
      expect(newState2).to.be.true;
      expect(newState3).to.be.true;
    });
  });
  describe("Release", async () => {
    it("should revert if lock has expired", async () => {
      const target = ethers.BigNumber.from(101);
      const messageToSign = ethers.utils.solidityKeccak256(
        ["uint160", "uint256", "bytes32"],
        [target, 100, ethers.constants.HashZero],
      );
      const flatSig = await acc01.signMessage(
        ethers.utils.arrayify(messageToSign),
      );
      const sig = ethers.utils.splitSignature(flatSig);
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        target,
        true,
        merkleRoot,
      );
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          6,
          100,
          [],
          [],
        );
      const lockID = ethers.constants.One;
      await mine(13);
      const fail = p2pix.release(
        lockID,
        acc03.address,
        ethers.constants.HashZero,
        sig.r,
        sig.s,
        sig.v,
      );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.LockExpired,
      );
    });
    it("should revert if lock has already been released", async () => {
      const target = ethers.BigNumber.from("1");
      const hashZero = ethers.constants.HashZero;
      const messageToSign = ethers.utils.solidityKeccak256(
        ["uint160", "uint256", "bytes32"],
        [target, 100, hashZero],
      );
      const flatSig = await acc01.signMessage(
        ethers.utils.arrayify(messageToSign),
      );
      const sig = ethers.utils.splitSignature(flatSig);
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        target,
        true,
        merkleRoot,
      );
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          6,
          100,
          [],
          [],
        );
      const lockID = ethers.constants.One;
      await p2pix.release(
        lockID,
        acc03.address,
        ethers.constants.HashZero,
        sig.r,
        sig.s,
        sig.v,
      );
      const fail = p2pix.release(
        lockID,
        acc03.address,
        ethers.constants.HashZero,
        sig.r,
        sig.s,
        sig.v,
      );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.AlreadyReleased,
      );
    });
    it("should revert if signed message has already been used", async () => {
      const target = ethers.BigNumber.from(101);
      const messageToSign = ethers.utils.solidityKeccak256(
        ["uint160", "uint256", "bytes32"],
        [target, 100, ethers.constants.HashZero],
      );
      const flatSig = await owner.signMessage(
        ethers.utils.arrayify(messageToSign),
      );
      const sig = ethers.utils.splitSignature(flatSig);
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        target,
        true,
        ethers.constants.HashZero,
      );
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          6,
          100,
          [],
          [],
        );
      
      await p2pix
        .connect(acc01)
        .release(
          1,
          acc02.address,
          ethers.constants.HashZero,
          sig.r,
          sig.s,
          sig.v,
        );
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          6,
          100,
          [],
          [],
        );
      const fail = p2pix
        .connect(acc01)
        .release(
          2,
          acc02.address,
          ethers.constants.HashZero,
          sig.r,
          sig.s,
          sig.v,
        );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.TxAlreadyUsed,
      );
    });
    it("should revert if ecrecovered signer is invalid", async () => {
      const target = ethers.BigNumber.from(101);
      const messageToSign = ethers.utils.solidityKeccak256(
        ["uint160", "uint256", "bytes32"],
        [target, 100, ethers.constants.HashZero],
      );
      const flatSig = await acc03.signMessage(
        ethers.utils.arrayify(messageToSign),
      );
      const sig = ethers.utils.splitSignature(flatSig);

      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        target,
        true,
        ethers.constants.HashZero,
      );
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          6,
          100,
          [],
          [],
        );
      const fail = p2pix
        .connect(acc01)
        .release(
          1,
          acc02.address,
          ethers.constants.HashZero,
          sig.r,
          sig.s,
          sig.v,
        );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.InvalidSigner,
      );
    });
    it("should release lock, update storage and emit events", async () => {
      const zero = ethers.constants.Zero;
      const endtoendID = ethers.constants.HashZero;
      const pixTarget = ethers.BigNumber.from(101);
      const messageToSign = ethers.utils.solidityKeccak256(
        ["uint160", "uint256", "bytes32"],
        [pixTarget, 100, endtoendID],
      );
      // Note: messageToSign is a string, that is 66-bytes long, to sign the
      //       binary value, we must convert it to the 32 byte Array that
      //       the string represents
      //
      // i.e.,
      //    66-byte string
      //   "0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba"
      //   ... vs ...
      //   32 entry Uint8Array
      //  [ 89, 47, 167, 67, 136, 159, ... 103, 7, 186]
      const messageHashBytes =
        ethers.utils.arrayify(messageToSign);
      const flatSig = await acc01.signMessage(
        messageHashBytes,
      );
      const sig = ethers.utils.splitSignature(flatSig);
      const root = ethers.constants.HashZero;

      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        pixTarget,
        true,
        root,
      );
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          6,
          100,
          [],
          [],
        );
      const acc01Key = await p2pix.callStatic._castAddrToKey(
        acc01.address,
      );
      const acc03Key = await p2pix.callStatic._castAddrToKey(
        acc03.address,
      );
      const userRecordA = await p2pix.callStatic.userRecord(
        acc01Key,
      );
      const userRecord1 = await p2pix.callStatic.userRecord(
        acc03Key,
      );
      const storage1: Lock = await p2pix.callStatic.mapLocks(1);
      const tx = await p2pix
        .connect(acc01)
        .release(
          1,
          acc02.address,
          endtoendID,
          sig.r,
          sig.s,
          sig.v,
        );
      const storage2: Lock = await p2pix.callStatic.mapLocks(1);
      const userRecordB = await p2pix.callStatic.userRecord(
        acc01Key,
      );
      const userRecord2 = await p2pix.callStatic.userRecord(
        acc03Key,
      );
      const used = await p2pix.callStatic.usedTransactions(
        messageHashBytes,
      );
      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "LockReleased")
        .withArgs(acc02.address, ethers.constants.One, storage1.amount);
      expect(storage1.expirationBlock).to.eq(
        ethers.BigNumber.from(16),
      );
      expect(storage1.amount).to.eq(
        ethers.BigNumber.from(100),
      );
      expect(storage2.expirationBlock).to.eq(zero);
      expect(storage2.amount).to.eq(zero);
      expect(used).to.eq(true);
      expect(userRecordA).to.eq(zero);
      expect(userRecord1).to.eq(zero);
      expect(userRecordB).to.eq(ethers.BigNumber.from(6));
      expect(userRecord2).to.eq(ethers.BigNumber.from(100));
      await expect(tx).to.changeTokenBalances(
        erc20,
        [acc03.address, acc02.address],
        [3, 97],
        // acc02 is acting both as buyer and relayerTarget
        // (i.e., 94 + 3 = 97)
      );
    });
    // edge case test
    it("should release multiple locks", async () => {
      const endtoendID = ethers.constants.HashZero;
      const pixTarget = ethers.BigNumber.from(101);
      const root = ethers.constants.HashZero;
      const acc01Key = await p2pix.callStatic._castAddrToKey(
        acc01.address,
      );
      const acc03Key = await p2pix.callStatic._castAddrToKey(
        acc03.address,
      );
      const acc01Record1 = await p2pix.callStatic.userRecord(
        acc01Key,
      );
      const acc03Record1 = await p2pix.callStatic.userRecord(
        acc03Key,
      );
      const messageToSign1 = ethers.utils.solidityKeccak256(
        ["uint160", "uint256", "bytes32"],
        [pixTarget, 100, endtoendID],
      );
      const flatSig1 = await owner.signMessage(
        ethers.utils.arrayify(messageToSign1),
      );
      const sig1 = ethers.utils.splitSignature(flatSig1);
      const messageToSign2 = ethers.utils.solidityKeccak256(
        ["uint160", "uint256", "bytes32"],
        [pixTarget, 50, endtoendID],
      );
      const flatSig2 = await owner.signMessage(
        ethers.utils.arrayify(messageToSign2),
      );
      const sig2 = ethers.utils.splitSignature(flatSig2);
      const messageToSign3 = ethers.utils.solidityKeccak256(
        ["uint160", "uint256", "bytes32"],
        [pixTarget, 25, endtoendID],
      );
      const flatSig3 = await owner.signMessage(
        ethers.utils.arrayify(messageToSign3),
      );
      const sig3 = ethers.utils.splitSignature(flatSig3);
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        pixTarget,
        true,
        root,
      );
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          0,
          100,
          [],
          [],
        );
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.address,
          acc02.address, 
          acc03.address, 
          6, 
          50, 
          [], 
          []
      );
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          10,
          25,
          [],
          [],
        );
      const lockID = ethers.constants.One;
      const lockID2 = ethers.constants.Two;
      const lockID3 = ethers.BigNumber.from(3);
      const storage1: Lock = await p2pix.callStatic.mapLocks(lockID);
      const storage2: Lock = await p2pix.callStatic.mapLocks(lockID2);
      const storage3: Lock = await p2pix.callStatic.mapLocks(lockID3);
      // relayerPremium == 0
      const tx = await p2pix
        .connect(acc01)
        .release(
          lockID,
          acc02.address,
          endtoendID,
          sig1.r,
          sig1.s,
          sig1.v,
        );
      // relayerPremium != 0 &&
      // lock's msg.sender != release's msg.sender
      const tx1 = await p2pix
        .connect(acc01)
        .release(
          lockID2,
          acc02.address,
          endtoendID,
          sig2.r,
          sig2.s,
          sig2.v,
        );
      // relayerPremium != 0 &&
      // lock's msg.sender == release's msg.sender
      const tx2 = await p2pix
        .connect(acc03)
        .release(
          lockID3,
          acc02.address,
          endtoendID,
          sig3.r,
          sig3.s,
          sig3.v,
        );
      const used1 = await p2pix.callStatic.usedTransactions(
        ethers.utils.arrayify(messageToSign1),
      );
      const used2 = await p2pix.callStatic.usedTransactions(
        ethers.utils.arrayify(messageToSign2),
      );
      const used3 = await p2pix.callStatic.usedTransactions(
        ethers.utils.arrayify(messageToSign3),
      );
      const acc01Record2 = await p2pix.callStatic.userRecord(
        acc01Key,
      );
      const acc03Record2 = await p2pix.callStatic.userRecord(
        acc03Key,
      );

      expect(tx).to.be.ok;
      expect(tx1).to.be.ok;
      expect(tx2).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "LockReleased")
        .withArgs(acc02.address, lockID, storage1.amount);
      await expect(tx1)
        .to.emit(p2pix, "LockReleased")
        .withArgs(acc02.address, lockID2, storage2.amount);
      await expect(tx2)
        .to.emit(p2pix, "LockReleased")
        .withArgs(acc02.address, lockID3, storage3.amount);
      expect(used1).to.eq(true);
      expect(used2).to.eq(true);
      expect(used3).to.eq(true);
      expect(0).to.eq(acc01Record1).and.to.eq(acc03Record1);
      expect(acc01Record2).to.eq(6); // 0 + 6
      expect(acc03Record2).to.eq(185); // 100 + 50 + 25 + 10
      await expect(tx).to.changeTokenBalances(
        erc20,
        [
          acc01.address,
          acc02.address,
          acc03.address,
          p2pix.address,
        ],
        [0, 100, 0, "-100"],
      );
      await expect(tx1).to.changeTokenBalances(
        erc20,
        [
          acc01.address,
          acc02.address,
          acc03.address,
          p2pix.address,
        ],
        [0, 47, 3, "-50"],
      );
      await expect(tx2).to.changeTokenBalances(
        erc20,
        [
          acc01.address,
          acc02.address,
          acc03.address,
          p2pix.address,
        ],
        [0, 20, 5, "-25"],
      );
    });
  });
  describe("Unexpire Locks", async () => {
    it("should revert if lock isn't expired", async () => {
      const target = ethers.BigNumber.from(101);
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        target,
        true,
        merkleRoot,
      );
      await p2pix
        .connect(acc02)
        .lock(
          owner.address,
          erc20.address,
          acc02.address, 
          acc03.address, 
          0, 
          1, 
          [], 
          []
        );
      const lockID = ethers.constants.One;
      const fail = p2pix.unlockExpired([lockID]);

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.NotExpired,
      );
    });
    it("should revert if lock has already been released", async () => {
      const endtoendID = ethers.constants.HashZero;
      const pixTarget = ethers.BigNumber.from(101);
      const messageToSign = ethers.utils.solidityKeccak256(
        ["uint160", "uint256", "bytes32"],
        [pixTarget, 1, endtoendID],
      );
      const messageHashBytes =
        ethers.utils.arrayify(messageToSign);
      const flatSig = await acc01.signMessage(
        messageHashBytes,
      );
      const sig = ethers.utils.splitSignature(flatSig);
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        pixTarget,
        true,
        merkleRoot,
      );
      await p2pix
        .connect(acc02)
        .lock(
          owner.address,
          erc20.address, 
          acc02.address, 
          acc03.address, 
          0, 
          1, 
          [], 
          []
        );
      const lockID = ethers.constants.One;
      // await mine(10);
      await p2pix.release(
        lockID,
        acc03.address,
        endtoendID,
        sig.r,
        sig.s,
        sig.v,
      );
      const fail = p2pix.unlockExpired([lockID]);

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.AlreadyReleased,
      );
    });
    it("should unlock expired locks, update storage and emit events", async () => {
      const target = ethers.BigNumber.from(101);
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        target,
        true,
        merkleRoot,
      );
      await p2pix
        .connect(acc02)
        .lock(
          owner.address, 
          erc20.address, 
          acc02.address, 
          acc03.address, 
          0, 
          1, 
          [], 
          []
        );
      const lockID = ethers.constants.One;
      await mine(11);
      const storage: Lock = await p2pix.callStatic.mapLocks(
        lockID,
      );
      const userKey = await p2pix.callStatic._castAddrToKey(
        acc02.address,
      );
      const record1 = await p2pix.callStatic.userRecord(
        userKey,
      );
      const tx = await p2pix.unlockExpired([lockID]);
      const storage2: Lock = await p2pix.callStatic.mapLocks(
        lockID,
      );
      const record2 = await p2pix.callStatic.userRecord(
        userKey,
      );

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "LockReturned")
        .withArgs(acc02.address, lockID);
      expect(storage.amount).to.eq(ethers.constants.One);
      expect(storage2.amount).to.eq(ethers.constants.Zero);
      expect(record1).to.eq(0);
      expect(record2).to.eq(price);
    });
    it("should unlock expired through lock function", async () => {
      const target = ethers.BigNumber.from(101);
      // test method through lock fx
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        target,
        true,
        merkleRoot,
      );
      const lock1: ContractTransaction = await p2pix
        .connect(acc01)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          0,
          price,
          proof,
          [],
        );
      // as return values of non view functions can't be accessed
      // outside the evm, we fetch the lockID from the emitted event.
      const rc: ContractReceipt = await lock1.wait();
      const event = rc.events?.find(
        event => event.event === "LockAdded",
      );
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const emittedLockID = event?.args!["lockID"];
      const lockID = ethers.constants.One;

      // mine blocks to expire lock
      await mine(12);
      // const blocknum = await p2pix.provider.getBlockNumber();
      // console.log("bn = 6 + 12 ( i.e., %s )", blocknum);
      // console.log(
      //   "\n",
      //   " 2 blocks past the expiration block",
      // );
      // const struct2: Lock = await p2pix.callStatic.mapLocks(
      //   emittedLockID,
      // );
      // console.log(
      //   "\n",
      //   "Current state of the lock:",
      //   "\n",
      //   struct2,
      // );

      expect(emittedLockID).to.eq(lockID);

      // create another lock by freeing the price value
      // back to `l.remamining` and lock 100 again.
      const tx1 = await p2pix.lock(
        owner.address,
        erc20.address,
        acc02.address,
        acc03.address,
        0,
        100,
        [],
        [lockID],
      );
      const remaining = await p2pix.callStatic.getBalance(owner.address,erc20.address);

      expect(tx1).to.be.ok;
      await expect(tx1)
        .to.emit(p2pix, "LockReturned")
        .withArgs(acc02.address, lockID);
      expect(remaining).to.eq(
        price.sub(ethers.BigNumber.from(100)),
      );
    });
    it("should unlock expired through withdraw function", async () => {
      const target = ethers.constants.One;
      // test method through withdraw fx
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        target,
        true,
        merkleRoot,
      );
      await p2pix
        .connect(acc01)
        .lock(
          owner.address,
          erc20.address,
          acc02.address,
          acc03.address,
          0,
          price,
          proof,
          [],
        );
      const lockID = ethers.constants.One;
      // mine blocks to expire lock
      await mine(11);
      const tx = await p2pix.withdraw(erc20.address, price, [lockID]);
      const remaining = await p2pix.callStatic.getBalance(owner.address, erc20.address);

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "LockReturned")
        .withArgs(acc02.address, lockID);
      expect(remaining).to.eq(0);
    });
  });

  describe("Seller Withdraw", async () => {
    it("should revert if the wished amount is invalid", async () => {
      const target = ethers.BigNumber.from(101);
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        erc20.address,
        price,
        target,
        true,
        merkleRoot,
      );
      const fail = p2pix.connect(acc02).withdraw(erc20.address, price.mul(ethers.constants.Two),[]);

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.DecOverflow,
      );

    });
    it("should withdraw remaining funds from deposit, update storage and emit event", async () => {
      const newPrice = price.div(ethers.constants.Two);
      await erc20.approve(p2pix.address, price);
      const dep = await p2pix.deposit(
        erc20.address,
        price,
        ethers.BigNumber.from(101),
        true,
        merkleRoot,
      );
      const tx = await p2pix.withdraw(
        erc20.address, 
        price.div(ethers.constants.Two), 
        []
      );

      expect(tx).to.be.ok;
      await expect(dep)
        .to.changeTokenBalance(
          erc20,
          owner.address,
          "-100000000000000000000",
        )
        .and.to.changeTokenBalance(
          erc20,
          p2pix.address,
          price,
        );
      await expect(tx)
        .to.changeTokenBalance(erc20, owner.address, newPrice)
        .and.to.changeTokenBalance(
          erc20,
          p2pix.address,
          "-50000000000000000000",
        );

      await expect(tx)
        .to.emit(p2pix, "DepositWithdrawn")
        .withArgs(owner.address, erc20.address, newPrice);
    });
  });
  describe("Allowlist Settings", async () => {
    it("should revert if the msg.sender differs from deposit's seller", async () => {
      const root = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("root"),
      );
      const fail = p2pix
        .connect(acc02)
        .setRoot(owner.address, root);

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.OnlySeller,
      );
    });
    it("should set root of seller's allowlist, update storage and emit event", async () => {
      const ownerKey = await p2pix.callStatic._castAddrToKey(
        owner.address,
      );
      const oldState = await p2pix.callStatic.sellerAllowList(
        ownerKey,
      );
      const tx = await p2pix
        .connect(owner)
        .setRoot(owner.address, merkleRoot);
      const newState = await p2pix.callStatic.sellerAllowList(
        ownerKey,
      );

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "RootUpdated")
        .withArgs(owner.address, merkleRoot);
      expect(oldState).to.eq(ethers.constants.HashZero);
      expect(newState).to.eq(merkleRoot);
    });
  });
});
