/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  EventAndErrors,
  EventAndErrorsInterface,
} from "../EventAndErrors";

const _abi = [
  {
    inputs: [],
    name: "AddressDenied",
    type: "error",
  },
  {
    inputs: [],
    name: "AlreadyReleased",
    type: "error",
  },
  {
    inputs: [],
    name: "AmountNotAllowed",
    type: "error",
  },
  {
    inputs: [],
    name: "DepositAlreadyExists",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidDeposit",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSigner",
    type: "error",
  },
  {
    inputs: [],
    name: "LengthMismatch",
    type: "error",
  },
  {
    inputs: [],
    name: "LoopOverflow",
    type: "error",
  },
  {
    inputs: [],
    name: "NoTokens",
    type: "error",
  },
  {
    inputs: [],
    name: "NotEnoughTokens",
    type: "error",
  },
  {
    inputs: [],
    name: "NotExpired",
    type: "error",
  },
  {
    inputs: [],
    name: "OnlySeller",
    type: "error",
  },
  {
    inputs: [],
    name: "TokenDenied",
    type: "error",
  },
  {
    inputs: [],
    name: "TxAlreadyUsed",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bool",
        name: "state",
        type: "bool",
      },
    ],
    name: "AllowedERC20Updated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "depositID",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "DepositAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "depositID",
        type: "uint256",
      },
    ],
    name: "DepositClosed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "depositID",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "DepositWithdrawn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "FundsWithdrawn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "buyer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "lockID",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "depositID",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "LockAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "blocks",
        type: "uint256",
      },
    ],
    name: "LockBlocksUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "buyer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "lockId",
        type: "bytes32",
      },
    ],
    name: "LockReleased",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "buyer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "lockId",
        type: "bytes32",
      },
    ],
    name: "LockReturned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "reputation",
        type: "address",
      },
    ],
    name: "ReputationUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address[]",
        name: "signers",
        type: "address[]",
      },
    ],
    name: "ValidSignersUpdated",
    type: "event",
  },
];

export class EventAndErrors__factory {
  static readonly abi = _abi;
  static createInterface(): EventAndErrorsInterface {
    return new utils.Interface(_abi) as EventAndErrorsInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): EventAndErrors {
    return new Contract(address, _abi, signerOrProvider) as EventAndErrors;
  }
}
