# p2pix-smart-contracts

**Repository for P2Pix EVM contracts to be imported by the project.**

## SM Dependency Tree

```rs
./contracts/
├── DataTypes.sol
├── EventAndErrors.sol
├── lib
│   ├── auth
│   │   └── Owned.sol
│   ├── interfaces
│   │   └── IReputation.sol
│   ├── mock
│   │   └── mockToken.sol
│   ├── tokens
│   │   └── ERC20.sol
│   └── utils
│       ├── Counters.sol
│       ├── MerkleProofLib.sol
│       ├── ReentrancyGuard.sol
│       └── SafeTransferLib.sol
├── p2pix.sol
└── Reputation.sol
```

## Callgraph

![Callgraph](docs/callgraph.svg)

## Current Deployment addresses

| Testnet 	| Token Address                              	| P2pix Address                              	|
|---------	|--------------------------------------------	|--------------------------------------------	|
| Goerli  	| 0x294003F602c321627152c6b7DED3EAb5bEa853Ee 	| 0x5f3EFA9A90532914545CEf527C530658af87e196 	|
| Mumbai  	| 0x294003F602c321627152c6b7DED3EAb5bEa853Ee  | 0x5f3EFA9A90532914545CEf527C530658af87e196	|

<!-- All contracts deployed by 0x8dC06F985C131166570825F52447E8c88d64aE20 -->

<!-- https://goerli.etherscan.io/address/0x294003F602c321627152c6b7DED3EAb5bEa853Ee#code -->

<!-- https://goerli.etherscan.io/address/0x5f3EFA9A90532914545CEf527C530658af87e196#code -->

<!-- https://mumbai.polygonscan.com/address/0x294003F602c321627152c6b7DED3EAb5bEa853Ee#code -->

<!-- https://mumbai.polygonscan.com/address/0x5f3EFA9A90532914545CEf527C530658af87e196#code -->

## Usage

### Pre Requisites

Before installing, create a `.env` file and set a BIP-39 compatible mnemonic and other env criteria as in `.env.example`.

### Install

```sh
$ yarn install
```

### Compile

```sh
$ yarn compile
```

**_NOTE:_** TypeChain artifacts generated at compile time.

### Test

```sh
$ yarn test
```

### Report Gas

```sh
$ REPORT_GAS=true yarn test
```

**_NOTE_:** Gas usage per unit test and average gas per method call.

### Clean

Delete the smart contract artifacts and cache:

```sh
$ yarn clean
```

## Importing artifacts

To import artifacts on the project use the following:

```ts
import P2PIXArtifact from "p2pix-smart-contracts/artifacts/contracts/p2pix.sol/P2PIX.json";
```

To grab deployment addresses you can just grab from deploys folder:

```ts
import localhostDeploys from "p2pix-smart-contracts/deploys/localhost.json";
```

## Deploying to local environment

On the first teminal, use the following command and import some wallets to your Metamask, then connect to the network pointed:

```sh
yarn hardhat node
```

On the second teminal, run the following commands:

```sh
yarn deploy1:localhost
yarn deploy2:localhost
```

**_NOTE_:** The second script transfers 2M tokens to the first wallet of the node.
To use the P2Pix smart contract first transfer some of the tokens to other wallets.


## Deploying to testnets

Deploy to Ethereum's Goerli testnet:

```sh
yarn deploy1:goerli
yarn deploy2:goerli
```

Deploy to Polygon's Mumbai testnet:

```sh
yarn deploy1:mumbai
yarn deploy2:mumbai
```
