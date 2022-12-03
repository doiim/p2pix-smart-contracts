import "@nomicfoundation/hardhat-chai-matchers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Wallet } from "ethers";
import { ethers, network } from "hardhat";

import { MockToken, P2PIX, Reputation } from "../src/types";
import { P2PixErrors } from "./utils/errors";
import { p2pixFixture } from "./utils/fixtures";

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
    it("should allow contract's balance withdraw", async () => {
      const oldBal = await p2pix.provider.getBalance(
        p2pix.address,
      );
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

      await expect(
        p2pix.withdrawBalance(),
      ).to.changeEtherBalances(
        [owner.address, p2pix.address],
        [price, "-100000000000000000000"],
      );

      await expect(
        p2pix.connect(acc01).withdrawBalance(),
      ).to.be.revertedWith(
        P2PixErrors.UNAUTHORIZED,
      );
    });
  });
});
