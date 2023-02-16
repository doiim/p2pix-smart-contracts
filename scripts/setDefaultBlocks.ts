import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import * as fs from "fs";
import { ethers, network } from "hardhat";
import { Deploys } from "../test/utils/fixtures";
import { P2PIX__factory } from "../src/types";

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
  console.log(`Signing transactions with ${deployer.address}`);

  const iface = new ethers.utils.Interface(P2PIX__factory.abi);
  const calldata = iface.encodeFunctionData("setDefaultLockBlocks", ["10000"]);
  
  const tx = await deployer.sendTransaction({to:deploysJson.p2pix, data: calldata});
  const done = await tx.wait();
  console.log(done.transactionHash);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.log(error);
    process.exit(1);
  });
