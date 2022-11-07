const fs = require('fs');
const { network } = require("hardhat");

async function main() {

    let deploysJson = {}

    try {
        const data = fs.readFileSync(`./deploys/${network.name}.json`, {encoding:"utf-8"});
        deploysJson = JSON.parse(data);
    } catch (err) {
        console.log('Error loading Master address: ', err);
        process.exit(1);
    }

    const P2PIX = await ethers.getContractFactory("P2PIX");
    const p2pix = await P2PIX.deploy(2, deploysJson.signers);
    await p2pix.deployed();

    deploysJson.p2pix = p2pix.address
    console.log("🚀 P2PIX Deployed:", p2pix.address);

    fs.writeFileSync(`./deploys/${network.name}.json`, JSON.stringify(deploysJson, undefined, 2));
}
  
main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});