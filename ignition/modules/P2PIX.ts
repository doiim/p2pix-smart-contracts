import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

import ReputationModule from "./Reputation.ts";

/** One hour: the oldest attestation `release` accepts, in milliseconds. */
const DEFAULT_PROOF_MAX_AGE_MS = 3_600_000;

export default buildModule("P2PIX", m => {
  const { reputation, multicall } = m.useModule(
    ReputationModule,
  );

  const defaultBlocks = m.getParameter("defaultBlocks", 10);
  // Primus attestors allowed to sign proofs of Pix payment; a fixed
  // list per network in ignition/parameters, extended later by the
  // owner with setValidAttestors.
  const validAttestors = m.getParameter<string[]>(
    "validAttestors",
  );
  // The bank request a proof must have attested; see DataTypes.BankConfig.
  const bank = m.getParameter<{
    solicitationUrlPrefix: string;
    solicitationUrlSuffix: string;
  }>("bank");
  // The prover's Primus task wallet: the only accepted proof recipient.
  const prover = m.getParameter<string>("prover");
  const proofMaxAgeMs = m.getParameter(
    "proofMaxAgeMs",
    DEFAULT_PROOF_MAX_AGE_MS,
  );
  const tokens = m.getParameter<string[]>("tokens");
  const allowed = m.getParameter<boolean[]>("allowed");

  const p2pix = m.contract("P2PIX", [
    defaultBlocks,
    validAttestors,
    reputation,
    tokens,
    allowed,
    bank,
    prover,
    proofMaxAgeMs,
  ]);

  return {
    p2pix,
    reputation,
    multicall,
  };
});
