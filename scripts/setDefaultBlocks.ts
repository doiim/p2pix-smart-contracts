import * as fs from "fs";
import { Interface } from "ethers";
import hre from "hardhat";

import { P2PIX__factory } from "../src/types/index.ts";
import type { Deploys } from "../test/utils/interfaces.ts";

let deploysJson: Deploys;

const main = async () => {
  const { ethers, networkName } = await hre.network.getOrCreate();

  try {
    const data = fs.readFileSync(
      `./deploys/${networkName}.json`,
      { encoding: "utf-8" },
    );
    deploysJson = JSON.parse(data);
  } catch (err) {
    console.log("Error loading Master address: ", err);
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log(
    `Signing transactions with ${deployer.address}`,
  );

  const iface = new Interface(P2PIX__factory.abi);
  const calldata = iface.encodeFunctionData(
    "setDefaultLockBlocks",
    ["10000"],
  );

  const tx = await deployer.sendTransaction({
    to: deploysJson.p2pix,
    data: calldata,
  });
  const done = await tx.wait();
  console.log(done!.hash);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.log(error);
    process.exit(1);
  });
