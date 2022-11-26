import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { MockToken, P2PIX } from "../src/types";

describe("P2PIX deposit test", () => {
  let owner: SignerWithAddress;
  let wallet2: SignerWithAddress;
  // let wallet3: SignerWithAddress;
  // let wallet4: SignerWithAddress;
  let p2pix: P2PIX; // Contract instance
  let erc20: MockToken; // Token instance

  it("Will deploy contracts", async () => {
    [owner, wallet2 /* wallet3, wallet4 */] =
      await ethers.getSigners();

    const ERC20Factory = await ethers.getContractFactory(
      "MockToken",
    );
    erc20 = await ERC20Factory.deploy(
      ethers.utils.parseEther("20000000"),
    );
    await erc20.deployed();

    // Check initial balance
    expect(await erc20.balanceOf(owner.address)).to.equal(
      ethers.utils.parseEther("20000000"),
    );

    const P2PIX = await ethers.getContractFactory("P2PIX");
    p2pix = await P2PIX.deploy(2, [
      owner.address,
      wallet2.address,
    ]);
    await p2pix.deployed();

    const ownerKey = await p2pix._castAddrToKey(owner.address);
    const wallet2Key = await p2pix._castAddrToKey(wallet2.address);
    
    // Verify values at deployment
    expect(
      await p2pix.callStatic.validBacenSigners(ownerKey),
    ).to.equal(true);
    expect(
      await p2pix.validBacenSigners(wallet2Key),
    ).to.equal(true);
  });

  it("Should allow create a deposit", async () => {
    let transaction = await erc20.approve(
      p2pix.address,
      ethers.utils.parseEther("2000"),
    );
    await expect(transaction)
      .to.emit(erc20, "Approval")
      .withArgs(
        owner.address,
        p2pix.address,
        ethers.utils.parseEther("2000"),
      );

    transaction = await p2pix.deposit(
      erc20.address,
      ethers.utils.parseEther("1000"),
      "SELLER PIX KEY",
      // { value: ethers.utils.parseEther("0.1") },
    );
    await expect(transaction)
      .to.emit(p2pix, "DepositAdded")
      .withArgs(
        owner.address,
        0,
        erc20.address,
        // ethers.utils.parseEther("0.1"),
        ethers.utils.parseEther("1000"),
      );
  });

  it("Should allow create second deposit", async () => {
    const transaction = await p2pix.deposit(
      erc20.address,
      ethers.utils.parseEther("1000"),
      "SELLER PIX KEY",
      // { value: ethers.utils.parseEther("0.1") },
    );
    await expect(transaction)
      .to.emit(p2pix, "DepositAdded")
      .withArgs(
        owner.address,
        1,
        erc20.address,
        // ethers.utils.parseEther("0.1"),
        ethers.utils.parseEther("1000"),
      );
  });

  it("Should allow cancel first deposit", async () => {
    const transaction = await p2pix.cancelDeposit(0);
    await expect(transaction)
      .to.emit(p2pix, "DepositClosed")
      .withArgs(owner.address, 0);
  });

  it("Should allow withdraw the deposit", async () => {
    const transaction = await p2pix.withdraw(0, []);
    await expect(transaction)
      .to.emit(p2pix, "DepositWithdrawn")
      .withArgs(
        owner.address,
        0,
        ethers.utils.parseEther("1000"),
      );
  });
});
