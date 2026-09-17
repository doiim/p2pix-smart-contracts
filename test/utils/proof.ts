import { ethers } from "ethers";
import hre from "hardhat";

import type { DataTypes } from "../../src/types/p2pix.sol/P2PIX.ts";

/** Mirrors `Constants.sol`: the bank settings the fixture deploys with. */
export const BANK = {
  solicitationUrlPrefix:
    "https://api-bbpay.hm.bb.com.br/checkout/v2/solicitacoes/",
  solicitationUrlSuffix:
    "?numeroConvenio=701&gw-dev-app-key=test",
};
export const PROOF_MAX_AGE_MS = 3_600_000n;
export const PARSE_TYPE = "";
export const REQUEST = {
  header: "",
  method: "GET",
  body: "",
};

/** `responseResolves` exactly as the prover sends them. */
export const RESOLVES = [
  [
    ["amount", "$.valorSolicitacao"],
    ["settled", "$.valorSomatorioPagamentosEfetivados"],
    [
      "payee",
      "$.repasse.recebedores[0].identificadorRecebedor",
    ],
    ["txId", "$.informacoesPix.txId"],
    ["lock", "$.codigoConciliacaoSolicitacao"],
  ],
];

export type PixProofStruct = DataTypes.PixProofStruct;

/** `PrimusZKTLS.encodeResponse` over the request's resolves. */
export const resolvesHash = (): string => {
  const parts = RESOLVES.flat().flatMap(([key, path]) => [
    key,
    PARSE_TYPE,
    path,
  ]);
  return ethers.solidityPackedKeccak256(
    parts.map(() => "string"),
    parts,
  );
};

/** `PrimusZKTLS.encodeRequest` over the attested requests. */
export const requestHash = (urls: string[]): string => {
  const parts = urls.flatMap(url => [
    url,
    REQUEST.header,
    REQUEST.method,
    REQUEST.body,
  ]);
  return ethers.solidityPackedKeccak256(
    parts.map(() => "string"),
    parts,
  );
};

export interface BankFields {
  amount: string;
  settled?: string;
  payee: string;
  txId: string;
  lock: string;
}

/**
 * `attestation.data` as the attestor renders it (homologação capture): one
 * flat object, keys sorted, every value a string, no `.count` entries.
 */
export const buildData = (f: BankFields): string =>
  JSON.stringify({
    amount: f.amount,
    lock: f.lock,
    payee: f.payee,
    settled: f.settled ?? f.amount,
    txId: f.txId,
  });

export interface ProofInput {
  numeroSolicitacao: bigint;
  recipient: string;
  data: string;
  timestamp: bigint;
  additionParams?: string;
  attConditions?: string;
  bank?: typeof BANK;
}

/** `PrimusZKTLS.encodeAttestation`: the raw digest the attestor signs. */
export const proofDigest = (input: ProofInput): string => {
  const bank = input.bank ?? BANK;
  const urls = [
    `${bank.solicitationUrlPrefix}${input.numeroSolicitacao}${bank.solicitationUrlSuffix}`,
  ];
  return ethers.solidityPackedKeccak256(
    [
      "address",
      "bytes32",
      "bytes32",
      "string",
      "string",
      "uint64",
      "string",
    ],
    [
      input.recipient,
      requestHash(urls),
      resolvesHash(),
      input.data,
      input.attConditions ?? "",
      input.timestamp,
      input.additionParams ?? '{"algorithmType":"proxytls"}',
    ],
  );
};

/**
 * Signs the raw digest with the attestor's key: no EIP-191 prefix, 65-byte
 * `r‖s‖v` with `v` 27/28, as a Primus attestor does.
 */
export const signProof = (
  input: ProofInput,
  attestor: { privateKey: string; address: string },
): PixProofStruct => {
  const signature = new ethers.SigningKey(
    attestor.privateKey,
  ).sign(proofDigest(input)).serialized;
  return {
    numeroSolicitacao: input.numeroSolicitacao,
    recipient: input.recipient,
    data: input.data,
    timestamp: input.timestamp,
    additionParams:
      input.additionParams ?? '{"algorithmType":"proxytls"}',
    attConditions: input.attConditions ?? "",
    attestor: attestor.address,
    signature,
  };
};

/** Milliseconds of the latest block, the attestor's clock in tests. */
export const nowMs = async (): Promise<bigint> => {
  const { ethers } = await hre.network.getOrCreate();
  const block = await ethers.provider.getBlock("latest");
  return BigInt(block!.timestamp) * 1000n;
};
