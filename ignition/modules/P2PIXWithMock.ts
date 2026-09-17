import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

import MockTokenModule from "./MockToken.ts";
import ReputationModule from "./Reputation.ts";

/** One hour: the oldest attestation `release` accepts, in milliseconds. */
const DEFAULT_PROOF_MAX_AGE_MS = 3_600_000;

export default buildModule("P2PIXWithMock", m => {
  const { token } = m.useModule(MockTokenModule);
  const { reputation, multicall } = m.useModule(
    ReputationModule,
  );

  const defaultBlocks = m.getParameter("defaultBlocks", 10);
  const validAttestors = m.getParameter<string[]>(
    "validAttestors",
  );
  const bank = m.getParameter<{
    solicitationUrlPrefix: string;
    solicitationUrlSuffix: string;
  }>("bank");
  const prover = m.getParameter<string>("prover");
  const proofMaxAgeMs = m.getParameter(
    "proofMaxAgeMs",
    DEFAULT_PROOF_MAX_AGE_MS,
  );

  const p2pix = m.contract("P2PIX", [
    defaultBlocks,
    validAttestors,
    reputation,
    [token],
    [true],
    bank,
    prover,
    proofMaxAgeMs,
  ]);

  return {
    p2pix,
    reputation,
    multicall,
    token,
  };
});
