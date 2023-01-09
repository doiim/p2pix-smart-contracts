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
import type { PromiseOrValue } from "../../../../common";
import type {
  MockToken,
  MockTokenInterface,
} from "../../../../lib/mock/mockToken.sol/MockToken";

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
        name: "amount",
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
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
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
        name: "",
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
        internalType: "address[]",
        name: "to",
        type: "address[]",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
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
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "nonces",
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
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
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
  "0x60e06040523480156200001157600080fd5b50604051620010bf380380620010bf833981016040819052620000349162000279565b6040805180820182526007815266135bd8dad0949360ca1b6020808301918252835180850190945260048452631350949360e21b908401528151919291601291620000839160009190620001d3565b50815162000099906001906020850190620001d3565b5060ff81166080524660a052620000af620000ca565b60c05250620000c391503390508262000166565b506200039b565b60007f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f6000604051620000fe9190620002d0565b6040805191829003822060208301939093528101919091527fc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc660608201524660808201523060a082015260c00160405160208183030381529060405280519060200120905090565b80600260008282546200017a919062000374565b90915550506001600160a01b0382166000818152600360209081526040808320805486019055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050565b828054620001e19062000293565b90600052602060002090601f01602090048101928262000205576000855562000250565b82601f106200022057805160ff191683800117855562000250565b8280016001018555821562000250579182015b828111156200025057825182559160200191906001019062000233565b506200025e92915062000262565b5090565b5b808211156200025e576000815560010162000263565b6000602082840312156200028c57600080fd5b5051919050565b600181811c90821680620002a857607f821691505b60208210811415620002ca57634e487b7160e01b600052602260045260246000fd5b50919050565b600080835481600182811c915080831680620002ed57607f831692505b60208084108214156200030e57634e487b7160e01b86526022600452602486fd5b818015620003255760018114620003375762000366565b60ff1986168952848901965062000366565b60008a81526020902060005b868110156200035e5781548b82015290850190830162000343565b505084890196505b509498975050505050505050565b600082198211156200039657634e487b7160e01b600052601160045260246000fd5b500190565b60805160a05160c051610cf4620003cb60003960006104630152600061042e015260006101540152610cf46000f3fe608060405234801561001057600080fd5b50600436106100df5760003560e01c806370a082311161008c578063a9059cbb11610066578063a9059cbb146101d8578063d505accf146101eb578063dd62ed3e14610200578063ea66696c1461022b57600080fd5b806370a08231146101905780637ecebe00146101b057806395d89b41146101d057600080fd5b806323b872dd116100bd57806323b872dd1461013c578063313ce5671461014f5780633644e5151461018857600080fd5b806306fdde03146100e4578063095ea7b31461010257806318160ddd14610125575b600080fd5b6100ec61023e565b6040516100f991906108fc565b60405180910390f35b61011561011036600461096d565b6102cc565b60405190151581526020016100f9565b61012e60025481565b6040519081526020016100f9565b61011561014a366004610997565b610338565b6101767f000000000000000000000000000000000000000000000000000000000000000081565b60405160ff90911681526020016100f9565b61012e61042a565b61012e61019e3660046109d3565b60036020526000908152604090205481565b61012e6101be3660046109d3565b60056020526000908152604090205481565b6100ec610485565b6101156101e636600461096d565b610492565b6101fe6101f93660046109f5565b61050a565b005b61012e61020e366004610a68565b600460209081526000928352604080842090915290825290205481565b6101fe610239366004610ab1565b6107b1565b6000805461024b90610b7c565b80601f016020809104026020016040519081016040528092919081815260200182805461027790610b7c565b80156102c45780601f10610299576101008083540402835291602001916102c4565b820191906000526020600020905b8154815290600101906020018083116102a757829003601f168201915b505050505081565b3360008181526004602090815260408083206001600160a01b038716808552925280832085905551919290917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925906103279086815260200190565b60405180910390a350600192915050565b6001600160a01b038316600090815260046020908152604080832033845290915281205460001981146103945761036f8382610bcd565b6001600160a01b03861660009081526004602090815260408083203384529091529020555b6001600160a01b038516600090815260036020526040812080548592906103bc908490610bcd565b90915550506001600160a01b03808516600081815260036020526040908190208054870190555190918716907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906104179087815260200190565b60405180910390a3506001949350505050565b60007f000000000000000000000000000000000000000000000000000000000000000046146104605761045b6107f7565b905090565b507f000000000000000000000000000000000000000000000000000000000000000090565b6001805461024b90610b7c565b336000908152600360205260408120805483919083906104b3908490610bcd565b90915550506001600160a01b038316600081815260036020526040908190208054850190555133907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906103279086815260200190565b42841015610579576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601760248201527f5045524d49545f444541444c494e455f4558504952454400000000000000000060448201526064015b60405180910390fd5b6000600161058561042a565b6001600160a01b038a811660008181526005602090815260409182902080546001810190915582517f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c98184015280840194909452938d166060840152608083018c905260a083019390935260c08083018b90528151808403909101815260e0830190915280519201919091207f19010000000000000000000000000000000000000000000000000000000000006101008301526101028201929092526101228101919091526101420160408051601f198184030181528282528051602091820120600084529083018083525260ff871690820152606081018590526080810184905260a0016020604051602081039080840390855afa1580156106ac573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b038116158015906106e25750876001600160a01b0316816001600160a01b0316145b610748576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f494e56414c49445f5349474e45520000000000000000000000000000000000006044820152606401610570565b6001600160a01b0390811660009081526004602090815260408083208a8516808552908352928190208990555188815291928a16917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a350505050505050565b815160005b818110156107f1576107e18482815181106107d3576107d3610be4565b602002602001015184610891565b6107ea81610bfa565b90506107b6565b50505050565b60007f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60006040516108299190610c15565b6040805191829003822060208301939093528101919091527fc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc660608201524660808201523060a082015260c00160405160208183030381529060405280519060200120905090565b80600260008282546108a39190610ccf565b90915550506001600160a01b0382166000818152600360209081526040808320805486019055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a35050565b600060208083528351808285015260005b818110156109295785810183015185820160400152820161090d565b8181111561093b576000604083870101525b50601f01601f1916929092016040019392505050565b80356001600160a01b038116811461096857600080fd5b919050565b6000806040838503121561098057600080fd5b61098983610951565b946020939093013593505050565b6000806000606084860312156109ac57600080fd5b6109b584610951565b92506109c360208501610951565b9150604084013590509250925092565b6000602082840312156109e557600080fd5b6109ee82610951565b9392505050565b600080600080600080600060e0888a031215610a1057600080fd5b610a1988610951565b9650610a2760208901610951565b95506040880135945060608801359350608088013560ff81168114610a4b57600080fd5b9699959850939692959460a0840135945060c09093013592915050565b60008060408385031215610a7b57600080fd5b610a8483610951565b9150610a9260208401610951565b90509250929050565b634e487b7160e01b600052604160045260246000fd5b60008060408385031215610ac457600080fd5b823567ffffffffffffffff80821115610adc57600080fd5b818501915085601f830112610af057600080fd5b8135602082821115610b0457610b04610a9b565b8160051b604051601f19603f83011681018181108682111715610b2957610b29610a9b565b604052928352818301935084810182019289841115610b4757600080fd5b948201945b83861015610b6c57610b5d86610951565b85529482019493820193610b4c565b9997909101359750505050505050565b600181811c90821680610b9057607f821691505b60208210811415610bb157634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b600082821015610bdf57610bdf610bb7565b500390565b634e487b7160e01b600052603260045260246000fd5b6000600019821415610c0e57610c0e610bb7565b5060010190565b600080835481600182811c915080831680610c3157607f831692505b6020808410821415610c5157634e487b7160e01b86526022600452602486fd5b818015610c655760018114610c9457610cc1565b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00861689528489019650610cc1565b60008a81526020902060005b86811015610cb95781548b820152908501908301610ca0565b505084890196505b509498975050505050505050565b60008219821115610ce257610ce2610bb7565b50019056fea164736f6c6343000809000a";

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
