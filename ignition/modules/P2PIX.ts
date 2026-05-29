import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

import ReputationModule from "./Reputation";

export default buildModule("P2PIX", m => {
  const { reputation, multicall } = m.useModule(
    ReputationModule,
  );

  const defaultBlocks = m.getParameter("defaultBlocks", 10);
  const validSigners = m.getParameter<string[]>(
    "validSigners",
    [],
  );
  const tokens = m.getParameter<string[]>("tokens");
  const allowed = m.getParameter<boolean[]>("allowed");

  const p2pix = m.contract("P2PIX", [
    defaultBlocks,
    validSigners,
    reputation,
    tokens,
    allowed,
  ]);

  return {
    p2pix,
    reputation,
    multicall,
  };
});
