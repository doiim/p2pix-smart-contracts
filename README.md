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

Then use a Contract instance to interact directly with it:

```
const p2pixContract = new ethers.Contract(address, P2PIXArtifact.abi, signer);
```

## Testing

To run tests, clone this repo, install dependencies and run Hardhat tests.

```
git clone https://github.com/doiim/p2pix-smart-contracts.git
cd p2pix-smart-contract
npm install
npx hardhat test
```
