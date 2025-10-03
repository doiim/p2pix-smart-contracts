# Solidity API

## EventAndErrors

### DepositAdded

```solidity
event DepositAdded(address seller, contract ERC20 token, uint256 amount)
```

_0x63d8d7d5e63e9840ec91a12a160d27b7cfab294f6ba070b7359692acfe6b03bf_

### ValidSet

```solidity
event ValidSet(address seller, contract ERC20 token, bool state)
```

_0xca585721b6b442dc9183932f7c84dc2880efb67c4da52cc06873e78971105d49_

### DepositWithdrawn

```solidity
event DepositWithdrawn(address seller, contract ERC20 token, uint256 amount)
```

_0x2cd6435b1b961c13f55202979edd0765a809f69a539d8a477436c94c1211e43e_

### LockAdded

```solidity
event LockAdded(address buyer, uint256 lockID, address seller, uint256 amount)
```

_0x8fb3989f70bd172a37d15b41b015e48ea09d59329638377304a4198cd0c4ea65_

### LockReleased

```solidity
event LockReleased(address buyer, uint256 lockId, uint256 amount)
```

_0x364537f14276f2a0ce9905588413f96454cbb8fb2e4f5308389307c1098bede8_

### LockReturned

```solidity
event LockReturned(address buyer, uint256 lockId)
```

_0x830501e61b8b075e170b22a430e39454bdb12ed3e9620e586430b6ac00079da5_

### FundsWithdrawn

```solidity
event FundsWithdrawn(address owner, uint256 amount)
```

_0xeaff4b37086828766ad3268786972c0cd24259d4c87a80f9d3963a3c3d999b0d_

### RootUpdated

```solidity
event RootUpdated(address seller, bytes32 merkleRoot)
```

_0x0b294da292f26e55fd442b5c0164fbb9013036ff00c5cfdde0efd01c1baaf632_

### AllowedERC20Updated

```solidity
event AllowedERC20Updated(address token, bool state)
```

_0x5d6e86e5341d57a92c49934296c51542a25015c9b1782a1c2722a940131c3d9a_

### TrustedForwarderUpdated

```solidity
event TrustedForwarderUpdated(address forwarder, bool state)
```

_0xbee55516e29d3969d3cb8eb01351eb3c52d06f9e2435bd5a8bfe3647e185df92_

### ReputationUpdated

```solidity
event ReputationUpdated(address reputation)
```

_0xe127cf589a3879da0156d4a24f43b44f65cfa3570de594806b0bfa2fcf06884f_

### LockBlocksUpdated

```solidity
event LockBlocksUpdated(uint256 blocks)
```

_0x70fa43ca70216ad905ade86b9e650a691b2ce5a01980d0a81bdd8324141b8511_

### ValidSignersUpdated

```solidity
event ValidSignersUpdated(address[] signers)
```

_0x14a422d2412784a5749d03da98921fe468c98577b767851389a9f58ea5a363d7_

### OnlySeller

```solidity
error OnlySeller()
```

_Only seller could call this function.
`msg.sender` and the seller differ.
0x85d1f726_

### NotExpired

```solidity
error NotExpired()
```

_Lock not expired or already released.
Another lock with same ID is not expired yet.
0xd0404f85_

### LoopOverflow

```solidity
error LoopOverflow()
```

_Loop bounds have overflowed.
0xdfb035c9_

### InvalidDeposit

```solidity
error InvalidDeposit()
```

_Deposit not valid anymore.
0xb2e532de_

### NotEnoughTokens

```solidity
error NotEnoughTokens()
```

_Not enough token remaining on deposit.
0x22bbb43c_

### AlreadyReleased

```solidity
error AlreadyReleased()
```

_Lock already released or returned.
0x63b4904e_

### TxAlreadyUsed

```solidity
error TxAlreadyUsed()
```

_Transaction already used to unlock payment.
0xf490a6ea_

### InvalidSigner

```solidity
error InvalidSigner()
```

_Signer is not a valid signer.
0x815e1d64_

### AddressDenied

```solidity
error AddressDenied()
```

_Address doesn't exist in a MerkleTree.
Address not allowed as relayer.
0x3b8474be_

### LengthMismatch

```solidity
error LengthMismatch()
```

_Arrays' length don't match.
0xff633a38_

### NoTokens

```solidity
error NoTokens()
```

_No tokens array provided as argument.
0xdf957883_

### TokenDenied

```solidity
error TokenDenied()
```

_Token address not allowed to be deposited.
0x1578328e_

### AmountNotAllowed

```solidity
error AmountNotAllowed()
```

_Wished amount to be locked exceeds the limit allowed.
0x1c18f846_

### StaticCallFailed

```solidity
error StaticCallFailed()
```

_Reverts when success return value returns false.
0xe10bf1cc_

### LockExpired

```solidity
error LockExpired()
```

_Reverts on an expired lock.
0xf6fafba0_

### DecOverflow

```solidity
error DecOverflow()
```

_0xce3a3d37_

### MaxBalExceeded

```solidity
error MaxBalExceeded()
```

_0xf3fb0eb9_

### EmptyPixTarget

```solidity
error EmptyPixTarget()
```

_0x6a3bc53e_

### NotInitialized

```solidity
error NotInitialized()
```

_0x87138d5c_

