/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Signer,
  utils,
  Contract,
  ContractFactory,
  BigNumberish,
  Overrides,
} from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../common";
import type {
  MockToken,
  MockTokenInterface,
} from "../../mockToken.sol/MockToken";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "supply",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
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
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
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
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
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
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b5060405162000b8d38038062000b8d83398101604081905262000034916200021d565b6040805180820182526007815266135bd8dad0949360ca1b6020808301918252835180850190945260048452631350949360e21b9084015281519192916200007f9160039162000177565b5080516200009590600490602084019062000177565b505050620000aa3382620000b160201b60201c565b506200029b565b6001600160a01b0382166200010c5760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640160405180910390fd5b806002600082825462000120919062000237565b90915550506001600160a01b038216600081815260208181526040808320805486019055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050565b82805462000185906200025e565b90600052602060002090601f016020900481019282620001a95760008555620001f4565b82601f10620001c457805160ff1916838001178555620001f4565b82800160010185558215620001f4579182015b82811115620001f4578251825591602001919060010190620001d7565b506200020292915062000206565b5090565b5b8082111562000202576000815560010162000207565b6000602082840312156200023057600080fd5b5051919050565b600082198211156200025957634e487b7160e01b600052601160045260246000fd5b500190565b600181811c908216806200027357607f821691505b602082108114156200029557634e487b7160e01b600052602260045260246000fd5b50919050565b6108e280620002ab6000396000f3fe608060405234801561001057600080fd5b50600436106100c95760003560e01c80633950935111610081578063a457c2d71161005b578063a457c2d714610187578063a9059cbb1461019a578063dd62ed3e146101ad57600080fd5b8063395093511461014357806370a082311461015657806395d89b411461017f57600080fd5b806318160ddd116100b257806318160ddd1461010f57806323b872dd14610121578063313ce5671461013457600080fd5b806306fdde03146100ce578063095ea7b3146100ec575b600080fd5b6100d66101e6565b6040516100e39190610748565b60405180910390f35b6100ff6100fa3660046107b9565b610278565b60405190151581526020016100e3565b6002545b6040519081526020016100e3565b6100ff61012f3660046107e3565b610290565b604051601281526020016100e3565b6100ff6101513660046107b9565b6102b4565b61011361016436600461081f565b6001600160a01b031660009081526020819052604090205490565b6100d66102f3565b6100ff6101953660046107b9565b610302565b6100ff6101a83660046107b9565b6103b1565b6101136101bb366004610841565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6060600380546101f590610874565b80601f016020809104026020016040519081016040528092919081815260200182805461022190610874565b801561026e5780601f106102435761010080835404028352916020019161026e565b820191906000526020600020905b81548152906001019060200180831161025157829003601f168201915b5050505050905090565b6000336102868185856103bf565b5060019392505050565b60003361029e8582856104e3565b6102a9858585610575565b506001949350505050565b3360008181526001602090815260408083206001600160a01b038716845290915281205490919061028690829086906102ee9087906108af565b6103bf565b6060600480546101f590610874565b3360008181526001602090815260408083206001600160a01b0387168452909152812054909190838110156103a45760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f7760448201527f207a65726f00000000000000000000000000000000000000000000000000000060648201526084015b60405180910390fd5b6102a982868684036103bf565b600033610286818585610575565b6001600160a01b0383166104215760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b606482015260840161039b565b6001600160a01b0382166104825760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b606482015260840161039b565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b6001600160a01b03838116600090815260016020908152604080832093861683529290522054600019811461056f57818110156105625760405162461bcd60e51b815260206004820152601d60248201527f45524332303a20696e73756666696369656e7420616c6c6f77616e6365000000604482015260640161039b565b61056f84848484036103bf565b50505050565b6001600160a01b0383166105f15760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f20616460448201527f6472657373000000000000000000000000000000000000000000000000000000606482015260840161039b565b6001600160a01b0382166106535760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b606482015260840161039b565b6001600160a01b038316600090815260208190526040902054818110156106e25760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e742065786365656473206260448201527f616c616e63650000000000000000000000000000000000000000000000000000606482015260840161039b565b6001600160a01b03848116600081815260208181526040808320878703905593871680835291849020805487019055925185815290927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a361056f565b600060208083528351808285015260005b8181101561077557858101830151858201604001528201610759565b81811115610787576000604083870101525b50601f01601f1916929092016040019392505050565b80356001600160a01b03811681146107b457600080fd5b919050565b600080604083850312156107cc57600080fd5b6107d58361079d565b946020939093013593505050565b6000806000606084860312156107f857600080fd5b6108018461079d565b925061080f6020850161079d565b9150604084013590509250925092565b60006020828403121561083157600080fd5b61083a8261079d565b9392505050565b6000806040838503121561085457600080fd5b61085d8361079d565b915061086b6020840161079d565b90509250929050565b600181811c9082168061088857607f821691505b602082108114156108a957634e487b7160e01b600052602260045260246000fd5b50919050565b600082198211156108d057634e487b7160e01b600052601160045260246000fd5b50019056fea164736f6c6343000809000a";

type MockTokenConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MockTokenConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MockToken__factory extends ContractFactory {
  constructor(...args: MockTokenConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    supply: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<MockToken> {
    return super.deploy(supply, overrides || {}) as Promise<MockToken>;
  }
  override getDeployTransaction(
    supply: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(supply, overrides || {});
  }
  override attach(address: string): MockToken {
    return super.attach(address) as MockToken;
  }
  override connect(signer: Signer): MockToken__factory {
    return super.connect(signer) as MockToken__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MockTokenInterface {
    return new utils.Interface(_abi) as MockTokenInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MockToken {
    return new Contract(address, _abi, signerOrProvider) as MockToken;
  }
}