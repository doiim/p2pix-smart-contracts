import * as fs from "fs";
import { Interface } from "ethers";
import hre from "hardhat";

import { P2PIX__factory } from "../src/types/index.ts";

let p2pixAddress: string;

const main = async () => {
  const { ethers } = await hre.network.getOrCreate();
  const { chainId } = await ethers.provider.getNetwork();

  // Ignition writes deployment state to chain-<id>/deployed_addresses.json.
  try {
    const data = fs.readFileSync(
      `./ignition/deployments/chain-${chainId}/deployed_addresses.json`,
      { encoding: "utf-8" },
    );
    p2pixAddress = JSON.parse(data)["P2PIX#P2PIX"];
  } catch (err) {
    console.log("Error loading P2PIX address: ", err);
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
    to: p2pixAddress,
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
