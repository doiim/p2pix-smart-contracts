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

    const ERC20Factory = await ethers.getContractFactory("MockToken");
    const erc20 = await ERC20Factory.deploy(ethers.utils.parseEther('20000000', 'wei')); 
    await erc20.deployed();

    deploysJson.token = erc20.address
    console.log("🚀 Mock Token Deployed:", erc20.address);

    fs.writeFileSync(`./deploys/${network.name}.json`, JSON.stringify(deploysJson, undefined, 2));
}
  
main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});