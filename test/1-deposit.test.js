const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("P2PIX deposit test", function () {

    let owner, wallet2, wallet3, wallet4;
    let p2pix; // Contract instance
    let erc20; // Token instance

    it("Will deploy contracts", async function () {

        [owner, wallet2, wallet3, wallet4] = await ethers.getSigners();

       const ERC20Factory = await ethers.getContractFactory("MockToken");
        erc20 = await ERC20Factory.deploy(ethers.utils.parseEther('20000000', 'wei')); 
        await erc20.deployed();

        // Check initial balance
        expect(await erc20.balanceOf(owner.address)).to.equal(ethers.utils.parseEther('20000000', 'wei'));

        const P2PIX = await ethers.getContractFactory("P2PIX");
        p2pix = await P2PIX.deploy(2, [owner.address, wallet2.address]);
        await p2pix.deployed();

        // Verify values at deployment
        expect(await p2pix.validBacenSigners(owner.address)).to.equal(true);
        expect(await p2pix.validBacenSigners(wallet2.address)).to.equal(true);
    });

    it("Should allow create a deposit", async function () {

        let transaction = await erc20.approve(p2pix.address,ethers.utils.parseEther('2000'));
        await expect(transaction).to.emit(erc20, 'Approval').withArgs(
            owner.address,
            p2pix.address,
            ethers.utils.parseEther('2000')
        )

        transaction = await p2pix.deposit(
            erc20.address,
            ethers.utils.parseEther('1000'),
            'SELLER PIX KEY',
            {value:ethers.utils.parseEther('0.1')}
        );
        await expect(transaction).to.emit(p2pix, 'DepositAdded').withArgs(
            owner.address,
            0,
            erc20.address,
            ethers.utils.parseEther('0.1'),
            ethers.utils.parseEther('1000')
        )
    })

    it("Should allow create second deposit", async function () {
        transaction = await p2pix.deposit(
            erc20.address,
            ethers.utils.parseEther('1000'),
            'SELLER PIX KEY',
            {value:ethers.utils.parseEther('0.1')}
        )
        await expect(transaction).to.emit(p2pix, 'DepositAdded').withArgs(
            owner.address,
            1,
            erc20.address,
            ethers.utils.parseEther('0.1'),
            ethers.utils.parseEther('1000')
        )
    })

    it("Should allow cancel first deposit", async function () {
        const transaction = await p2pix.cancelDeposit(0);
        await expect(transaction).to.emit(p2pix, 'DepositClosed').withArgs(
            owner.address,
            0
        )
    })

    it("Should allow withdraw the deposit", async function () {
        const transaction = await p2pix.withdraw(0, []);
        await expect(transaction).to.emit(p2pix, 'DepositWithdrawn').withArgs(
            owner.address,
            0,
            ethers.utils.parseEther('1000')
        )
    })
})