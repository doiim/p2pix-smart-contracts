# EventAndErrors










## Events

### AllowedERC20Updated

```solidity
event AllowedERC20Updated(address indexed token, bool indexed state)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |
| state `indexed` | bool | undefined |

### DepositAdded

```solidity
event DepositAdded(address indexed seller, uint256 depositID, address token, uint256 amount)
```

███ Events ████████████████████████████████████████████████████████████



#### Parameters

| Name | Type | Description |
|---|---|---|
| seller `indexed` | address | undefined |
| depositID  | uint256 | undefined |
| token  | address | undefined |
| amount  | uint256 | undefined |

### DepositClosed

```solidity
event DepositClosed(address indexed seller, uint256 depositID)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| seller `indexed` | address | undefined |
| depositID  | uint256 | undefined |

### DepositWithdrawn

```solidity
event DepositWithdrawn(address indexed seller, uint256 depositID, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| seller `indexed` | address | undefined |
| depositID  | uint256 | undefined |
| amount  | uint256 | undefined |

### FundsWithdrawn

```solidity
event FundsWithdrawn(address owner, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner  | address | undefined |
| amount  | uint256 | undefined |

### LockAdded

```solidity
event LockAdded(address indexed buyer, bytes32 indexed lockID, uint256 depositID, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| buyer `indexed` | address | undefined |
| lockID `indexed` | bytes32 | undefined |
| depositID  | uint256 | undefined |
| amount  | uint256 | undefined |

### LockBlocksUpdated

```solidity
event LockBlocksUpdated(uint256 blocks)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| blocks  | uint256 | undefined |

### LockReleased

```solidity
event LockReleased(address indexed buyer, bytes32 lockId)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| buyer `indexed` | address | undefined |
| lockId  | bytes32 | undefined |

### LockReturned

```solidity
event LockReturned(address indexed buyer, bytes32 lockId)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| buyer `indexed` | address | undefined |
| lockId  | bytes32 | undefined |

### ReputationUpdated

```solidity
event ReputationUpdated(address reputation)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| reputation  | address | undefined |

### ValidSignersUpdated

```solidity
event ValidSignersUpdated(address[] signers)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| signers  | address[] | undefined |



## Errors

### AddressDenied

```solidity
error AddressDenied()
```



*Address doesn&#39;t exist in a MerkleTree.Address not allowed as relayer.0x3b8474be*


### AlreadyReleased

```solidity
error AlreadyReleased()
```



*Lock already released or returned.0x63b4904e*


### AmountNotAllowed

```solidity
error AmountNotAllowed()
```



*Wished amount to be locked exceeds the limit allowed.0x1c18f846*


### DepositAlreadyExists

```solidity
error DepositAlreadyExists()
```



*Deposit already exist and it is still valid.0xc44bd765*


### InvalidDeposit

```solidity
error InvalidDeposit()
```



*Deposit not valid anymore.0xb2e532de*


### InvalidSigner

```solidity
error InvalidSigner()
```



*Signer is not a valid signer.0x815e1d64*


### LengthMismatch

```solidity
error LengthMismatch()
```



*Arrays&#39; length don&#39;t match.0xff633a38*


### LoopOverflow

```solidity
error LoopOverflow()
```



*Loop bounds have overflowed.0xdfb035c9*


### NoTokens

```solidity
error NoTokens()
```



*No tokens array provided as argument.0xdf957883*


### NotEnoughTokens

```solidity
error NotEnoughTokens()
```



*Not enough token remaining on deposit.0x22bbb43c*


### NotExpired

```solidity
error NotExpired()
```



*Lock not expired or already released.Another lock with same ID is not expired yet.0xd0404f85*


### OnlySeller

```solidity
error OnlySeller()
```



*Only seller could call this function.`msg.sender` and the seller differ.0x85d1f726*


### TokenDenied

```solidity
error TokenDenied()
```



*Token address not allowed to be deposited.0x1578328e*


### TxAlreadyUsed

```solidity
error TxAlreadyUsed()
```



*Transaction already used to unlock payment.0xf490a6ea*



