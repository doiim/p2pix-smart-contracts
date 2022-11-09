const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("P2PIX lock/release test", function () {

    let owner, wallet2, wallet3, wallet4;
    let p2pix; // Contract instance
    let erc20; // Token instance
    let depositID, lockID;

    it("Will deploy contracts", async function () {

        [owner, wallet2, wallet3, wallet4] = await ethers.getSigners();

       const ERC20Factory = await ethers.getContractFactory("MockToken");
        erc20 = await ERC20Factory.deploy(ethers.utils.parseEther('20000000', 'wei')); 
        await erc20.deployed();

        // Check initial balance
        expect(await erc20.balanceOf(owner.address)).to.equal(ethers.utils.parseEther('20000000', 'wei'));

        const P2PIX = await ethers.getContractFactory("P2PIX");
        p2pix = await P2PIX.deploy(3, [owner.address, wallet2.address]);
        await p2pix.deployed();

        // Verify values at deployment
        expect(await p2pix.validBacenSigners(owner.address)).to.equal(true);
        expect(await p2pix.validBacenSigners(wallet2.address)).to.equal(true);
        expect(await p2pix.validBacenSigners(wallet3.address)).to.equal(false);
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
            'SELLER PIX KEY',
            {value:ethers.utils.parseEther('0.1')}
        );
        depositID = ethers.utils.solidityKeccak256(['string', 'uint256'], ['SELLER PIX KEY', ethers.utils.parseEther('1000')])
        await expect(transaction).to.emit(p2pix, 'DepositAdded').withArgs(
            owner.address,
            depositID,
            erc20.address,
            ethers.utils.parseEther('0.1'),
            ethers.utils.parseEther('1000')
        )
        console.log('GAS USED:', (await transaction.wait()).cumulativeGasUsed.toString())
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
        lockID = ethers.utils.solidityKeccak256(['bytes32', 'uint256', 'address'], [
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
        console.log('GAS USED:', (await transaction.wait()).cumulativeGasUsed.toString())
    })

    it("Should release the locked amount to the buyer", async function () {
        const endtoendID = '123'; 
        const messageToSign = ethers.utils.solidityKeccak256(['string', 'uint256', 'uint256'], [
            'SELLER PIX KEY',
            ethers.utils.parseEther('100'),
            endtoendID
        ])
        // Note: messageToSign is a string, that is 66-bytes long, to sign the
        //       binary value, we must convert it to the 32 byte Array that
        //       the string represents
        //
        // i.e.
        //   // 66-byte string
        //   "0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba"
        //   ... vs ...
        //  // 32 entry Uint8Array
        //  [ 89, 47, 167, 67, 136, 159, ... 103, 7, 186]
        const messageHashBytes = ethers.utils.arrayify(messageToSign)
        // Sign the string message
        const flatSig = await owner.signMessage(messageHashBytes);
        // For Solidity, we need the expanded-format of a signature
        const sig = ethers.utils.splitSignature(flatSig);
        transaction = await p2pix.connect(wallet3).release(
            lockID,
            endtoendID,
            sig.r,
            sig.s,
            sig.v
        )
        await expect(transaction).to.emit(p2pix, 'LockReleased').withArgs(
            wallet3.address,
            lockID
        )
        console.log('GAS USED:', (await transaction.wait()).cumulativeGasUsed.toString())
        expect(await erc20.balanceOf(wallet3.address)).to.equal(ethers.utils.parseEther('100'));
    })

    it("Should allow recreate same lock", async function () {
        transaction = await p2pix.connect(wallet3).lock(
            depositID,
            wallet3.address,
            ethers.constants.AddressZero,
            '0',
            ethers.utils.parseEther('100'),
            []
        )
        lockID = ethers.utils.solidityKeccak256(['bytes32', 'uint256', 'address'], [
            depositID,
            ethers.utils.parseEther('100'),
            wallet3.address
        ])
        await expect(transaction).to.emit(p2pix, 'LockAdded').withArgs(
            wallet3.address,
            lockID,
            depositID,
            ethers.utils.parseEther('100'),
        )
    })

    it("Should prevent create again same lock", async function () {
        await expect(p2pix.connect(wallet3).lock(
            depositID,
            wallet3.address,
            ethers.constants.AddressZero,
            '0',
            ethers.utils.parseEther('100'),
            []
        )).to.be.revertedWith('P2PIX: Another lock with same ID is not expired yet');
    })

    it("Should release the locked amount to the buyer", async function () {
        const endtoendID = '124'; 
        const messageToSign = ethers.utils.solidityKeccak256(['string', 'uint256', 'uint256'], [
            'SELLER PIX KEY',
            ethers.utils.parseEther('100'),
            endtoendID
        ])
        const messageHashBytes = ethers.utils.arrayify(messageToSign)
        const flatSig = await owner.signMessage(messageHashBytes);
        const sig = ethers.utils.splitSignature(flatSig);
        transaction = await p2pix.connect(wallet3).release(
            lockID,
            endtoendID,
            sig.r,
            sig.s,
            sig.v
        )
        expect(await erc20.balanceOf(wallet3.address)).to.equal(ethers.utils.parseEther('200'));
    })
    
    it("Should prevent release again the lock", async function () {
        const endtoendID = '125'; 
        const messageToSign = ethers.utils.solidityKeccak256(['string', 'uint256', 'uint256'], [
            'SELLER PIX KEY',
            ethers.utils.parseEther('100'),
            endtoendID
        ])
        const messageHashBytes = ethers.utils.arrayify(messageToSign)
        const flatSig = await owner.signMessage(messageHashBytes);
        const sig = ethers.utils.splitSignature(flatSig);
        await expect(p2pix.connect(wallet3).release(
            lockID,
            endtoendID,
            sig.r,
            sig.s,
            sig.v
        )).to.be.revertedWith('P2PIX: Lock already released or returned');
    })

    it("Should prevent create a 800 lock", async function () {
        await expect(p2pix.connect(wallet3).lock(
            depositID,
            wallet3.address,
            ethers.constants.AddressZero,
            '0',
            ethers.utils.parseEther('900'),
            []
        )).to.be.revertedWith('P2PIX: Not enough token remaining on deposit');
    })

    it("Should allow recreate same lock again", async function () {
        transaction = await p2pix.connect(wallet3).lock(
            depositID,
            wallet3.address,
            ethers.constants.AddressZero,
            '0',
            ethers.utils.parseEther('100'),
            []
        )
        lockID = ethers.utils.solidityKeccak256(['bytes32', 'uint256', 'address'], [
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

    it("Should allow unlock expired lock", async function () {
        await expect(p2pix.unlockExpired([lockID]))
            .to.be.revertedWith('P2PIX: Lock not expired or already released');
        await network.provider.send("evm_mine");
        await network.provider.send("evm_mine");
        await network.provider.send("evm_mine");
        transaction = await p2pix.unlockExpired([lockID])
        await expect(transaction).to.emit(p2pix, 'LockReturned').withArgs(
            wallet3.address,
            lockID
        )
    })

    it("Should prevent unlock again", async function () {
        await expect(p2pix.unlockExpired([lockID]))
            .to.be.revertedWith('P2PIX: Lock not expired or already released');
    })

})