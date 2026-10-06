import "@nomicfoundation/hardhat-ethers";
import * as fs from "fs";
import { ethers, network } from "hardhat";

import { Deploys } from "../test/utils/interfaces";

let deploysJson: Deploys;
const supply: BigInt = ethers.parseEther("20000000");

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

  let erc20 = await ethers.deployContract("MockToken", [supply]);
  erc20 = await erc20.waitForDeployment();

  deploysJson.token = await erc20.getAddress();
  console.log("🚀 Mock Token Deployed:", await erc20.getAddress());

  fs.writeFileSync(
    `./deploys/${network.name}.json`,
    JSON.stringify(deploysJson, undefined, 2),
  );

  /* UNCOMMENT WHEN DEPLOYING TO MAINNET/PUBLIC TESTNETS */
  // verify
  // await hre.run("verify:verify", {
  //   address: erc20.address,
  //   constructorArguments: [supply],
  // });
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.log(error);
    process.exit(1);
  });
