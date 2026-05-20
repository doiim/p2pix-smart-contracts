import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Reputation", m => {
  const reputation = m.contract("Reputation", []);
  const multicall = m.contract("Multicall", []);

  return { reputation, multicall };
});
