/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Signer,
  utils,
  Contract,
  ContractFactory,
  PayableOverrides,
} from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type { Reputation, ReputationInterface } from "../Reputation";

const _abi = [
  {
    inputs: [],
    stateMutability: "payable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_userCredit",
        type: "uint256",
      },
    ],
    name: "limiter",
    outputs: [
      {
        internalType: "uint256",
        name: "_spendLimit",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "magicValue",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxLimit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x6080806040526102c990816100128239f3fe6080806040526004908136101561001557600080fd5b600091823560e01c9182631a861d2614610254575081634d2b179114610085575063a4b345571461004557600080fd5b3461008257807ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc360112610082576020604051643a352944008152f35b80fd5b82346100825760207ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261008257813591620f42408381029081048403610228578380029380850481149015171561022857643a352944009384018094116102285760b58471010000000000000000000000000000000000811015610211575b80690100000000000000000062010000921015610204575b650100000000008110156101f7575b63010000008110156101ea575b010260121c9360019480820401851c80820401851c80820401851c80820401851c80820401851c80820401851c80820401851c8080920410908181146101be57039004830180931161019257602083604051908152f35b9060116024927f4e487b7100000000000000000000000000000000000000000000000000000000835252fd5b6024856012867f4e487b7100000000000000000000000000000000000000000000000000000000835252fd5b60101c9160081b9161013b565b60201c9160101b9161012e565b60401c9160201b9161011f565b5068b500000000000000009050608085901c610107565b6024836011847f4e487b7100000000000000000000000000000000000000000000000000000000835252fd5b83903461028f57817ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc36011261028f5780620f424060209252f35b5080fdfea26469706673582212202029db6a087d223f768aabc1fe8120c7f9d7e525e947a354114a42f80a3955db64736f6c63430008130033";

type ReputationConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ReputationConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Reputation__factory extends ContractFactory {
  constructor(...args: ReputationConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<Reputation> {
    return super.deploy(overrides || {}) as Promise<Reputation>;
  }
  override getDeployTransaction(
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): Reputation {
    return super.attach(address) as Reputation;
  }
  override connect(signer: Signer): Reputation__factory {
    return super.connect(signer) as Reputation__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ReputationInterface {
    return new utils.Interface(_abi) as ReputationInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Reputation {
    return new Contract(address, _abi, signerOrProvider) as Reputation;
  }
}
