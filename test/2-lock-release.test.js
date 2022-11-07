const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("P2PIX lock/release test", function () {

    let owner, wallet2, wallet3, wallet4;
    let p2pix; // Contract instance
    let erc20; // Token instance
    let depositID;

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

        let transaction = await erc20.approve(p2pix.address,ethers.utils.parseEther('1000'));
        await expect(transaction).to.emit(erc20, 'Approval').withArgs(
            owner.address,
            p2pix.address,
            ethers.utils.parseEther('1000')
        )

        transaction = await p2pix.deposit(
            erc20.address,
            ethers.utils.parseEther('1000'),
            ethers.utils.parseEther('0.99'),
            'SELLER PIX KEY'
        );
        depositID = ethers.utils.solidityKeccak256(['string', 'uint256'], ['SELLER PIX KEY', ethers.utils.parseEther('1000')])
        await expect(transaction).to.emit(p2pix, 'DepositAdded').withArgs(
            owner.address,
            depositID,
            erc20.address,
            ethers.utils.parseEther('0.99'),
            ethers.utils.parseEther('1000')
        )
    })

    it("Should allow create a new lock", async function () {
        transaction = await p2pix.connect(wallet3).lock(
            depositID,
            wallet3.address,
            ethers.constants.AddressZero,
            '0',
            ethers.utils.parseEther('100'),
            []
        )
        const lockID = ethers.utils.solidityKeccak256(['bytes32', 'uint256', 'address'], [
            depositID,
            ethers.utils.parseEther('100'),
            wallet3.address
        ])
        await expect(transaction).to.emit(p2pix, 'LockAdded').withArgs(
            wallet3.address,
            lockID,
            depositID,
            ethers.utils.parseEther('100')
        )
    })

})