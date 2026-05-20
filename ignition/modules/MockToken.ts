import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "ethers";

const DEFAULT_SUPPLY = ethers.utils
  .parseEther("20000000")
  .toString();

export default buildModule("MockToken", m => {
  const supply = m.getParameter("supply", DEFAULT_SUPPLY);

  const token = m.contract("MockToken", [supply]);

  return { token };
});
