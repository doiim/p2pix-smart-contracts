# EventAndErrors

## Events

### AllowedERC20Updated

```solidity
event AllowedERC20Updated(address indexed token, bool indexed state)
```

#### Parameters

| Name            | Type    | Description |
| --------------- | ------- | ----------- |
| token `indexed` | address | undefined   |
| state `indexed` | bool    | undefined   |

### DepositAdded

```solidity
event DepositAdded(address indexed seller, uint256 depositID, address token, uint256 amount)
```

███ Events ████████████████████████████████████████████████████████████

#### Parameters

| Name             | Type    | Description |
| ---------------- | ------- | ----------- |
| seller `indexed` | address | undefined   |
| depositID        | uint256 | undefined   |
| token            | address | undefined   |
| amount           | uint256 | undefined   |

### DepositClosed

```solidity
event DepositClosed(address indexed seller, uint256 depositID)
```

#### Parameters

| Name             | Type    | Description |
| ---------------- | ------- | ----------- |
| seller `indexed` | address | undefined   |
| depositID        | uint256 | undefined   |

### DepositWithdrawn

```solidity
event DepositWithdrawn(address indexed seller, uint256 depositID, uint256 amount)
```

#### Parameters

| Name             | Type    | Description |
| ---------------- | ------- | ----------- |
| seller `indexed` | address | undefined   |
| depositID        | uint256 | undefined   |
| amount           | uint256 | undefined   |

### FundsWithdrawn

```solidity
event FundsWithdrawn(address owner, uint256 amount)
```

#### Parameters

| Name   | Type    | Description |
| ------ | ------- | ----------- |
| owner  | address | undefined   |
| amount | uint256 | undefined   |

### LockAdded

```solidity
event LockAdded(address indexed buyer, bytes32 indexed lockID, uint256 depositID, uint256 amount)
```

#### Parameters

| Name             | Type    | Description |
| ---------------- | ------- | ----------- |
| buyer `indexed`  | address | undefined   |
| lockID `indexed` | bytes32 | undefined   |
| depositID        | uint256 | undefined   |
| amount           | uint256 | undefined   |

### LockBlocksUpdated

```solidity
event LockBlocksUpdated(uint256 blocks)
```

#### Parameters

| Name   | Type    | Description |
| ------ | ------- | ----------- |
| blocks | uint256 | undefined   |

### LockReleased

```solidity
event LockReleased(address indexed buyer, bytes32 lockId)
```

#### Parameters

| Name            | Type    | Description |
| --------------- | ------- | ----------- |
| buyer `indexed` | address | undefined   |
| lockId          | bytes32 | undefined   |

### LockReturned

```solidity
event LockReturned(address indexed buyer, bytes32 lockId)
```

#### Parameters

| Name            | Type    | Description |
| --------------- | ------- | ----------- |
| buyer `indexed` | address | undefined   |
| lockId          | bytes32 | undefined   |

### ReputationUpdated

```solidity
event ReputationUpdated(address reputation)
```

#### Parameters

| Name       | Type    | Description |
| ---------- | ------- | ----------- |
| reputation | address | undefined   |

### ValidSignersUpdated

```solidity
event ValidSignersUpdated(address[] signers)
```

#### Parameters

| Name    | Type      | Description |
| ------- | --------- | ----------- |
| signers | address[] | undefined   |

## Errors

### AddressDenied

```solidity
error AddressDenied()
```

_Address doesn&#39;t exist in a MerkleTree.Address not allowed as relayer.0x3b8474be_

### AlreadyReleased

```solidity
error AlreadyReleased()
```

_Lock already released or returned.0x63b4904e_

### AmountNotAllowed

```solidity
error AmountNotAllowed()
```

_Wished amount to be locked exceeds the limit allowed.0x1c18f846_

### DepositAlreadyExists

```solidity
error DepositAlreadyExists()
```

_Deposit already exist and it is still valid.0xc44bd765_

### InvalidDeposit

```solidity
error InvalidDeposit()
```

_Deposit not valid anymore.0xb2e532de_

### InvalidSigner

```solidity
error InvalidSigner()
```

_Signer is not a valid signer.0x815e1d64_

### LengthMismatch

```solidity
error LengthMismatch()
```

_Arrays&#39; length don&#39;t match.0xff633a38_

### LoopOverflow

```solidity
error LoopOverflow()
```

_Loop bounds have overflowed.0xdfb035c9_

### NoTokens

```solidity
error NoTokens()
```

_No tokens array provided as argument.0xdf957883_

### NotEnoughTokens

```solidity
error NotEnoughTokens()
```

_Not enough token remaining on deposit.0x22bbb43c_

### NotExpired

```solidity
error NotExpired()
```

_Lock not expired or already released.Another lock with same ID is not expired yet.0xd0404f85_

### OnlySeller

```solidity
error OnlySeller()
```

_Only seller could call this function.`msg.sender` and the seller differ.0x85d1f726_

### TokenDenied

```solidity
error TokenDenied()
```

_Token address not allowed to be deposited.0x1578328e_

### TxAlreadyUsed

```solidity
error TxAlreadyUsed()
```

_Transaction already used to unlock payment.0xf490a6ea_
