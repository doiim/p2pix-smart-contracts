# p2pix-smart-contracts

Repository for P2Pix EVM contracts to be imported by the project.

## Installation

Import the repository on your app to allow use the artifacts for Ethers.

```
npm install --save git+https://github.com/doiim/p2pix-smart-contracts.git
```

To import artifacts on the project use the following:

```
import P2PIXArtifact from 'p2pix-smart-contracts/artifacts/contracts/p2pix.sol/P2PIX.json'
```

To grab deployment addresses you can just grab from deploys folder:
```
import localhostDeploys from 'p2pix-smart-contracts/deploys/localhost.json'
```

The default deploy addresses for localhost is the following:
| Contract | Address | 
|-|-|
|p2pix|`0x5FbDB2315678afecb367f032d93F642f64180aa3`|
|token|`0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`|

Then use a Contract instance to interact directly with it:

```
const p2pixContract = new ethers.Contract(address, P2PIXArtifact.abi, signer);
```

## Deploying local environment

Clone the repo and install dependencies:
```
git clone https://github.com/doiim/p2pix-smart-contracts.git
cd p2pix-smart-contract
npm install
```

On the first teminal use the following command and import some wallets to your Metamask and connect to the network pointed:
```
npx hardhat node
```

On the second teminal run following commands:
```
npx hardhat run --network localhost scripts/1-deploy-p2pix.js
npx hardhat run --network localhost scripts/2-deploy-mockToken.js
```

The second script transfer 2M tokens to the firrs wallet of the node.
To use the P2Pix smart contract first transfer some of the tokens to other wallets.

## Testing

To run tests, clone this repo, install dependencies and run Hardhat tests.

```
git clone https://github.com/doiim/p2pix-smart-contracts.git
cd p2pix-smart-contract
npm install
npx hardhat test
```
