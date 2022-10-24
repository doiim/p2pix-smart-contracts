const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("P2PIX deposit test", function () {

    let owner, wallet2, wallet3, wallet4;

    it("Deploy contracts", async function () {

        [owner, wallet2, wallet3, wallet4] = await ethers.getSigners();

        const P2PIX = await ethers.getContractFactory("P2PIX");
        const p2pix = await P2PIX.deploy(2, [owner.address, wallet2.address]);
        await p2pix.deployed();

        // Verify values at deployment
        expect(await p2pix.validBacenSigners(owner.address)).to.equal(true);
        expect(await p2pix.validBacenSigners(wallet2.address)).to.equal(true);

    })
})