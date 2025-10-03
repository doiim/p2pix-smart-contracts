# Solidity API

## ECDSA

Gas optimized ECDSA wrapper.

### InvalidSignature

```solidity
error InvalidSignature()
```

_The signature is invalid._

### recoverCalldata

```solidity
function recoverCalldata(bytes32 hash, bytes signature) internal view returns (address result)
```

_Recovers the signer's address from a message digest `hash`,
and the `signature`.

This function does NOT accept EIP-2098 short form signatures.
Use `recover(bytes32 hash, bytes32 r, bytes32 vs)` for EIP-2098
short form signatures instead._

### toEthSignedMessageHash

```solidity
function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32 result)
```

_Returns an Ethereum Signed Message, created from a `hash`.
This produces a hash corresponding to the one signed with the
[`eth_sign`](https://eth.wiki/json-rpc/API#eth_sign)
JSON-RPC method as part of EIP-191._

