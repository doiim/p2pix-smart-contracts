import "@nomicfoundation/hardhat-ethers";
import * as fs from "fs";
import { ethers, network } from "hardhat";

import { Deploys } from "../test/utils/interfaces";

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

  let reputation = await ethers.deployContract("Reputation");
  let multicall = await ethers.deployContract("Multicall");
  let p2pix = await ethers.deployContract("P2PIX", [
    10,
    deploysJson.signers,
    reputation.target,
    [deploysJson.token],
    [true],
  ]);

  reputation = await reputation.waitForDeployment();
  multicall = await multicall.waitForDeployment();
  p2pix = await p2pix.waitForDeployment();

  deploysJson.p2pix = await p2pix.getAddress();
  console.log("🚀 P2PIX Deployed:", await p2pix.getAddress());
  console.log("🌠 Reputation Deployed:", await reputation.getAddress());
  console.log("🛰 Multicall Deployed:", await multicall.getAddress());

  fs.writeFileSync(
    `./deploys/${network.name}.json`,
    JSON.stringify(deploysJson, undefined, 2),
  );

  /* UNCOMMENT WHEN DEPLOYING TO MAINNET/PUBLIC TESTNETS */
  //verify
  // await hre.run("verify:verify", {
  //   address: p2pix.address,
  //   constructorArguments: [
  //     10,
  //     deploysJson.signers,
  //     reputation.address,
  //     [deploysJson.token],
  //     [true],
  //   ],
  // });
  // await hre.run("verify:verify", {
  //   address: reputation.address,
  //   constructorArguments: [],
  // });
  // await hre.run("verify:verify", {
  //   address: mutlicall.address,
  //   constructorArguments: [],
  // });
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.log(error);
    process.exit(1);
  });
