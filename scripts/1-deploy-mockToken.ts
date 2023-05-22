import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import { BigNumber } from "ethers";
import * as fs from "fs";
import { ethers, network } from "hardhat";
import hre from "hardhat";

import { Deploys } from "../test/utils/interfaces";

let deploysJson: Deploys;
const supply: BigNumber = ethers.utils.parseEther("20000000");

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

  const ERC20Factory = await ethers.getContractFactory(
    "MockToken",
  );
  const erc20 = await ERC20Factory.deploy(supply);
  await erc20.deployed();

  deploysJson.token = erc20.address;
  console.log("🚀 Mock Token Deployed:", erc20.address);
  await erc20.deployTransaction.wait(6);

  fs.writeFileSync(
    `./deploys/${network.name}.json`,
    JSON.stringify(deploysJson, undefined, 2),
  );

  /* UNCOMMENT WHEN DEPLOYING TO MAINNET/PUBLIC TESTNETS */
  // verify
  await hre.run("verify:verify", {
    address: erc20.address,
    constructorArguments: [supply],
  });
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.log(error);
    process.exit(1);
  });
