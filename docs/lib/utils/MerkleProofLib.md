# Solidity API

## MerkleProofLib

Gas optimized verification of proof of inclusion for a leaf in a Merkle tree.

### verify

```solidity
function verify(bytes32[] proof, bytes32 root, bytes32 leaf) internal pure returns (bool isValid)
```

_Returns whether `leaf` exists in the Merkle tree with `root`, given `proof`._

