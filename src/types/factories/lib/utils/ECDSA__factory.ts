/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type { ECDSA, ECDSAInterface } from "../../../lib/utils/ECDSA";

const _abi = [
  {
    inputs: [],
    name: "InvalidSignature",
    type: "error",
  },
];

const _bytecode =
  "0x60808060405234601757603a9081601d823930815050f35b600080fdfe600080fdfea26469706673582212201f6fe8a460e1235bb7e19365d8e3cc56b718d44f5db82f5fa3c90d3c7da59ebf64736f6c63430008130033";

type ECDSAConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ECDSAConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ECDSA__factory extends ContractFactory {
  constructor(...args: ECDSAConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ECDSA> {
    return super.deploy(overrides || {}) as Promise<ECDSA>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): ECDSA {
    return super.attach(address) as ECDSA;
  }
  override connect(signer: Signer): ECDSA__factory {
    return super.connect(signer) as ECDSA__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ECDSAInterface {
    return new utils.Interface(_abi) as ECDSAInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): ECDSA {
    return new Contract(address, _abi, signerOrProvider) as ECDSA;
  }
}
