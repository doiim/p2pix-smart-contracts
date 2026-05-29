import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

import MockTokenModule from "./MockToken";
import ReputationModule from "./Reputation";

export default buildModule("P2PIXWithMock", m => {
  const { token } = m.useModule(MockTokenModule);
  const { reputation, multicall } = m.useModule(
    ReputationModule,
  );

  const defaultBlocks = m.getParameter("defaultBlocks", 10);
  const validSigners = m.getParameter<string[]>(
    "validSigners",
    [],
  );

  const p2pix = m.contract("P2PIX", [
    defaultBlocks,
    validSigners,
    reputation,
    [token],
    [true],
  ]);

  return {
    p2pix,
    reputation,
    multicall,
    token,
  };
});
