# p2pix-smart-contracts

**Repository for P2Pix EVM contracts to be imported by the project.**

## SM Dependency Tree

```rs
./contracts/
├── Constants.sol
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
│       ├── ECDSA.sol
│       ├── MerkleProofLib.sol
│       ├── Multicall.sol
│       ├── ReentrancyGuard.sol
│       └── SafeTransferLib.sol
├── p2pix.sol
└── Reputation.sol
```

## Callgraph

![Callgraph](docs/callgraph.svg)

## Current Deployment addresses

### V1

| Testnet | Token Address                              | P2pix Address                              |
| ------- | ------------------------------------------ | ------------------------------------------ |
| Goerli  | 0x294003F602c321627152c6b7DED3EAb5bEa853Ee | 0x5f3EFA9A90532914545CEf527C530658af87e196 |
| Mumbai  | 0x294003F602c321627152c6b7DED3EAb5bEa853Ee | 0x5f3EFA9A90532914545CEf527C530658af87e196 |

<!-- All contracts deployed by 0x8dC06F985C131166570825F52447E8c88d64aE20 -->

<!-- https://goerli.etherscan.io/address/0x294003F602c321627152c6b7DED3EAb5bEa853Ee#code -->

<!-- https://goerli.etherscan.io/address/0x5f3EFA9A90532914545CEf527C530658af87e196#code -->

<!-- https://mumbai.polygonscan.com/address/0x294003F602c321627152c6b7DED3EAb5bEa853Ee#code -->

<!-- https://mumbai.polygonscan.com/address/0x5f3EFA9A90532914545CEf527C530658af87e196#code -->

### V2

| Testnet | Token Address                              | P2pix Address                              | Reputation Address                         | Multicall Address                          |
| ------- | ------------------------------------------ | ------------------------------------------ | ------------------------------------------ | ------------------------------------------ |
| Sepolia | 0x3eBE212377D847828eBb9D2a100f5c5EA1EF3A72 | 0xb7cDAE58C6e715Cfd795BB142041E43b9CB02497 | 0xFd1194A56995Ef7B62730F4061408e79d88E5207 | 0x2f7f9848A803E67d79C0C8aa42b663dCF6E1B5ed |

<!-- All contracts deployed by 0x8dC06F985C131166570825F52447E8c88d64aE20 -->
<!-- https://sepolia.etherscan.io/address/0x3eBE212377D847828eBb9D2a100f5c5EA1EF3A72#code -->
<!-- https://sepolia.etherscan.io/address/0xb7cDAE58C6e715Cfd795BB142041E43b9CB02497#code -->
<!-- https://sepolia.etherscan.io/address/0xFd1194A56995Ef7B62730F4061408e79d88E5207#code -->
<!-- https://sepolia.etherscan.io/address/0x2f7f9848A803E67d79C0C8aa42b663dCF6E1B5ed#code -->

## Usage

### Pre Requisites

Before installing, create a `.env` file and set the authentication method and other env criteria as in `.env.example`.

You can authenticate with either:
- `PRIVATE_KEY` — a raw hex private key (e.g. `0x123...`). Takes priority if both are set.
- `MNEMONIC` — a BIP-39 compatible 12-word mnemonic phrase. Used as fallback when `PRIVATE_KEY` is not set.

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

## Deployment (Hardhat Ignition)

Deployments are orchestrated by
[Hardhat Ignition](https://hardhat.org/ignition). Each module declares its
contracts; Ignition handles ordering, idempotency, and per-network state
under `ignition/deployments/`.

### Modules

- `ignition/modules/MockToken.ts` — ERC20 mock used in dev / testnets.
- `ignition/modules/Reputation.ts` — Reputation + Multicall.
- `ignition/modules/P2PIX.ts` — production deploy (no MockToken). Token
  addresses passed via parameters (`tokens` + `allowed`).
- `ignition/modules/P2PIXWithMock.ts` — dev/test deploy. Wires Reputation +
  MockToken and deploys P2PIX.

### Per-network parameters

Network-specific values (e.g. `defaultBlocks`, `validSigners`, MockToken
`supply`) live in `ignition/parameters/<network>.json`. Only
`localhost.json` is checked in; copy it to e.g. `sepolia.json` and set the
network values before running the deploy script.

### Local environment

On the first terminal:

```sh
yarn hardhat node
```

On the second terminal:

```sh
yarn deploy:mock --network localhost --parameters ignition/parameters/localhost.json
```

Addresses for every deployed contract are written to
`ignition/deployments/chain-31337/deployed_addresses.json` (this path is
gitignored — local-only state).

### Testnets

```sh
yarn deploy:mock --network sepolia
```

Requires the matching `ignition/parameters/sepolia.json` and the relevant
API keys in `.env`.

### Production (real tokens)

Use the `P2PIX` module when the target network already has the ERC20
tokens you want P2PIX to support — no MockToken is deployed.

1. Copy `ignition/parameters/prod.example.json` to
   `ignition/parameters/<network>.json` and set:
   - `defaultBlocks`, `validSigners`
   - `tokens` — array of ERC20 addresses on the target network
   - `allowed` — array of booleans, same length as `tokens`
2. Run:

   ```sh
   yarn deploy --network <network> --parameters ignition/parameters/<network>.json
   ```

The deployed Reputation/Multicall/P2PIX addresses are written to
`ignition/deployments/chain-<id>/deployed_addresses.json`.
