import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import * as fs from "fs";
import { ethers, network } from "hardhat";

// import hre from "hardhat";

interface Deploys {
  signers: string[];
  p2pix: string;
  token: string;
}

let deploysJson: Deploys;

const main = async () => {
  try {
    const data = fs.readFileSync(
      `./deploys/${network.name}.json`,
      { encoding: "utf-8" },
    );
    deploysJson = JSON.parse(data);
  } catch (err) {
    console.log("Error loading Master address: ", err);
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with ${deployer.address}`);

  const P2PIX = await ethers.getContractFactory("P2PIX");
  const p2pix = await P2PIX.deploy(2, deploysJson.signers);
  await p2pix.deployed();

  deploysJson.p2pix = p2pix.address;
  console.log("🚀 P2PIX Deployed:", p2pix.address);

  fs.writeFileSync(
    `./deploys/${network.name}.json`,
    JSON.stringify(deploysJson, undefined, 2),
  );

  /* UNCOMMENT WHEN DEPLOYING TO MAINNET */
  //verify
  // await hre.run("verify:verify", {
  //   address: p2pix.address,
  //   constructorArguments: [2, deploysJson.signers],
  // });
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.log(error);
    process.exit(1);
  });
