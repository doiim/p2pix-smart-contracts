import type {
  HardhatEthers,
  HardhatEthersSigner,
} from "@nomicfoundation/hardhat-ethers/types";
import type { NetworkHelpers } from "@nomicfoundation/hardhat-network-helpers/types";
import { expect } from "chai";
import type {
  ContractTransactionReceipt,
  ContractTransactionResponse,
} from "ethers";
import hre from "hardhat";
import { parseEther, stringToHex } from "viem";

import type {
  MockToken,
  Multicall,
  P2PIX,
  Reputation,
} from "../src/types/index.ts";
import { P2PixErrors } from "./utils/errors.ts";
import {
  getBnFrom,
  getLockData,
  getSignerAddrs,
  p2pixFixture,
  randomSigners,
} from "./utils/fixtures.ts";
import type { Call, Lock, Result } from "./utils/interfaces.ts";

describe("P2PIX", () => {
  // contract deployer/admin
  let owner: HardhatEthersSigner;

  // extra EOAs
  let acc01: HardhatEthersSigner;
  let acc02: HardhatEthersSigner;
  let acc03: HardhatEthersSigner;

  let ethers: HardhatEthers;
  let networkHelpers: NetworkHelpers;

  let res: bigint;

  let p2pix: P2PIX; // Contract instance
  let erc20: MockToken; // Token instance
  let reputation: Reputation; // Reputation Interface instance
  let multicall: Multicall; // Multicall contract instance
  let merkleRoot: string; // MerkleRoot from seller's allowlist
  let proof: string[]; // Owner's proof as whitelisted address

  const fundAmount: bigint = parseEther("10000");
  const price: bigint = parseEther("100");

  const zero = "0x0000000000000000000000000000000000000000";

  before("Set signers and reset network", async () => {
    ({ ethers, networkHelpers } = await hre.network.getOrCreate());
    [owner, acc01, acc02, acc03] = await ethers.getSigners();
  });
  beforeEach("Load deployment fixtures", async () => {
    ({
      erc20,
      p2pix,
      reputation,
      multicall,
      merkleRoot,
      proof,
    } = await networkHelpers.loadFixture(p2pixFixture));
  });

  describe("Init", async () => {
    it("P2PIX, Reputation and ERC20 should initialize", async () => {
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
        await p2pix.defaultLockBlocks.staticCall(),
      ).to.eq(10);
      expect(await p2pix.reputation.staticCall()).to.eq(
        reputation.target,
      );
      expect(await p2pix.lockCounter.staticCall()).to.eq(0);
      expect(
        await p2pix.validBacenSigners.staticCall(ownerKey),
      ).to.eq(true);
      expect(
        await p2pix.validBacenSigners.staticCall(acc01Key),
      ).to.eq(true);
      expect(
        await p2pix.allowedERC20s.staticCall(erc20.target),
      ).to.eq(true);

      // event emission
      await expect(p2pix.deploymentTransaction())
        .to.emit(p2pix, "OwnerUpdated")
        .withArgs(zero, owner.address)
        .and.to.emit(p2pix, "LockBlocksUpdated")
        .withArgs(10)
        .and.to.emit(p2pix, "ReputationUpdated")
        .withArgs(reputation.target)
        .and.to.emit(p2pix, "ValidSignersUpdated")
        .withArgs([owner.address, acc01.address])
        .and.to.emit(p2pix, "AllowedERC20Updated")
        .withArgs(erc20.target, true);
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
      const oldBal = await ethers.provider.getBalance(
        p2pix.target,
      );
      // this call also tests p2pix's receive() fallback mechanism.
      const tx1 = await acc01.sendTransaction({
        to: p2pix.target,
        value: price,
      });
      const newBal = await ethers.provider.getBalance(
        p2pix.target,
      );

      expect(tx1).to.be.ok;
      expect(oldBal).to.eq(0);
      expect(newBal).to.eq(price);

      const tx = p2pix.withdrawBalance();
      await expect(tx).to.changeEtherBalances(
        ethers,
        [owner.address, p2pix.target],
        [price, price * -1n],
      );
      await expect(tx)
        .to.emit(p2pix, "FundsWithdrawn")
        .withArgs(owner.address, price);

      await expect(
        p2pix.connect(acc01).withdrawBalance(),
      ).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.Unauthorized,
      );
    });
    it("should allow owner to change reputation instance", async () => {
      const tx = await p2pix.setReputation(acc03.address);
      const newRep = await p2pix.reputation.staticCall();
      const fail = p2pix
        .connect(acc02)
        .setReputation(owner.address);

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "ReputationUpdated")
        .withArgs(acc03.address);
      expect(newRep).to.eq(acc03.address);
      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.Unauthorized,
      );
    });
    it("should allow owner to change defaultLockBlocks ", async () => {
      const magicVal = 1337;
      const tx = await p2pix.setDefaultLockBlocks(magicVal);
      const newVal =
        await p2pix.defaultLockBlocks.staticCall();
      const fail = p2pix
        .connect(acc02)
        .setDefaultLockBlocks(0);

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "LockBlocksUpdated")
        .withArgs(magicVal);
      expect(newVal).to.eq(magicVal);
      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.Unauthorized,
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
        await p2pix.validBacenSigners.staticCall(bobCasted);
      const newSigner2 =
        await p2pix.validBacenSigners.staticCall(aliceCasted);
      const fail = p2pix
        .connect(acc03)
        .setValidSigners([owner.address, acc02.address]);

      expect(tx).to.be.ok;
      expect(newSigner1).to.eq(true);
      expect(newSigner2).to.eq(true);
      await expect(tx)
        .to.emit(p2pix, "ValidSignersUpdated")
        .withArgs([bob, alice]);
      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.Unauthorized,
      );
    });
    it("should allow owner to adjust tokenSettings", async () => {
      const tx = await p2pix.tokenSettings(
        [erc20.target, owner.address],
        [false, true],
      );
      const newTokenState1 =
        await p2pix.allowedERC20s.staticCall(erc20.target);
      const newTokenState2 =
        await p2pix.allowedERC20s.staticCall(owner.address);
      const funcSig = "0xd6e8b973";
      const args = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address[]", "bool[]"],
        [[acc01.address], [false]],
      );
      const cd = funcSig + args.substring(2);
      const callStruct: Call = {
        target: p2pix.target as string,
        callData: cd,
      };
      const fail = p2pix
        .connect(acc01)
        .tokenSettings([acc01.address], [false]);
      const fail2 = p2pix.tokenSettings([], [true, false]);
      const fail3 = p2pix.tokenSettings([zero], [true, true]);
      const mtcFail = multicall.mtc1([callStruct]);

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "AllowedERC20Updated")
        .withArgs(erc20.target, false)
        .and.to.emit(p2pix, "AllowedERC20Updated")
        .withArgs(owner.address, true);
      expect(newTokenState1).to.eq(false);
      expect(newTokenState2).to.eq(true);
      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.Unauthorized,
      );
      await expect(fail2).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.NoTokens,
      );
      await expect(fail3).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.LengthMismatch,
      );
      await expect(mtcFail).to.be.revertedWithCustomError(
        multicall,
        P2PixErrors.CallFailed,
      );
    });
  });
  describe("Deposit", async () => {
    it("should revert if ERC20 is not allowed", async () => {
      const pTarget = "7ce3339x4133301u8f63pn71a5333118";
      const root = ethers.keccak256(
        ethers.toUtf8Bytes("root"),
      );
      // const txArgs: DepositArgs = {
      //   pixTarget: pTarget,
      //   allowlistRoot: root,
      //   token: owner.address,
      //   amount: BigInt(1),
      //   valid: true,
      // };

      const tx = p2pix.deposit(
        pTarget,
        root,
        owner.address,
        BigInt(1),
        true,
      );

      await expect(tx).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.TokenDenied,
      );
    });
    it("should revert if pixTarget is empty", async () => {
      const root = ethers.keccak256(
        ethers.toUtf8Bytes("root"),
      );

      const tx = p2pix.deposit(
        "",
        root,
        erc20.target,
        BigInt(1),
        true,
      );

      await expect(tx).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.EmptyPixTarget,
      );
    });
    it("should revert if amount exceeds the balance limit", async () => {
      const pTarget = "7ce3339x4133301u8f63pn71a5333118";
      const root = ethers.keccak256(
        ethers.toUtf8Bytes("root"),
      );
      const tx = p2pix.deposit(
        pTarget,
        root,
        erc20.target,
        parseEther("100000001"),
        true,
      );

      await expect(tx).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.MaxBalExceeded,
      );
    });
    it("should create deposit, update storage and emit event", async () => {
      const pTarget = "7ce3339x4133301u8f63pn71a5333118";
      // we use `hashZero` to avoid updating seller's allowlist settings
      const root = ethers.ZeroHash;
      await erc20.approve(p2pix.target, price);

      const tx = await p2pix.deposit(
        pTarget,
        root,
        erc20.target,
        price,
        true,
      );
      const storage = await p2pix.getBalance.staticCall(
        owner.address,
        erc20.target,
      );
      const pixTarget = await p2pix.getPixTarget.staticCall(
        owner.address,
        erc20.target,
      );
      const valid = await p2pix.getValid.staticCall(
        owner.address,
        erc20.target,
      );

      const allowList = await p2pix.sellerAllowList(
        owner.address,
      );
      const balances = await p2pix.getBalances.staticCall(
        [owner.address, acc01.address],
        erc20.target,
      );

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "DepositAdded")
        .withArgs(owner.address, erc20.target, price);
      await expect(tx).to.changeTokenBalances(
        ethers,
        erc20,
        [owner.address, p2pix.target],
        [price * -1n, price],
      );
      expect(storage).to.eq(price);
      expect(pixTarget).to.eq(
        stringToHex(pTarget, { size: 32 }),
      );
      expect(valid).to.eq(true);
      expect(allowList).to.eq(root);
      expect(balances[0]).to.eq(price);
      expect(balances[1]).to.eq(zero);
    });
    // edge case test
    it("should create multiple deposits", async () => {
      // const acc01Key = await p2pix._castAddrToKey.staticCall(
      //   acc01.address,
      // );
      // const acc02Key = await p2pix._castAddrToKey.staticCall(
      //   acc02.address,
      // );
      // const acc03Key = await p2pix._castAddrToKey.staticCall(
      //   acc03.address,
      // );

      const pTarget = "7ce3339x4133301u8f63pn71a5333118";
      const pTarget2 = "12312333321";
      const pTarget3 = "43999999999";
      // we mock the allowlist root here only to test storage update. In depth
      // allowlist test coverage in both "Lock" and "Allowlist Settings" unit tests.
      const root = ethers.keccak256(
        ethers.toUtf8Bytes("root"),
      );
      const nullRoot = ethers.ZeroHash;
      const price2 = price * 2n;
      const price3 = price * 3n;
      const price4 = price * 4n;
      const prices: bigint[] = [
        price,
        price2,
        price3,
        price4,
      ];
      await erc20.mint(
        getSignerAddrs(4, await ethers.getSigners()),
        price4,
      );
      await erc20.connect(owner).approve(p2pix.target, price);
      await erc20
        .connect(acc01)
        .approve(p2pix.target, price2);
      await erc20
        .connect(acc02)
        .approve(p2pix.target, price3);
      await erc20
        .connect(acc03)
        .approve(p2pix.target, price4);

      const tx = await p2pix
        .connect(owner)
        .deposit(pTarget, root, erc20.target, price, true);
      const tx2 = await p2pix
        .connect(acc01)
        .deposit(
          pTarget2,
          nullRoot,
          erc20.target,
          price2,
          false,
        );
      const tx3 = await p2pix
        .connect(acc02)
        .deposit(pTarget3, root, erc20.target, price3, true);
      const tx4 = await p2pix
        .connect(acc03)
        .deposit(
          pTarget,
          nullRoot,
          erc20.target,
          price4,
          false,
        );

      const balances = await p2pix.getBalances.staticCall(
        [
          owner.address,
          acc01.address,
          acc02.address,
          acc03.address,
        ],
        erc20.target,
      );

      const storage1 = await p2pix.getBalance.staticCall(
        owner.address,
        erc20.target,
      );
      const storage2 = await p2pix.getBalance.staticCall(
        acc01.address,
        erc20.target,
      );
      const storage3 = await p2pix.getBalance.staticCall(
        acc02.address,
        erc20.target,
      );
      const storage4 = await p2pix.getBalance.staticCall(
        acc03.address,
        erc20.target,
      );

      const pixTarget1 = await p2pix.getPixTarget.staticCall(
        owner.address,
        erc20.target,
      );
      const pixTarget2 = await p2pix.getPixTarget.staticCall(
        acc01.address,
        erc20.target,
      );
      const pixTarget3 = await p2pix.getPixTarget.staticCall(
        acc02.address,
        erc20.target,
      );
      const pixTarget4 = await p2pix.getPixTarget.staticCall(
        acc03.address,
        erc20.target,
      );

      const valid1 = await p2pix.getValid.staticCall(
        owner.address,
        erc20.target,
      );
      const valid2 = await p2pix.getValid.staticCall(
        acc01.address,
        erc20.target,
      );
      const valid3 = await p2pix.getValid.staticCall(
        acc02.address,
        erc20.target,
      );
      const valid4 = await p2pix.getValid.staticCall(
        acc03.address,
        erc20.target,
      );

      const allowList1 = await p2pix.sellerAllowList(
        owner.address,
      );
      const allowList2 = await p2pix.sellerAllowList(
        acc01.address,
      );
      const allowList3 = await p2pix.sellerAllowList(
        acc02.address,
      );
      const allowList4 = await p2pix.sellerAllowList(
        acc03.address,
      );

      expect(tx).to.be.ok;
      expect(tx2).to.be.ok;
      expect(tx3).to.be.ok;
      expect(tx4).to.be.ok;

      const transactions = [tx, tx2, tx3, tx4];
      const addresses = [
        owner.address,
        acc01.address,
        acc02.address,
        acc03.address,
      ];
      const depositPrices = [price, price2, price3, price4];

      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        const addr = addresses[i];
        const depositPrice = depositPrices[i];
        const amount =
          parseEther("100") * BigInt(i + 1) * -1n;

        await expect(tx)
          .to.emit(p2pix, "DepositAdded")
          .withArgs(addr, erc20.target, depositPrice);
        await expect(tx).to.changeTokenBalances(
          ethers,
          erc20,
          [addr, p2pix.target],
          [amount, depositPrice],
        );
      }

      expect(prices[0]).to.eq(balances[0]);
      expect(prices[1]).to.eq(balances[1]);
      expect(prices[2]).to.eq(balances[2]);
      expect(prices[3]).to.eq(balances[3]);

      expect(storage1).to.eq(price);
      expect(pixTarget1).to.eq(
        stringToHex(pTarget, { size: 32 }),
      );
      expect(valid1).to.eq(true);
      expect(allowList1).to.eq(root);

      expect(storage2).to.eq(price2);
      expect(pixTarget2).to.eq(
        stringToHex(pTarget2, { size: 32 }),
      );
      expect(valid2).to.eq(false);
      expect(allowList2).to.eq(nullRoot);

      expect(storage3).to.eq(price3);
      expect(pixTarget3).to.eq(
        stringToHex(pTarget3, { size: 32 }),
      );
      expect(valid3).to.eq(true);
      expect(allowList3).to.eq(root);

      expect(storage4).to.eq(price4);
      expect(pixTarget4).to.eq(
        stringToHex(pTarget, { size: 32 }),
      );
      expect(valid4).to.eq(false);
      expect(allowList4).to.eq(nullRoot);
    });
  });
  describe("Lock", async () => {
    it("should revert if deposit is invalid", async () => {
      const pTarget = "7ce3339x4133301u8f63pn71a5333118";
      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        pTarget,
        ethers.ZeroHash,
        erc20.target,
        price,
        true,
      );
      await p2pix.setValidState(erc20.target, false);
      const fail = p2pix
        .connect(acc03)
        .lock(owner.address, erc20.target, price, [], []);
      const fail2 = p2pix.lock(zero, zero, price, [], []);

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
      await erc20.approve(p2pix.target, price);
      const pTarget = "7ce3339x4133301u8f63pn71a5333118";
      await p2pix.deposit(
        pTarget,
        ethers.ZeroHash,
        erc20.target,
        price,
        true,
      );
      const fail = p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.target,
          price * 2n,
          [],
          [],
        );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.NotEnoughTokens,
      );
    });

    it("should revert if an invalid allowlist merkleproof is provided", async () => {
      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        "7ce3339x4133301u8f63pn71a5333118",
        merkleRoot,
        erc20.target,
        price,
        true,
      );
      const fail = p2pix
        .connect(acc02)
        .lock(
          owner.address,
          erc20.target,
          1000n,
          [ethers.keccak256(ethers.toUtf8Bytes("wrong"))],
          [],
        );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.AddressDenied,
      );
    });
    it("should revert if msg.sender does not have enough credit in his spend limit", async () => {
      await erc20.approve(p2pix.target, price * 3n);
      await p2pix.deposit(
        "1",
        merkleRoot,
        erc20.target,
        price * 3n,
        true,
      );
      const fail = p2pix
        .connect(acc02)
        .lock(
          owner.address,
          erc20.target,
          price * 2n,
          [],
          [],
        );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.AmountNotAllowed,
      );
    });
    it("should create a lock, update storage and emit events via the allowlist path", async () => {
      const target = "333";
      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        target,
        merkleRoot,
        erc20.target,
        price,
        true,
      );
      const tx = await p2pix
        .connect(acc01)
        .lock(owner.address, erc20.target, price, proof, []);
      const storage: Lock =
        await p2pix.mapLocks.staticCall(1);

      const rc: ContractTransactionReceipt = (await tx.wait())!;
      const expiration = rc.blockNumber + 10;

      await expect(tx)
        .to.emit(p2pix, "LockAdded")
        .withArgs(
          acc01.address,
          BigInt(1),
          owner.address,
          price,
        );
      expect(tx).to.be.ok;
      expect(storage.seller).to.eq(owner.address);
      expect(storage.counter).to.eq(1);
      expect(storage.amount).to.eq(price);
      expect(storage.expirationBlock).to.eq(expiration);
      expect(storage.pixTarget).to.eq(
        stringToHex(target, { size: 32 }),
      );
      expect(storage.buyerAddress).to.eq(acc01.address);
      expect(storage.token).to.eq(erc20.target);
    });
    it("should create a lock, update storage and emit events via the reputation path 1", async () => {
      const root = ethers.ZeroHash;
      const target = "101";
      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        target,
        root,
        erc20.target,
        price,
        true,
      );
      const tx = await p2pix
        .connect(acc01)
        .lock(owner.address, erc20.target, price, [], []);
      const storage: Lock =
        await p2pix.mapLocks.staticCall(1);

      const rc: ContractTransactionReceipt = (await tx.wait())!;
      const expiration = rc.blockNumber + 10;
      const key = await p2pix._castAddrToKey.staticCall(
        owner.address,
      );
      const castBack =
        await p2pix._castKeyToAddr.staticCall(key);

      expect(tx).to.be.ok;
      expect(castBack).to.eq(owner.address);
      expect(storage.seller).to.eq(owner.address);
      expect(storage.counter).to.eq(1);
      expect(storage.amount).to.eq(price);
      expect(storage.expirationBlock).to.eq(expiration);
      expect(storage.pixTarget).to.eq(
        stringToHex(target, { size: 32 }),
      );
      expect(storage.buyerAddress).to.eq(acc01.address);
      expect(storage.token).to.eq(erc20.target);

      await expect(tx)
        .to.emit(p2pix, "LockAdded")
        .withArgs(
          acc01.address,
          1,
          owner.address,
          storage.amount,
        );
    });
    it("should create a lock, update storage and emit events via the reputation path 2", async () => {
      const root = ethers.ZeroHash;
      const newPrice = price * 2n + 1n;
      const endtoendID = ethers.ZeroHash;
      const target = "101";
      const messageToSign = ethers.solidityPackedKeccak256(
        ["bytes32", "uint80", "bytes32"],
        [
          stringToHex(target, { size: 32 }),
          price,
          endtoendID,
        ],
      );
      const messageHashBytes = ethers.getBytes(messageToSign);
      const flatSig = await acc01.signMessage(
        messageHashBytes,
      );
      // const sig = ethers.utils.splitSignature(flatSig);
      await erc20.approve(p2pix.target, newPrice);
      await p2pix.deposit(
        target,
        root,
        erc20.target,
        newPrice,
        true,
      );
      await p2pix
        .connect(acc01)
        .lock(owner.address, erc20.target, price, [], []);
      await p2pix
        .connect(acc01)
        .release(BigInt(1), endtoendID, flatSig);
      const tx = await p2pix
        .connect(acc01)
        .lock(
          owner.address,
          erc20.target,
          price + 1n,
          [],
          [],
        );
      const storage: Lock =
        await p2pix.mapLocks.staticCall(2);

      const rc: ContractTransactionReceipt = (await tx.wait())!;
      const expiration = rc.blockNumber + 10;
      const key = await p2pix._castAddrToKey.staticCall(
        owner.address,
      );
      const castBack =
        await p2pix._castKeyToAddr.staticCall(key);

      expect(tx).to.be.ok;
      expect(castBack).to.eq(owner.address);
      expect(storage.seller).to.eq(owner.address);
      expect(storage.counter).to.eq(2);
      expect(storage.amount).to.eq(price + 1n);
      expect(storage.expirationBlock).to.eq(expiration);
      expect(storage.pixTarget).to.eq(
        stringToHex(target, { size: 32 }),
      );
      expect(storage.buyerAddress).to.eq(acc01.address);
      expect(storage.token).to.eq(erc20.target);

      await expect(tx)
        .to.emit(p2pix, "LockAdded")
        .withArgs(
          acc01.address,
          2,
          owner.address,
          storage.amount,
        );
    });
    // edge case test
    it("should create multiple locks", async () => {
      const newPrice = price / 2n;
      const target = BigInt(101).toString();
      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        target,
        merkleRoot,
        erc20.target,
        price,
        true,
      );
      const tx1 = await p2pix
        .connect(acc01)
        .lock(
          owner.address,
          erc20.target,
          newPrice,
          proof,
          [],
        );
      const storage1: Lock =
        await p2pix.mapLocks.staticCall(1);

      const rc1: ContractTransactionReceipt =
        (await tx1.wait())!;
      const expiration1 = rc1.blockNumber + 10;

      const tx2 = await p2pix
        .connect(acc01)
        .lock(
          owner.address,
          erc20.target,
          BigInt(100),
          [],
          [],
        );
      const storage2: Lock =
        await p2pix.mapLocks.staticCall(2);

      const rc2: ContractTransactionReceipt =
        (await tx2.wait())!;
      const expiration2 = rc2.blockNumber + 10;

      const tx3 = await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.target,
          BigInt(100),
          [],
          [],
        );
      const storage3: Lock =
        await p2pix.mapLocks.staticCall(3);

      const rc3: ContractTransactionReceipt =
        (await tx3.wait())!;
      const expiration3 = rc3.blockNumber + 10;

      // const key = await p2pix._castAddrToKey.staticCall(
      //   owner.address,
      // );

      // const lockStatus1 = await p2pix.getLocksStatus.staticCall([1,7,7,2,3,4,5,5,2,3]);
      // const lockStatus2 = await p2pix.getLocksStatus.staticCall([0,1,2,3]);
      // const lockStatus3 = await p2pix.getLocksStatus.staticCall([7,7,333,14,777]);
      // const lockStatus4 = await p2pix.getLocksStatus.staticCall([]);

      // All getLocksStatus calls were batched via the Multicall contract.
      const ls1: [bigint[], bigint[]] = [
        getBnFrom([1, 7, 7, 2, 3, 4, 5, 5, 2, 3]),
        getBnFrom([1, 0, 0, 1, 1, 0, 0, 0, 1, 1]),
      ];

      const ls2: [bigint[], bigint[]] = [
        getBnFrom([0, 1, 2, 3]),
        getBnFrom([0, 1, 1, 1]),
      ];

      const ls3: [bigint[], bigint[]] = [
        getBnFrom([7, 7, 333, 14, 777]),
        getBnFrom([0, 0, 0, 0, 0]),
      ];

      const ls4 = [[], []];

      const batchedLocks: Array<bigint[]> = [
        ls1,
        ls2,
        ls3,
        ls4,
      ].map(arr => arr[0]);

      const cData: Call[] = getLockData(
        p2pix.target as string,
        batchedLocks,
      );

      const batchCall =
        await multicall.mtc1.staticCall(cData);
      const blockNumber = batchCall[0];

      const result: string[] = batchCall[1].slice(0, 4);

      const decodedData = result.map(r =>
        ethers.AbiCoder.defaultAbiCoder().decode(
          ["uint256[]", "uint8[]"],
          r,
        ),
      );

      const [ls1Res, ls2Res, ls3Res, ls4Res] = decodedData;

      expect(tx1).to.be.ok;
      expect(tx2).to.be.ok;
      expect(tx3).to.be.ok;

      expect(blockNumber).to.eq(9);
      expect(ls1Res).to.deep.equal(ls1);
      expect(ls2Res).to.deep.equal(ls2);
      expect(ls3Res).to.deep.equal(ls3);
      expect(ls4Res).to.deep.equal(ls4);

      expect(owner.address)
        .to.eq(storage1.seller)
        .and.to.eq(storage2.seller)
        .and.to.eq(storage3.seller);

      expect(storage1.counter).to.eq(1);
      expect(storage2.counter).to.eq(2);
      expect(storage3.counter).to.eq(3);

      expect(storage1.amount).to.eq(newPrice);
      expect(BigInt(100))
        .to.eq(storage2.amount)
        .and.to.eq(storage3.amount);

      expect(storage1.expirationBlock).to.eq(expiration1);
      expect(storage2.expirationBlock).to.eq(expiration2);
      expect(storage3.expirationBlock).to.eq(expiration3);

      expect(stringToHex(target, { size: 32 }))
        .to.eq(storage1.pixTarget)
        .and.to.eq(storage2.pixTarget)
        .and.to.eq(storage3.pixTarget);

      expect(acc01.address)
        .to.eq(storage1.buyerAddress)
        .and.to.eq(storage2.buyerAddress);
      expect(storage3.buyerAddress).to.eq(acc03.address);

      expect(erc20.target)
        .to.eq(storage1.token)
        .and.to.eq(storage2.token)
        .and.to.eq(storage3.token);

      await expect(tx1)
        .to.emit(p2pix, "LockAdded")
        .withArgs(
          acc01.address,
          1,
          owner.address,
          storage1.amount,
        );
      await expect(tx2)
        .to.emit(p2pix, "LockAdded")
        .withArgs(
          acc01.address,
          2,
          owner.address,
          storage2.amount,
        );
      await expect(tx3)
        .to.emit(p2pix, "LockAdded")
        .withArgs(
          acc03.address,
          3,
          owner.address,
          storage3.amount,
        );
    });
  });
  describe("Set sellerBalance Valid State", async () => {
    it("should revert if sellerBalance hasn't been initialized", async () => {
      const fail = p2pix.setValidState(erc20.target, false);

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.NotInitialized,
      );
    });
    it("should setValidState, update storage and emit events", async () => {
      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        BigInt(10101).toString(),
        merkleRoot,
        erc20.target,
        price,
        true,
      );
      const state1 = await p2pix.getValid.staticCall(
        owner.address,
        erc20.target,
      );
      const tx = await p2pix.setValidState(
        erc20.target,
        false,
      );
      const state2 = await p2pix.getValid.staticCall(
        owner.address,
        erc20.target,
      );

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "ValidSet")
        .withArgs(owner.address, erc20.target, false);
      expect(state1).to.be.true;
      expect(state2).to.be.false;
    });
    it("should cancel multiple balances", async () => {
      const hashZero = ethers.ZeroHash;
      await erc20.mint([acc01.address, acc02.address], price);
      const target = BigInt(1).toString();
      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        target,
        hashZero,
        erc20.target,
        price,
        true,
      );
      await erc20.connect(acc01).approve(p2pix.target, price);
      await p2pix
        .connect(acc01)
        .deposit(
          target,
          hashZero,
          erc20.target,
          price,
          false,
        );
      await erc20.connect(acc02).approve(p2pix.target, price);
      await p2pix
        .connect(acc02)
        .deposit(target, hashZero, erc20.target, price, true);
      const oldState1 = await p2pix.getValid.staticCall(
        owner.address,
        erc20.target,
      );
      const oldState2 = await p2pix.getValid.staticCall(
        acc01.address,
        erc20.target,
      );
      const oldState3 = await p2pix.getValid.staticCall(
        acc02.address,
        erc20.target,
      );
      const tx1 = await p2pix.setValidState(
        erc20.target,
        false,
      );
      const tx2 = await p2pix
        .connect(acc01)
        .setValidState(erc20.target, true);
      const tx3 = await p2pix
        .connect(acc02)
        .setValidState(erc20.target, true);
      const newState1 = await p2pix.getValid.staticCall(
        owner.address,
        erc20.target,
      );
      const newState2 = await p2pix.getValid.staticCall(
        acc01.address,
        erc20.target,
      );
      const newState3 = await p2pix.getValid.staticCall(
        acc02.address,
        erc20.target,
      );

      expect(tx1).to.be.ok;
      expect(tx2).to.be.ok;
      expect(tx3).to.be.ok;
      await expect(tx1)
        .to.emit(p2pix, "ValidSet")
        .withArgs(owner.address, erc20.target, false);
      await expect(tx2)
        .to.emit(p2pix, "ValidSet")
        .withArgs(acc01.address, erc20.target, true);
      await expect(tx3)
        .to.emit(p2pix, "ValidSet")
        .withArgs(acc02.address, erc20.target, true);
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
      const target = BigInt(101).toString();
      const messageToSign = ethers.solidityPackedKeccak256(
        ["uint160", "uint80", "bytes32"],
        [target, 100, ethers.ZeroHash],
      );
      const flatSig = await acc01.signMessage(
        ethers.getBytes(messageToSign),
      );
      // const sig = ethers.utils.splitSignature(flatSig);
      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        target,
        merkleRoot,
        erc20.target,
        price,
        true,
      );
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.target,
          BigInt(100),
          [],
          [],
        );
      const lockID = BigInt(1);
      await networkHelpers.mine(13);
      const fail = p2pix.release(
        lockID,
        ethers.ZeroHash,
        flatSig,
      );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.LockExpired,
      );
    });
    it("should revert if lock has already been released", async () => {
      const target = BigInt(1).toString();
      const hashZero = ethers.ZeroHash;
      const messageToSign = ethers.solidityPackedKeccak256(
        ["bytes32", "uint80", "bytes32"],
        [stringToHex(target, { size: 32 }), 100, hashZero],
      );
      const flatSig = await acc01.signMessage(
        ethers.getBytes(messageToSign),
      );
      // const sig = ethers.utils.splitSignature(flatSig);
      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        target,
        merkleRoot,
        erc20.target,
        price,
        true,
      );
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.target,
          BigInt(100),
          [],
          [],
        );
      const lockID = BigInt(1);
      await p2pix.release(lockID, ethers.ZeroHash, flatSig);
      const fail = p2pix.release(
        lockID,
        ethers.ZeroHash,
        flatSig,
      );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.AlreadyReleased,
      );
    });
    it("should revert if signed message has already been used", async () => {
      const target = BigInt(101).toString();
      const messageToSign = ethers.solidityPackedKeccak256(
        ["bytes32", "uint80", "bytes32"],
        [
          stringToHex(target, { size: 32 }),
          100,
          ethers.ZeroHash,
        ],
      );
      const flatSig = await owner.signMessage(
        ethers.getBytes(messageToSign),
      );
      // const sig = ethers.utils.splitSignature(flatSig);
      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        target,
        ethers.ZeroHash,
        erc20.target,
        price,
        true,
      );
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.target,
          BigInt(100),
          [],
          [],
        );

      await p2pix
        .connect(acc01)
        .release(BigInt(1), ethers.ZeroHash, flatSig);
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.target,
          BigInt(100),
          [],
          [],
        );
      const fail = p2pix
        .connect(acc01)
        .release(BigInt(2), ethers.ZeroHash, flatSig);

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.TxAlreadyUsed,
      );
    });
    it("should revert if ecrecovered signer is invalid", async () => {
      const target = BigInt(101).toString();
      const messageToSign = ethers.solidityPackedKeccak256(
        ["bytes32", "uint80", "bytes32"],
        [
          stringToHex(target, { size: 32 }),
          100,
          ethers.ZeroHash,
        ],
      );
      const flatSig = await acc03.signMessage(
        ethers.getBytes(messageToSign),
      );
      // const sig = ethers.utils.splitSignature(flatSig);

      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        target,
        ethers.ZeroHash,
        erc20.target,
        price,
        true,
      );
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.target,
          BigInt(100),
          [],
          [],
        );
      const fail = p2pix
        .connect(acc01)
        .release(BigInt(1), ethers.ZeroHash, flatSig);

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.InvalidSigner,
      );
    });
    it("should release lock, update storage and emit events", async () => {
      const zero = ethers.ZeroHash;
      const endtoendID = ethers.ZeroHash;
      const pixTarget = BigInt(101).toString();
      const messageToSign = ethers.solidityPackedKeccak256(
        ["bytes32", "uint80", "bytes32"],
        [
          stringToHex(pixTarget, { size: 32 }),
          100,
          endtoendID,
        ],
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
      const messageHashBytes = ethers.getBytes(messageToSign);
      const flatSig = await acc01.signMessage(
        messageHashBytes,
      );
      // const sig = ethers.utils.splitSignature(flatSig);
      const root = ethers.ZeroHash;

      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        pixTarget,
        root,
        erc20.target,
        price,
        true,
      );
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.target,
          BigInt(100),
          [],
          [],
        );
      const acc01Key = await p2pix._castAddrToKey.staticCall(
        acc01.address,
      );
      const acc03Key = await p2pix._castAddrToKey.staticCall(
        acc03.address,
      );
      const userRecordA =
        await p2pix.userRecord.staticCall(acc01Key);
      const userRecord1 =
        await p2pix.userRecord.staticCall(acc03Key);
      const storage1: Lock = await p2pix.mapLocks.staticCall(
        BigInt(1),
      );
      const tx = await p2pix
        .connect(acc01)
        .release(BigInt(1), endtoendID, flatSig);

      const lockStatus1 =
        await p2pix.getLocksStatus.staticCall([1]);
      const ls1: [bigint[], number[]] = [[BigInt(1)], [3]];
      const funcSig = "0xd6e8b973";
      const args = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address[]", "bool[]"],
        [[acc01.address], [false]],
      );
      const cd1 = funcSig + args.substring(2);
      const cd2: Call[] = getLockData(
        p2pix.target as string,
        [ls1[0]],
      );
      const mtcCalls = [
        { target: p2pix.target, callData: cd1 },
      ];
      mtcCalls.push(cd2[0]);
      const mtc2 = await multicall.mtc2.staticCall(mtcCalls);
      const blockNumber: bigint = mtc2[0];
      const blockhash: string = mtc2[1];
      const result = mtc2.slice(2).flat(1) as Result[];
      const res1: string[] = [result[1].returnData];
      const decodedLockData = res1.map(r =>
        ethers.AbiCoder.defaultAbiCoder().decode(
          ["uint256[]", "uint8[]"],
          r,
        ),
      );

      const storage2: Lock =
        await p2pix.mapLocks.staticCall(1);
      const userRecordB =
        await p2pix.userRecord.staticCall(acc01Key);
      const userRecord2 =
        await p2pix.userRecord.staticCall(acc03Key);
      const used = await p2pix.usedTransactions.staticCall(
        messageHashBytes,
      );
      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "LockReleased")
        .withArgs(acc03.address, BigInt(1), storage1.amount);
      expect(storage1.expirationBlock).to.eq(BigInt(17));
      expect(storage1.amount).to.eq(BigInt(100));
      expect(lockStatus1[0].toString()).to.equal(
        ls1[0].toString(),
      );
      expect(lockStatus1[1].toString()).to.equal(
        ls1[1].toString(),
      );
      expect(blockNumber).to.eq(8);
      expect(blockhash).to.deep.equal(ethers.ZeroHash);
      expect(result[0].success).to.eq(false);
      expect(result[1].success).to.eq(true);
      expect(decodedLockData.flat(1)).to.deep.eq(ls1);
      expect(storage2.expirationBlock).to.eq(zero);
      expect(storage2.amount).to.eq(zero);
      expect(used).to.eq(true);
      expect(userRecordA).to.eq(zero);
      expect(userRecord1).to.eq(zero);
      expect(userRecordB).to.eq(BigInt(50));
      expect(userRecord2).to.eq(BigInt(50));
      await expect(tx).to.changeTokenBalances(
        ethers,
        erc20,
        [acc03.address, acc01.address, acc02.address],
        [100, 0, 0],
      );
    });
    // edge case test
    it("should release multiple locks", async () => {
      const endtoendID = ethers.ZeroHash;
      const pixTarget = BigInt(101).toString();
      const root = ethers.ZeroHash;
      const acc01Key = await p2pix._castAddrToKey.staticCall(
        acc01.address,
      );
      const acc03Key = await p2pix._castAddrToKey.staticCall(
        acc03.address,
      );
      const acc01Record1 =
        await p2pix.userRecord.staticCall(acc01Key);
      const acc03Record1 =
        await p2pix.userRecord.staticCall(acc03Key);
      const messageToSign1 = ethers.solidityPackedKeccak256(
        ["bytes32", "uint80", "bytes32"],
        [
          stringToHex(pixTarget, { size: 32 }),
          100,
          endtoendID,
        ],
      );
      const flatSig1 = await owner.signMessage(
        ethers.getBytes(messageToSign1),
      );
      // const sig1 = ethers.utils.splitSignature(flatSig1);
      const messageToSign2 = ethers.solidityPackedKeccak256(
        ["bytes32", "uint80", "bytes32"],
        [
          stringToHex(pixTarget, { size: 32 }),
          50,
          endtoendID,
        ],
      );
      const flatSig2 = await owner.signMessage(
        ethers.getBytes(messageToSign2),
      );
      // const sig2 = ethers.utils.splitSignature(flatSig2);
      const messageToSign3 = ethers.solidityPackedKeccak256(
        ["bytes32", "uint80", "bytes32"],
        [
          stringToHex(pixTarget, { size: 32 }),
          25,
          endtoendID,
        ],
      );
      const flatSig3 = await owner.signMessage(
        ethers.getBytes(messageToSign3),
      );
      // const sig3 = ethers.utils.splitSignature(flatSig3);
      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        pixTarget,
        root,
        erc20.target,
        price,
        true,
      );
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.target,
          BigInt(100),
          [],
          [],
        );
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.target,
          BigInt(50),
          [],
          [],
        );
      await p2pix
        .connect(acc03)
        .lock(
          owner.address,
          erc20.target,
          BigInt(25),
          [],
          [],
        );

      const lockStatus1 =
        await p2pix.getLocksStatus.staticCall([1, 2, 3, 44]);
      const ls1: [bigint[], bigint[]] = [
        [BigInt(1), BigInt(2), BigInt(3), BigInt(44)],
        getBnFrom([1, 1, 1, 0]),
      ];

      const lockID = BigInt(1);
      const lockID2 = BigInt(2);
      const lockID3 = BigInt(3);
      const storage1: Lock =
        await p2pix.mapLocks.staticCall(lockID);
      const storage2: Lock =
        await p2pix.mapLocks.staticCall(lockID2);
      const storage3: Lock =
        await p2pix.mapLocks.staticCall(lockID3);
      // relayerPremium == 0
      const tx = await p2pix
        .connect(acc01)
        .release(lockID, endtoendID, flatSig1);
      // relayerPremium != 0 &&
      // lock's msg.sender != release's msg.sender
      const tx1 = await p2pix
        .connect(acc01)
        .release(lockID2, endtoendID, flatSig2);
      // relayerPremium != 0 &&
      // lock's msg.sender == release's msg.sender
      const tx2 = await p2pix
        .connect(acc03)
        .release(lockID3, endtoendID, flatSig3);
      const used1 = await p2pix.usedTransactions.staticCall(
        ethers.getBytes(messageToSign1),
      );
      const used2 = await p2pix.usedTransactions.staticCall(
        ethers.getBytes(messageToSign2),
      );
      const used3 = await p2pix.usedTransactions.staticCall(
        ethers.getBytes(messageToSign3),
      );
      const acc01Record2 =
        await p2pix.userRecord.staticCall(acc01Key);
      const acc03Record2 =
        await p2pix.userRecord.staticCall(acc03Key);

      const lockStatus2 =
        await p2pix.getLocksStatus.staticCall([1, 2, 3, 44]);
      const ls2: [bigint[], bigint[]] = [
        [BigInt(1), BigInt(2), BigInt(3), BigInt(44)],
        getBnFrom([3, 3, 3, 0]),
      ];

      const batchedLocks: Array<bigint[]> = [
        ls1.slice(0, 1)[0],
        ls2.slice(0, 1)[0],
      ];
      const cData: Call[] = getLockData(
        erc20.target as string,
        batchedLocks,
      );

      expect(tx).to.be.ok;
      expect(tx1).to.be.ok;
      expect(tx2).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "LockReleased")
        .withArgs(acc03.address, lockID, storage1.amount);
      await expect(tx1)
        .to.emit(p2pix, "LockReleased")
        .withArgs(acc03.address, lockID2, storage2.amount);
      await expect(tx2)
        .to.emit(p2pix, "LockReleased")
        .withArgs(acc03.address, lockID3, storage3.amount);
      expect(used1).to.eq(true);
      expect(used2).to.eq(true);
      expect(used3).to.eq(true);
      expect(0).to.eq(acc01Record1).and.to.eq(acc03Record1);
      expect(acc01Record2).to.eq(75); // 50 + 25 + 0
      expect(acc03Record2).to.eq(100); // 50 + 25 + 25

      const addresses = [
        acc01.address,
        acc02.address,
        acc03.address,
        p2pix.target,
      ];

      const balances = [
        [0, 0, 100, "-100"],
        [0, 0, 50, "-50"],
        [0, 0, 25, "-25"],
      ];

      for (let i = 0; i < 3; i++) {
        const txs = [tx, tx1, tx2][i];
        await expect(txs).to.changeTokenBalances(
          ethers,
          erc20,
          addresses,
          balances[i],
        );
      }

      expect(lockStatus1[0].toString()).to.equal(
        ls1[0].toString(),
      );
      expect(lockStatus1[1].toString()).to.equal(
        ls1[1].toString(),
      );
      expect(lockStatus2[0].toString()).to.equal(
        ls2[0].toString(),
      );
      expect(lockStatus2[1].toString()).to.equal(
        ls2[1].toString(),
      );
      await expect(
        multicall.mtc1.staticCall(cData),
      ).to.be.revertedWithCustomError(
        multicall,
        P2PixErrors.CallFailed,
      );
    });
  });
  describe("Unexpire Locks", async () => {
    it("should revert if lock isn't expired", async () => {
      const target = BigInt(101).toString();
      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        target,
        merkleRoot,
        erc20.target,
        price,
        true,
      );
      await p2pix
        .connect(acc02)
        .lock(owner.address, erc20.target, BigInt(1), [], []);
      const lockID = BigInt(1);
      const fail = p2pix.unlockExpired([lockID]);

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.NotExpired,
      );
    });
    it("should revert if lock has already been released", async () => {
      const endtoendID = ethers.ZeroHash;
      const pixTarget = BigInt(101).toString();
      const messageToSign = ethers.solidityPackedKeccak256(
        ["bytes32", "uint80", "bytes32"],
        [stringToHex(pixTarget, { size: 32 }), 1, endtoendID],
      );
      const messageHashBytes = ethers.getBytes(messageToSign);
      const flatSig = await acc01.signMessage(
        messageHashBytes,
      );
      // const sig = ethers.utils.splitSignature(flatSig);
      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        pixTarget,
        merkleRoot,
        erc20.target,
        price,
        true,
      );
      await p2pix
        .connect(acc02)
        .lock(owner.address, erc20.target, BigInt(1), [], []);
      const lockID = BigInt(1);
      // await mine(10);
      await p2pix.release(lockID, endtoendID, flatSig);
      const fail = p2pix.unlockExpired([lockID]);

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.AlreadyReleased,
      );
    });
    it("should unlock expired locks, update storage and emit events", async () => {
      const target = BigInt(101).toString();
      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        target,
        merkleRoot,
        erc20.target,
        price,
        true,
      );
      await p2pix
        .connect(acc02)
        .lock(owner.address, erc20.target, BigInt(1), [], []);
      const lockID = BigInt(1);
      await networkHelpers.mine(11);

      const lockStatus1 =
        await p2pix.getLocksStatus.staticCall([11, 1, 777]);
      const ls1: [bigint[], bigint[]] = [
        [BigInt(11), BigInt(1), BigInt(777)],
        getBnFrom([0, 2, 0]),
      ];

      const storage: Lock =
        await p2pix.mapLocks.staticCall(lockID);
      const userKey = await p2pix._castAddrToKey.staticCall(
        acc02.address,
      );
      const record1 =
        await p2pix.userRecord.staticCall(userKey);
      const tx = await p2pix.unlockExpired([lockID]);
      const storage2: Lock =
        await p2pix.mapLocks.staticCall(lockID);
      const record2 =
        await p2pix.userRecord.staticCall(userKey);

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "LockReturned")
        .withArgs(acc02.address, lockID);
      expect(storage.amount).to.eq(BigInt(1));
      expect(storage2.amount).to.eq(ethers.ZeroHash);
      expect(record1).to.eq(0);
      expect(record2).to.eq(price);
      expect(lockStatus1[0].toString()).to.equal(
        ls1[0].toString(),
      );
    });
    it("should unlock expired through lock function", async () => {
      const target = BigInt(101).toString();
      // test method through lock fx
      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        target,
        merkleRoot,
        erc20.target,
        price,
        true,
      );
      const lock1: ContractTransactionResponse = await p2pix
        .connect(acc01)
        .lock(owner.address, erc20.target, price, proof, []);
      // as return values of non view functions can't be accessed
      // outside the evm, we fetch the lockID from the emitted event.
      const rc: ContractTransactionReceipt =
        (await lock1.wait()) as ContractTransactionReceipt;
      const eventLog = rc.logs.find(
        log => "fragment" in log && log.fragment.name === "LockAdded",
      );

      const emittedLockID =
        eventLog !== undefined && "args" in eventLog
          ? eventLog.args["lockID"]
          : undefined;
      const lockID = BigInt(1);

      // mine blocks to expire lock
      await networkHelpers.mine(12);
      // const blocknum = await p2pix.provider.getBlockNumber();
      // console.log("bn = 6 + 12 ( i.e., %s )", blocknum);
      // console.log(
      //   "\n",
      //   " 2 blocks past the expiration block",
      // );
      // const struct2: Lock = await p2pix.mapLocks.staticCall(
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
        erc20.target,
        BigInt(100),
        [],
        [lockID],
      );
      const remaining = await p2pix.getBalance.staticCall(
        owner.address,
        erc20.target,
      );

      expect(tx1).to.be.ok;
      await expect(tx1)
        .to.emit(p2pix, "LockReturned")
        .withArgs(acc01.address, lockID);
      expect(remaining).to.eq(price - 100n);
    });
    it("should unlock expired through withdraw function", async () => {
      const target = "1";
      // test method through withdraw fx
      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        target,
        merkleRoot,
        erc20.target,
        price,
        true,
      );
      await p2pix
        .connect(acc01)
        .lock(owner.address, erc20.target, price, proof, []);
      const lockID = BigInt(1);
      // mine blocks to expire lock
      await networkHelpers.mine(11);
      const tx = await p2pix.withdraw(erc20.target, price, [
        lockID,
      ]);
      const remaining = await p2pix.getBalance.staticCall(
        owner.address,
        erc20.target,
      );

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "LockReturned")
        .withArgs(acc01.address, lockID);
      expect(remaining).to.eq(0);
    });
  });

  describe("Seller Withdraw", async () => {
    it("should revert if the wished amount is invalid", async () => {
      const target = BigInt(101).toString();
      await erc20.approve(p2pix.target, price);
      await p2pix.deposit(
        target,
        merkleRoot,
        erc20.target,
        price,
        true,
      );
      const fail = p2pix
        .connect(acc02)
        .withdraw(erc20.target, price * 2n, []);

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.DecOverflow,
      );
    });
    it("should withdraw remaining funds from deposit, update storage and emit event", async () => {
      const newPrice = price / 2n;
      await erc20.approve(p2pix.target, price);
      const dep = await p2pix.deposit(
        BigInt(101).toString(),
        merkleRoot,
        erc20.target,
        price,
        true,
      );
      const tx = await p2pix.withdraw(
        erc20.target,
        price / 2n,
        [],
      );

      expect(tx).to.be.ok;
      await expect(dep).to.changeTokenBalance(
        ethers,
        erc20,
        owner.address,
        price * -1n,
      );
      await expect(dep).to.changeTokenBalance(
        ethers,
        erc20,
        p2pix.target,
        price,
      );
      await expect(tx).to.changeTokenBalance(
        ethers,
        erc20,
        owner.address,
        newPrice,
      );
      await expect(tx).to.changeTokenBalance(
        ethers,
        erc20,
        p2pix.target,
        (price / 2n) * -1n,
      );

      await expect(tx)
        .to.emit(p2pix, "DepositWithdrawn")
        .withArgs(owner.address, erc20.target, newPrice);
    });
  });

  describe("Allowlist Settings", async () => {
    it("should revert if the msg.sender differs from deposit's seller", async () => {
      const root = ethers.keccak256(
        ethers.toUtf8Bytes("root"),
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
      const oldState = await p2pix.sellerAllowList.staticCall(
        owner.address,
      );
      const tx = await p2pix
        .connect(owner)
        .setRoot(owner.address, merkleRoot);
      const newState = await p2pix.sellerAllowList.staticCall(
        owner.address,
      );

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "RootUpdated")
        .withArgs(owner.address, merkleRoot);
      expect(oldState).to.eq(ethers.ZeroHash);
      expect(newState).to.eq(merkleRoot);
    });
  });
});
