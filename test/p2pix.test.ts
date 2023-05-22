import "@nomicfoundation/hardhat-chai-matchers";
import {
  loadFixture,
  mine,
} from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import {
  BigNumber,
  BytesLike,
  ContractReceipt,
  ContractTransaction,
  Wallet,
} from "ethers";
import {
  ethers,
  network,
  /* tracer */
} from "hardhat";
import {
  MockToken,
  Multicall,
  P2PIX,
  Reputation,
} from "../src/types";
import { P2PixErrors } from "./utils/errors";
import { 
  // LockArgs, 
  // DepositArgs,
  Call, 
  Lock, 
  Result 
} from "./utils/interfaces";
import {
  getBnFrom,
  getLockData,
  getSignerAddrs,
  p2pixFixture,
  randomSigners,
  createDepositArgs,
  createLockArgs,
  createReleaseArgs
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
  let multicall: Multicall; // Multicall contract instance
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
    ({
      erc20,
      p2pix,
      reputation,
      multicall,
      merkleRoot,
      proof,
    } = await loadFixture(p2pixFixture));
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
      ).to.be.revertedWithCustomError(p2pix, P2PixErrors.Unauthorized);
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
      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.Unauthorized,
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
      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.Unauthorized,
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
      const funcSig = "0xd6e8b973";
      const args = ethers.utils.defaultAbiCoder.encode(
        ["address[]", "bool[]"],
        [[acc01.address], [false]],
      );
      const cd = funcSig + args.substring(2);
      const callStruct: Call = {
        target: p2pix.address,
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
        .withArgs(erc20.address, false)
        .and.to.emit(p2pix, "AllowedERC20Updated")
        .withArgs(owner.address, true);
      expect(newTokenState1).to.eq(false);
      expect(newTokenState2).to.eq(true);
      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.Unauthorized,
      );
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
      await expect(mtcFail)
        .to.be.revertedWithCustomError(
          multicall,
          P2PixErrors.CallFailed,
        )
    });
  });
  describe("Deposit", async () => {
    it("should revert if ERC20 is not allowed", async () => {
      const pTarget = "7ce3339x4133301u8f63pn71a5333118";
      const root = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("root"),
      );
      // const txArgs: DepositArgs = {
      //   pixTarget: pTarget,
      //   allowlistRoot: root,
      //   token: owner.address,
      //   amount: ethers.constants.One,
      //   valid: true,
      // }; 
      const txArgs = createDepositArgs(pTarget, root, owner.address, ethers.constants.One, true);

      const tx = p2pix.deposit(
        txArgs
      );

      await expect(tx).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.TokenDenied,
      );
    });
    it("should revert if pixTarget is empty", async () => {
      const root = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("root"),
      );

      const txArgs = createDepositArgs("", root, erc20.address, ethers.constants.One, true);
      
      const tx = p2pix.deposit(txArgs);

      await expect(tx).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.EmptyPixTarget,
      );
    });
    it("should revert if amount exceeds the balance limit", async () => {
      const pTarget = "7ce3339x4133301u8f63pn71a5333118";
      const root = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("root"),
      );
      const txArgs = createDepositArgs(pTarget, root, erc20.address, ethers.utils.parseEther("100000001"), true);
      const tx = p2pix.deposit(txArgs);

      await expect(tx).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.MaxBalExceeded,
      );
    });
    it("should create deposit, update storage and emit event", async () => {
      const pTarget = "7ce3339x4133301u8f63pn71a5333118";
      // we use `hashZero` to avoid updating seller's allowlist settings
      const root = ethers.constants.HashZero;
      await erc20.approve(p2pix.address, price);
      
      const tx = await p2pix.deposit(
        createDepositArgs(
        pTarget,
        root,
        erc20.address,
        price,
        true,
        ),
      );
      const storage = await p2pix.callStatic.getBalance(
        owner.address,
        erc20.address,
      );
      const pixTarget = await p2pix.callStatic.getPixTarget(
        owner.address,
        erc20.address,
      );
      const valid = await p2pix.callStatic.getValid(
        owner.address,
        erc20.address,
      );

      const allowList = await p2pix.sellerAllowList(owner.address);
      const balances = await p2pix.callStatic.getBalances(
        [owner.address, acc01.address],
        erc20.address,
      );


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
      expect(pixTarget).to.eq(await p2pix.callStatic.getStr(pTarget));
      expect(valid).to.eq(true);
      expect(allowList).to.eq(root);
      expect(balances[0]).to.eq(price);
      expect(balances[1]).to.eq(zero);
    });
    // edge case test
    it("should create multiple deposits", async () => {

      // const acc01Key = await p2pix.callStatic._castAddrToKey(
      //   acc01.address,
      // );
      // const acc02Key = await p2pix.callStatic._castAddrToKey(
      //   acc02.address,
      // );
      // const acc03Key = await p2pix.callStatic._castAddrToKey(
      //   acc03.address,
      // );

      const pTarget = "7ce3339x4133301u8f63pn71a5333118";
      const pTarget2 = "12312333321";
      const pTarget3 = "43999999999";
      // we mock the allowlist root here only to test storage update. In depth
      // allowlist test coverage in both "Lock" and "Allowlist Settings" unit tests.
      const root = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("root"),
      );
      const nullRoot = ethers.constants.HashZero;
      const price2 = price.mul(ethers.BigNumber.from(2));
      const price3 = price.mul(ethers.BigNumber.from(3));
      const price4 = price.mul(ethers.BigNumber.from(4));
      const prices: BigNumber[] = [
        price,
        price2,
        price3,
        price4,
      ];
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
        .deposit(createDepositArgs(pTarget, root, erc20.address, price, true));
      const tx2 = await p2pix
        .connect(acc01)
        .deposit(
          createDepositArgs(
            pTarget2,
            nullRoot,
            erc20.address,
            price2,
            false,
          ),
        );
      const tx3 = await p2pix
        .connect(acc02)
        .deposit(
          createDepositArgs(
            pTarget3, 
            root,
            erc20.address, 
            price3, 
            true,
          ),
        );
      const tx4 = await p2pix
        .connect(acc03)
        .deposit(
          createDepositArgs(
            pTarget,
            nullRoot,
            erc20.address,
            price4,
            false,
          ),
        );

      const balances = await p2pix.callStatic.getBalances(
        [
          owner.address,
          acc01.address,
          acc02.address,
          acc03.address,
        ],
        erc20.address,
      );

      const storage1 = await p2pix.callStatic.getBalance(
        owner.address,
        erc20.address,
      );
      const storage2 = await p2pix.callStatic.getBalance(
        acc01.address,
        erc20.address,
      );
      const storage3 = await p2pix.callStatic.getBalance(
        acc02.address,
        erc20.address,
      );
      const storage4 = await p2pix.callStatic.getBalance(
        acc03.address,
        erc20.address,
      );

      const pixTarget1 = await p2pix.callStatic.getPixTarget(
        owner.address,
        erc20.address,
      );
      const pixTarget2 = await p2pix.callStatic.getPixTarget(
        acc01.address,
        erc20.address,
      );
      const pixTarget3 = await p2pix.callStatic.getPixTarget(
        acc02.address,
        erc20.address,
      );
      const pixTarget4 = await p2pix.callStatic.getPixTarget(
        acc03.address,
        erc20.address,
      );

      const valid1 = await p2pix.callStatic.getValid(
        owner.address,
        erc20.address,
      );
      const valid2 = await p2pix.callStatic.getValid(
        acc01.address,
        erc20.address,
      );
      const valid3 = await p2pix.callStatic.getValid(
        acc02.address,
        erc20.address,
      );
      const valid4 = await p2pix.callStatic.getValid(
        acc03.address,
        erc20.address,
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
        const amount = `-${(i + 1) * 100000000000000000000}`;

        await expect(tx)
          .to.emit(p2pix, "DepositAdded")
          .withArgs(addr, erc20.address, depositPrice);
        await expect(tx).to.changeTokenBalances(
          erc20,
          [addr, p2pix.address],
          [amount, depositPrice],
        );
      }

      expect(prices[0]).to.eq(balances[0]);
      expect(prices[1]).to.eq(balances[1]);
      expect(prices[2]).to.eq(balances[2]);
      expect(prices[3]).to.eq(balances[3]);

      expect(storage1).to.eq(price);
      expect(pixTarget1).to.eq(await p2pix.callStatic.getStr(pTarget));
      expect(valid1).to.eq(true);
      expect(allowList1).to.eq(root);

      expect(storage2).to.eq(price2);
      expect(pixTarget2).to.eq(await p2pix.callStatic.getStr(pTarget2));
      expect(valid2).to.eq(false);
      expect(allowList2).to.eq(nullRoot);

      expect(storage3).to.eq(price3);
      expect(pixTarget3).to.eq(await p2pix.callStatic.getStr(pTarget3));
      expect(valid3).to.eq(true);
      expect(allowList3).to.eq(root);

      expect(storage4).to.eq(price4);
      expect(pixTarget4).to.eq(await p2pix.callStatic.getStr(pTarget));
      expect(valid4).to.eq(false);
      expect(allowList4).to.eq(nullRoot);
    });
  });
  describe("Lock", async () => {
    it("should revert if deposit is invalid", async () => {
      const pTarget = "7ce3339x4133301u8f63pn71a5333118";
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          pTarget,
          ethers.constants.HashZero,
          erc20.address,
          price,
          true,
        ),
      );
      await p2pix.setValidState(erc20.address, false);
      const fail = p2pix
        .connect(acc03)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            price,
            [],
            [],
          ),
        );
      const fail2 = p2pix.lock(
        createLockArgs(
          zero,
          zero,
          price,
          [],
          [],
        ),
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
      const pTarget = "7ce3339x4133301u8f63pn71a5333118";
      await p2pix.deposit(
        createDepositArgs(
          pTarget,
          ethers.constants.HashZero,
          erc20.address,
          price,
          true,
        ),
      );
      const fail = p2pix
        .connect(acc03)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            price.mul(ethers.BigNumber.from(2)),
            [],
            [],
          ),
        );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.NotEnoughTokens,
      );
    });

    it("should revert if an invalid allowlist merkleproof is provided", async () => {
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          "7ce3339x4133301u8f63pn71a5333118",
          merkleRoot,
          erc20.address,
          price,
          true,
        ),
      );
      const fail = p2pix
        .connect(acc02)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            ethers.BigNumber.from(1000),
            [ethers.utils.keccak256(ethers.utils.toUtf8Bytes("wrong"))],
            [],
          ),
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
        createDepositArgs(
          "1",
          merkleRoot,
          erc20.address,
          price.mul(BigNumber.from("3")),
          true,
        ),
      );
      const fail = p2pix
        .connect(acc02)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            price.mul(BigNumber.from("2")),
            [],
            [],
          ),
        );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.AmountNotAllowed,
      );
    });
    it("should create a lock, update storage and emit events via the allowlist path", async () => {
      const target = "333";
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          target,
          merkleRoot,
          erc20.address,
          price,
          true,
        ),
      );
      const tx = await p2pix
        .connect(acc01)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            price,
            proof,
            [],
          ),
        );
      const storage: Lock = await p2pix.callStatic.mapLocks(
        1,
      );

      const rc: ContractReceipt = await tx.wait();
      const expiration = rc.blockNumber + 10;

      await expect(tx)
        .to.emit(p2pix, "LockAdded")
        .withArgs(
          acc01.address,
          ethers.constants.One,
          owner.address,
          price,
        );
      expect(tx).to.be.ok;
      expect(storage.seller).to.eq(owner.address);
      expect(storage.counter).to.eq(1);
      expect(storage.amount).to.eq(price);
      expect(storage.expirationBlock).to.eq(expiration);
      expect(storage.pixTarget).to.eq(await p2pix.callStatic.getStr(target));
      expect(storage.buyerAddress).to.eq(acc01.address);
      expect(storage.token).to.eq(erc20.address);
    });
    it("should create a lock, update storage and emit events via the reputation path 1", async () => {
      const root = ethers.constants.HashZero;
      const target = "101";
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          target,
          root,
          erc20.address,
          price,
          true,
        ),
      );
      const tx = await p2pix
        .connect(acc01)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            price,
            [],
            [],
          ),
        );
      const storage: Lock = await p2pix.callStatic.mapLocks(
        1,
      );

      const rc: ContractReceipt = await tx.wait();
      const expiration = rc.blockNumber + 10;
      const key = await p2pix.callStatic._castAddrToKey(
        owner.address,
      );
      const castBack = await p2pix.callStatic._castKeyToAddr(
        key,
      );

      expect(tx).to.be.ok;
      expect(castBack).to.eq(owner.address);
      expect(storage.seller).to.eq(owner.address);
      expect(storage.counter).to.eq(1);
      expect(storage.amount).to.eq(price);
      expect(storage.expirationBlock).to.eq(expiration);
      expect(storage.pixTarget).to.eq(await p2pix.callStatic.getStr(target));
      expect(storage.buyerAddress).to.eq(acc01.address);
      expect(storage.token).to.eq(erc20.address);

      await expect(tx)
        .to.emit(p2pix, "LockAdded")
        .withArgs(acc01.address, 1, owner.address, storage.amount);
    });
    it("should create a lock, update storage and emit events via the reputation path 2", async () => {
      const root = ethers.constants.HashZero;
      const newPrice = price
        .mul(ethers.constants.Two)
        .add(ethers.constants.One);
      const endtoendID = ethers.constants.HashZero;
      const target = "101";
      const messageToSign = ethers.utils.solidityKeccak256(
        ["bytes32", "uint80", "bytes32"],
        [await p2pix.callStatic.getStr(target), price, endtoendID],
      );
      const messageHashBytes =
        ethers.utils.arrayify(messageToSign);
      const flatSig = await acc01.signMessage(
        messageHashBytes,
      );
      // const sig = ethers.utils.splitSignature(flatSig);
      await erc20.approve(p2pix.address, newPrice);
      await p2pix.deposit(
        createDepositArgs(
          target,
          root,
          erc20.address,
          newPrice,
          true,
        ),
      );
      await p2pix
        .connect(acc01)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            price,
            [],
            [],
          ),
        );
      await p2pix
        .connect(acc01)
        .release(
          createReleaseArgs(
          ethers.constants.One,
          endtoendID,
          flatSig
          ),
        );
      const tx = await p2pix
        .connect(acc01)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            price.add(ethers.constants.One),
            [],
            [],
          ),
        );
      const storage: Lock = await p2pix.callStatic.mapLocks(
        2,
      );

      const rc: ContractReceipt = await tx.wait();
      const expiration = rc.blockNumber + 10;
      const key = await p2pix.callStatic._castAddrToKey(
        owner.address,
      );
      const castBack = await p2pix.callStatic._castKeyToAddr(
        key,
      );

      expect(tx).to.be.ok;
      expect(castBack).to.eq(owner.address);
      expect(storage.seller).to.eq(owner.address);
      expect(storage.counter).to.eq(2);
      expect(storage.amount).to.eq(
        price.add(ethers.constants.One),
      );
      expect(storage.expirationBlock).to.eq(expiration);
      expect(storage.pixTarget).to.eq(await p2pix.callStatic.getStr(target));
      expect(storage.buyerAddress).to.eq(acc01.address);
      expect(storage.token).to.eq(erc20.address);

      await expect(tx)
        .to.emit(p2pix, "LockAdded")
        .withArgs(acc01.address, 2, owner.address, storage.amount);
    });
    // edge case test
    it("should create multiple locks", async () => {
      const newPrice = price.div(ethers.BigNumber.from(2));
      const target = ethers.BigNumber.from(101).toString();
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          target,
          merkleRoot,
          erc20.address,
          price,
          true,
        ),
      );
      const tx1 = await p2pix
        .connect(acc01)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            newPrice,
            proof,
            [],
          ),
        );
      const storage1: Lock = await p2pix.callStatic.mapLocks(
        1,
      );

      const rc1: ContractReceipt = await tx1.wait();
      const expiration1 = rc1.blockNumber + 10;

      const tx2 = await p2pix
        .connect(acc01)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            ethers.BigNumber.from(100),
            [],
            [],
          ),
        );
      const storage2: Lock = await p2pix.callStatic.mapLocks(
        2,
      );

      const rc2: ContractReceipt = await tx2.wait();
      const expiration2 = rc2.blockNumber + 10;

      const tx3 = await p2pix
        .connect(acc03)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            ethers.BigNumber.from(100),
            [],
            [],
          ),
        );
      const storage3: Lock = await p2pix.callStatic.mapLocks(
        3,
      );

      const rc3: ContractReceipt = await tx3.wait();
      const expiration3 = rc3.blockNumber + 10;

      // const key = await p2pix.callStatic._castAddrToKey(
      //   owner.address,
      // );

      // const lockStatus1 = await p2pix.callStatic.getLocksStatus([1,7,7,2,3,4,5,5,2,3]);
      // const lockStatus2 = await p2pix.callStatic.getLocksStatus([0,1,2,3]);
      // const lockStatus3 = await p2pix.callStatic.getLocksStatus([7,7,333,14,777]);
      // const lockStatus4 = await p2pix.callStatic.getLocksStatus([]);

      // All getLocksStatus calls were batched via the Multicall contract.
      const ls1: [BigNumber[], BigNumber[]] = [
        getBnFrom([1, 7, 7, 2, 3, 4, 5, 5, 2, 3]),
        getBnFrom([1, 0, 0, 1, 1, 0, 0, 0, 1, 1]),
      ];

      const ls2: [BigNumber[], BigNumber[]] = [
        getBnFrom([0, 1, 2, 3]),
        getBnFrom([0, 1, 1, 1]),
      ];

      const ls3: [BigNumber[], BigNumber[]] = [
        getBnFrom([7, 7, 333, 14, 777]),
        getBnFrom([0, 0, 0, 0, 0]),
      ];

      const ls4 = [[], []];

      const batchedLocks: Array<BigNumber[]> = [
        ls1,
        ls2,
        ls3,
        ls4,
      ].map(arr => arr[0]);

      const cData: Call[] = getLockData(
        p2pix.address,
        batchedLocks,
      );

      const batchCall = await multicall.callStatic.mtc1(
        cData,
      );
      const blockNumber = batchCall[0];

      const result: Array<BytesLike> = batchCall[1].slice(
        0,
        4,
      );

      const decodedData = result.map(r =>
        ethers.utils.defaultAbiCoder.decode(
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
      expect(ethers.BigNumber.from(100))
        .to.eq(storage2.amount)
        .and.to.eq(storage3.amount);

      expect(storage1.expirationBlock).to.eq(expiration1);
      expect(storage2.expirationBlock).to.eq(expiration2);
      expect(storage3.expirationBlock).to.eq(expiration3);

      expect(await p2pix.callStatic.getStr(target))
        .to.eq(storage1.pixTarget)
        .and.to.eq(storage2.pixTarget)
        .and.to.eq(storage3.pixTarget);

      expect(acc01.address)
        .to.eq(storage1.buyerAddress)
        .and.to.eq(storage2.buyerAddress);
      expect(storage3.buyerAddress).to.eq(acc03.address);

      expect(erc20.address)
        .to.eq(storage1.token)
        .and.to.eq(storage2.token)
        .and.to.eq(storage3.token);

      await expect(tx1)
        .to.emit(p2pix, "LockAdded")
        .withArgs(acc01.address, 1, owner.address, storage1.amount);
      await expect(tx2)
        .to.emit(p2pix, "LockAdded")
        .withArgs(acc01.address, 2, owner.address, storage2.amount);
      await expect(tx3)
        .to.emit(p2pix, "LockAdded")
        .withArgs(acc03.address, 3, owner.address, storage3.amount);
    });
  });
  describe("Set sellerBalance Valid State", async () => {
    it("should revert if sellerBalance hasn't been initialized", async () => {
      const fail = p2pix.setValidState(erc20.address, false);

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.NotInitialized,
      );
    });
    it("should setValidState, update storage and emit events", async () => {
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          ethers.BigNumber.from(10101).toString(),
          merkleRoot,
          erc20.address,
          price,
          true,
        ),
      );
      const state1 = await p2pix.callStatic.getValid(
        owner.address,
        erc20.address,
      );
      const tx = await p2pix.setValidState(
        erc20.address,
        false,
      );
      const state2 = await p2pix.callStatic.getValid(
        owner.address,
        erc20.address,
      );

      expect(tx).to.be.ok;
      await expect(tx)
        .to.emit(p2pix, "ValidSet")
        .withArgs(owner.address, erc20.address, false);
      expect(state1).to.be.true;
      expect(state2).to.be.false;
    });
    it("should cancel multiple balances", async () => {
      const hashZero = ethers.constants.HashZero;
      await erc20.mint([acc01.address, acc02.address], price);
      const target = ethers.BigNumber.from("1").toString();
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          target,
          hashZero,
          erc20.address,
          price,
          true,
        ),
      );
      await erc20
        .connect(acc01)
        .approve(p2pix.address, price);
      await p2pix
        .connect(acc01)
        .deposit(
          createDepositArgs(
          target,
          hashZero,
          erc20.address,
          price,
          false,
          ),
        );
      await erc20
        .connect(acc02)
        .approve(p2pix.address, price);
      await p2pix
        .connect(acc02)
        .deposit(
          createDepositArgs(
          target,
          hashZero,
          erc20.address,
          price,
          true,
          ),
        );
      const oldState1 = await p2pix.callStatic.getValid(
        owner.address,
        erc20.address,
      );
      const oldState2 = await p2pix.callStatic.getValid(
        acc01.address,
        erc20.address,
      );
      const oldState3 = await p2pix.callStatic.getValid(
        acc02.address,
        erc20.address,
      );
      const tx1 = await p2pix.setValidState(
        erc20.address,
        false,
      );
      const tx2 = await p2pix
        .connect(acc01)
        .setValidState(erc20.address, true);
      const tx3 = await p2pix
        .connect(acc02)
        .setValidState(erc20.address, true);
      const newState1 = await p2pix.callStatic.getValid(
        owner.address,
        erc20.address,
      );
      const newState2 = await p2pix.callStatic.getValid(
        acc01.address,
        erc20.address,
      );
      const newState3 = await p2pix.callStatic.getValid(
        acc02.address,
        erc20.address,
      );

      expect(tx1).to.be.ok;
      expect(tx2).to.be.ok;
      expect(tx3).to.be.ok;
      await expect(tx1)
        .to.emit(p2pix, "ValidSet")
        .withArgs(owner.address, erc20.address, false);
      await expect(tx2)
        .to.emit(p2pix, "ValidSet")
        .withArgs(acc01.address, erc20.address, true);
      await expect(tx3)
        .to.emit(p2pix, "ValidSet")
        .withArgs(acc02.address, erc20.address, true);
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
      const target = ethers.BigNumber.from(101).toString();
      const messageToSign = ethers.utils.solidityKeccak256(
        ["uint160", "uint80", "bytes32"],
        [target, 100, ethers.constants.HashZero],
      );
      const flatSig = await acc01.signMessage(
        ethers.utils.arrayify(messageToSign),
      );
      // const sig = ethers.utils.splitSignature(flatSig);
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          target,
          merkleRoot,
          erc20.address,
          price,
          true,
        ),
      );
      await p2pix
        .connect(acc03)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            ethers.BigNumber.from(100),
            [],
            [],
          ),
        );
      const lockID = ethers.constants.One;
      await mine(13);
      const fail = p2pix.release(
        createReleaseArgs(
          lockID,
          ethers.constants.HashZero,
          flatSig,
          ),
          );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.LockExpired,
      );
    });
    it("should revert if lock has already been released", async () => {
      const target = ethers.BigNumber.from("1").toString();
      const hashZero = ethers.constants.HashZero;
      const messageToSign = ethers.utils.solidityKeccak256(
        ["bytes32", "uint80", "bytes32"],
        [await p2pix.callStatic.getStr(target), 100, hashZero],
      );
      const flatSig = await acc01.signMessage(
        ethers.utils.arrayify(messageToSign),
      );
      // const sig = ethers.utils.splitSignature(flatSig);
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          target,
          merkleRoot,
          erc20.address,
          price,
          true,
        ),
      );
      await p2pix
        .connect(acc03)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            ethers.BigNumber.from(100),
            [],
            [],
          ),
        );
      const lockID = ethers.constants.One;
      await p2pix.release(
        createReleaseArgs(
          lockID,
          ethers.constants.HashZero,
          flatSig
        ),
        );
      const fail = p2pix.release(
        createReleaseArgs(
          lockID,
          ethers.constants.HashZero,
          flatSig,
        ),
      );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.AlreadyReleased,
      );
    });
    it("should revert if signed message has already been used", async () => {
      const target = ethers.BigNumber.from(101).toString();
      const messageToSign = ethers.utils.solidityKeccak256(
        ["bytes32", "uint80", "bytes32"],
        [await p2pix.callStatic.getStr(target), 100, ethers.constants.HashZero],
      );
      const flatSig = await owner.signMessage(
        ethers.utils.arrayify(messageToSign),
      );
      // const sig = ethers.utils.splitSignature(flatSig);
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          target,
          ethers.constants.HashZero,
          erc20.address,
          price,
          true,
        ),
      );
      await p2pix
        .connect(acc03)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            ethers.BigNumber.from(100),
            [],
            [],
          ),
        );

      await p2pix
        .connect(acc01)
        .release(
          createReleaseArgs(
            ethers.constants.One,
            ethers.constants.HashZero,
            flatSig,
            ),
          );
      await p2pix
        .connect(acc03)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            ethers.BigNumber.from(100),
            [],
            [],
          ),
        );
      const fail = p2pix
        .connect(acc01)
        .release(
          createReleaseArgs(
            ethers.constants.Two,
            ethers.constants.HashZero,
            flatSig,
          ),
        );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.TxAlreadyUsed,
      );
    });
    it("should revert if ecrecovered signer is invalid", async () => {
      const target = ethers.BigNumber.from(101).toString();
      const messageToSign = ethers.utils.solidityKeccak256(
        ["bytes32", "uint80", "bytes32"],
        [await p2pix.callStatic.getStr(target), 100, ethers.constants.HashZero],
      );
      const flatSig = await acc03.signMessage(
        ethers.utils.arrayify(messageToSign),
      );
      // const sig = ethers.utils.splitSignature(flatSig);

      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          target,
          ethers.constants.HashZero,
          erc20.address,
          price,
          true,
        ),
      );
      await p2pix
        .connect(acc03)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            ethers.BigNumber.from(100),
            [],
            [],
          ),
        );
      const fail = p2pix
        .connect(acc01)
        .release(
          createReleaseArgs(
            ethers.constants.One,
            ethers.constants.HashZero,
            flatSig,          
          ),
        );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.InvalidSigner,
      );
    });
    it("should release lock, update storage and emit events", async () => {
      const zero = ethers.constants.Zero;
      const endtoendID = ethers.constants.HashZero;
      const pixTarget = ethers.BigNumber.from(101).toString();
      const messageToSign = ethers.utils.solidityKeccak256(
        ["bytes32", "uint80", "bytes32"],
        [await p2pix.callStatic.getStr(pixTarget), 100, endtoendID],
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
      // const sig = ethers.utils.splitSignature(flatSig);
      const root = ethers.constants.HashZero;

      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          pixTarget,
          root,
          erc20.address,
          price,
          true,
        ),
      );
      await p2pix
        .connect(acc03)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            ethers.BigNumber.from(100),
            [],
            [],
          ),
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
      const storage1: Lock = await p2pix.callStatic.mapLocks(
        1,
      );
      const tx = await p2pix
        .connect(acc01)
        .release(
          createReleaseArgs(
            ethers.constants.One,
            endtoendID,
            flatSig,
          ),
          );

      const lockStatus1 =
        await p2pix.callStatic.getLocksStatus([1]);
      const ls1: [BigNumber[], number[]] = [
        [ethers.constants.One],
        [3],
      ];
      const funcSig = "0xd6e8b973";
      const args = ethers.utils.defaultAbiCoder.encode(
        ["address[]", "bool[]"],
        [[acc01.address], [false]],
      );
      const cd1 = funcSig + args.substring(2);
      const cd2: Call[] = getLockData(p2pix.address, [
        ls1[0],
      ]);
      const mtcCalls = [
        { target: p2pix.address, callData: cd1 },
      ];
      mtcCalls.push(cd2[0]);
      const mtc2 = await multicall.callStatic.mtc2(mtcCalls);
      const blockNumber: BigNumber = mtc2[0];
      const blockhash: BytesLike = mtc2[1];
      const result = mtc2.slice(2).flat(1) as Result[];
      const res1: BytesLike[] = [result[1].returnData];
      const decodedLockData = res1.map(r =>
        ethers.utils.defaultAbiCoder.decode(
          ["uint256[]", "uint8[]"],
          r,
        ),
      );

      const storage2: Lock = await p2pix.callStatic.mapLocks(
        1,
      );
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
        .withArgs(
          acc03.address,
          ethers.constants.One,
          storage1.amount,
        );
      expect(storage1.expirationBlock).to.eq(
        ethers.BigNumber.from(17),
      );
      expect(storage1.amount).to.eq(
        ethers.BigNumber.from(100),
      );
      expect(lockStatus1[0].toString()).to.equal(
        ls1[0].toString(),
      );
      expect(lockStatus1[1].toString()).to.equal(
        ls1[1].toString(),
      );
      expect(blockNumber).to.eq(8);
      expect(blockhash).to.deep.equal(
        ethers.constants.HashZero,
      );
      expect(result[0].success).to.eq(false);
      expect(result[1].success).to.eq(true);
      expect(decodedLockData.flat(1)).to.deep.eq(ls1);
      expect(storage2.expirationBlock).to.eq(zero);
      expect(storage2.amount).to.eq(zero);
      expect(used).to.eq(true);
      expect(userRecordA).to.eq(zero);
      expect(userRecord1).to.eq(zero);
      expect(userRecordB).to.eq(ethers.BigNumber.from(50));
      expect(userRecord2).to.eq(ethers.BigNumber.from(50));
      await expect(tx).to.changeTokenBalances(
        erc20,
        [acc03.address, acc01.address, acc02.address ],
        [100, 0, 0],
      );
    });
    // edge case test
    it("should release multiple locks", async () => {
      const endtoendID = ethers.constants.HashZero;
      const pixTarget = ethers.BigNumber.from(101).toString();
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
        ["bytes32", "uint80", "bytes32"],
        [await p2pix.callStatic.getStr(pixTarget), 100, endtoendID],
      );
      const flatSig1 = await owner.signMessage(
        ethers.utils.arrayify(messageToSign1),
      );
      // const sig1 = ethers.utils.splitSignature(flatSig1);
      const messageToSign2 = ethers.utils.solidityKeccak256(
        ["bytes32", "uint80", "bytes32"],
        [await p2pix.callStatic.getStr(pixTarget), 50, endtoendID],
      );
      const flatSig2 = await owner.signMessage(
        ethers.utils.arrayify(messageToSign2),
      );
      // const sig2 = ethers.utils.splitSignature(flatSig2);
      const messageToSign3 = ethers.utils.solidityKeccak256(
        ["bytes32", "uint80", "bytes32"],
        [await p2pix.callStatic.getStr(pixTarget), 25, endtoendID],
      );
      const flatSig3 = await owner.signMessage(
        ethers.utils.arrayify(messageToSign3),
      );
      // const sig3 = ethers.utils.splitSignature(flatSig3);
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          pixTarget,
          root,
          erc20.address,
          price,
          true,
        ),
      );
      await p2pix
        .connect(acc03)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            ethers.BigNumber.from(100),
            [],
            [],
          ),
        );
      await p2pix
        .connect(acc03)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            ethers.BigNumber.from(50),
            [],
            [],
          ),
        );
      await p2pix
        .connect(acc03)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            ethers.BigNumber.from(25),
            [],
            [],
          ),
        );

      const lockStatus1 =
        await p2pix.callStatic.getLocksStatus([1, 2, 3, 44]);
      const ls1: [BigNumber[], BigNumber[]] = [
        [
          ethers.constants.One,
          ethers.constants.Two,
          ethers.BigNumber.from(3),
          ethers.BigNumber.from(44),
        ],
        getBnFrom([1, 1, 1, 0]),
      ];

      const lockID = ethers.constants.One;
      const lockID2 = ethers.constants.Two;
      const lockID3 = ethers.BigNumber.from(3);
      const storage1: Lock = await p2pix.callStatic.mapLocks(
        lockID,
      );
      const storage2: Lock = await p2pix.callStatic.mapLocks(
        lockID2,
      );
      const storage3: Lock = await p2pix.callStatic.mapLocks(
        lockID3,
      );
      // relayerPremium == 0
      const tx = await p2pix
        .connect(acc01)
        .release(
          createReleaseArgs(
            lockID,
            endtoendID,
            flatSig1,
          ),
        );
      // relayerPremium != 0 &&
      // lock's msg.sender != release's msg.sender
      const tx1 = await p2pix
        .connect(acc01)
        .release(
          createReleaseArgs(
            lockID2,
            endtoendID,
            flatSig2,
          ),
        );
      // relayerPremium != 0 &&
      // lock's msg.sender == release's msg.sender
      const tx2 = await p2pix
        .connect(acc03)
        .release(
          createReleaseArgs(
          lockID3,
          endtoendID,
          flatSig3,
          ),
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

      const lockStatus2 =
        await p2pix.callStatic.getLocksStatus([1, 2, 3, 44]);
      const ls2: [BigNumber[], BigNumber[]] = [
        [
          ethers.constants.One,
          ethers.constants.Two,
          ethers.BigNumber.from(3),
          ethers.BigNumber.from(44),
        ],
        getBnFrom([3, 3, 3, 0]),
      ];

      const batchedLocks: Array<BigNumber[]> = [
        ls1.slice(0, 1)[0],
        ls2.slice(0, 1)[0],
      ];
      const cData: Call[] = getLockData(
        erc20.address,
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
        p2pix.address,
      ];

      const balances = [
        [0, 0, 100, "-100"],
        [0, 0, 50, "-50"],
        [0, 0, 25, "-25"],
      ];

      for (let i = 0; i < 3; i++) {
        const txs = [tx, tx1, tx2][i];
        await expect(txs).to.changeTokenBalances(
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
        multicall.callStatic.mtc1(cData),
      ).to.be.revertedWithCustomError(
        multicall,
        P2PixErrors.CallFailed,
      );
    });
  });
  describe("Unexpire Locks", async () => {
    it("should revert if lock isn't expired", async () => {
      const target = ethers.BigNumber.from(101).toString();
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          target,
          merkleRoot,
          erc20.address,
          price,
          true,
        ),
      );
      await p2pix
        .connect(acc02)
        .lock(
          createLockArgs(
          owner.address,
          erc20.address,
          ethers.constants.One,
          [],
          [],
          ),
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
      const pixTarget = ethers.BigNumber.from(101).toString();
      const messageToSign = ethers.utils.solidityKeccak256(
        ["bytes32", "uint80", "bytes32"],
        [await p2pix.callStatic.getStr(pixTarget), 1, endtoendID],
      );
      const messageHashBytes =
        ethers.utils.arrayify(messageToSign);
      const flatSig = await acc01.signMessage(
        messageHashBytes,
      );
      // const sig = ethers.utils.splitSignature(flatSig);
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          pixTarget,
          merkleRoot,
          erc20.address,
          price,
          true,
        ),
      );
      await p2pix
        .connect(acc02)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            ethers.constants.One,
            [],
            [],
          ),
        );
      const lockID = ethers.constants.One;
      // await mine(10);
      await p2pix.release(
        createReleaseArgs(
          lockID,
          endtoendID,
          flatSig,
        ),
        );
      const fail = p2pix.unlockExpired([lockID]);

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.AlreadyReleased,
      );
    });
    it("should unlock expired locks, update storage and emit events", async () => {
      const target = ethers.BigNumber.from(101).toString();
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          target,
          merkleRoot,
          erc20.address,
          price,
          true,
        ),
      );
      await p2pix
        .connect(acc02)
        .lock(
          createLockArgs(
            owner.address,
            erc20.address,
            ethers.constants.One,
            [],
            [],
          ),
        );
      const lockID = ethers.constants.One;
      await mine(11);

      const lockStatus1 =
        await p2pix.callStatic.getLocksStatus([11, 1, 777]);
      const ls1: [BigNumber[], BigNumber[]] = [
        [
          ethers.BigNumber.from(11),
          ethers.constants.One,
          ethers.BigNumber.from(777),
        ],
        getBnFrom([0, 2, 0]),
      ];

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
      expect(lockStatus1[0].toString()).to.equal(
        ls1[0].toString(),
      );
    });
    it("should unlock expired through lock function", async () => {
      const target = ethers.BigNumber.from(101).toString();
      // test method through lock fx
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          target,
          merkleRoot,
          erc20.address,
          price,
          true,
        ),
      );
      const lock1: ContractTransaction = await p2pix
        .connect(acc01)
        .lock(
            createLockArgs(
            owner.address,
            erc20.address,
            price,
            proof,
            [],
          ),
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
        createLockArgs(
          owner.address,
          erc20.address,
          ethers.BigNumber.from(100),
          [],
          [lockID],
        ),
      );
      const remaining = await p2pix.callStatic.getBalance(
        owner.address,
        erc20.address,
      );

      expect(tx1).to.be.ok;
      await expect(tx1)
        .to.emit(p2pix, "LockReturned")
        .withArgs(acc01.address, lockID);
      expect(remaining).to.eq(
        price.sub(ethers.BigNumber.from(100)),
      );
    });
    it("should unlock expired through withdraw function", async () => {
      const target = ethers.constants.One.toString();
      // test method through withdraw fx
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
        target,
        merkleRoot,
        erc20.address,
        price,
        true,
        ),
      );
      await p2pix
        .connect(acc01)
        .lock(
          createLockArgs(
          owner.address,
          erc20.address,
          price,
          proof,
          [],
          ),
        );
      const lockID = ethers.constants.One;
      // mine blocks to expire lock
      await mine(11);
      const tx = await p2pix.withdraw(erc20.address, price, [
        lockID,
      ]);
      const remaining = await p2pix.callStatic.getBalance(
        owner.address,
        erc20.address,
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
      const target = ethers.BigNumber.from(101).toString();
      await erc20.approve(p2pix.address, price);
      await p2pix.deposit(
        createDepositArgs(
          target,
          merkleRoot,
          erc20.address,
          price,
          true,
        ),
      );
      const fail = p2pix
        .connect(acc02)
        .withdraw(
          erc20.address,
          price.mul(ethers.constants.Two),
          [],
        );

      await expect(fail).to.be.revertedWithCustomError(
        p2pix,
        P2PixErrors.DecOverflow,
      );
    });
    it("should withdraw remaining funds from deposit, update storage and emit event", async () => {
      const newPrice = price.div(ethers.constants.Two);
      await erc20.approve(p2pix.address, price);
      const dep = await p2pix.deposit(
        createDepositArgs(
          ethers.BigNumber.from(101).toString(),
          merkleRoot,
          erc20.address,
          price,
          true,
        ),
      );
      const tx = await p2pix.withdraw(
        erc20.address,
        price.div(ethers.constants.Two),
        [],
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

      const oldState = await p2pix.callStatic.sellerAllowList(
        owner.address,
      );
      const tx = await p2pix
        .connect(owner)
        .setRoot(owner.address, merkleRoot);
      const newState = await p2pix.callStatic.sellerAllowList(
        owner.address,
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
