# P2PIX









## Methods

### _castAddrToKey

```solidity
function _castAddrToKey(address _addr) external pure returns (uint256 _key)
```

Public method that handles `address`  to `uint256` safe type casting.

*Function sighash: 0x4b2ae980.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _addr | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _key | uint256 | undefined |

### cancelDeposit

```solidity
function cancelDeposit(uint256 depositID) external nonpayable
```

Enables seller to invalidate future  locks made to his/her token offering order.

*This function does not affect any ongoing active locks.Function sighash: 0x72fada5c.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| depositID | uint256 | undefined |

### defaultLockBlocks

```solidity
function defaultLockBlocks() external view returns (uint256)
```



*Default blocks that lock will hold tokens.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### deposit

```solidity
function deposit(address _token, uint256 _amount, string _pixTarget) external nonpayable returns (uint256 depositID)
```

Creates a deposit order based on a seller&#39;s  offer of an amount of ERC20 tokens.

*Seller needs to send his tokens to the P2PIX smart contract.Function sighash: 0xbfe07da6.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | undefined |
| _amount | uint256 | undefined |
| _pixTarget | string | Pix key destination provided by the offer&#39;s seller. |

#### Returns

| Name | Type | Description |
|---|---|---|
| depositID | uint256 | The `uint256` return value provided  as the deposit identifier.  |

### depositCount

```solidity
function depositCount() external view returns (uint256 _val)
```

███ Storage ████████████████████████████████████████████████████████████




#### Returns

| Name | Type | Description |
|---|---|---|
| _val | uint256 | undefined |

### lock

```solidity
function lock(uint256 _depositID, address _targetAddress, address _relayerAddress, uint256 _relayerPremium, uint256 _amount, bytes32[] expiredLocks) external nonpayable returns (bytes32 lockID)
```

Public method designed to lock an remaining amount of  the deposit order of a seller.     

*This method can be performed by either an order&#39;s seller, relayer, or buyer.There can only exist a lock per each `_amount` partitioned  from the total `remaining` value.Locks can only be performed in valid orders.Function sighash: 0x03aaf306.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _depositID | uint256 | undefined |
| _targetAddress | address | The address of the buyer of a `_depositID`. |
| _relayerAddress | address | The relayer&#39;s address. |
| _relayerPremium | uint256 | The refund/premium owed to a relayer. |
| _amount | uint256 | undefined |
| expiredLocks | bytes32[] | An array of `bytes32` identifiers to be  provided so to unexpire locks using this transaction gas push.  |

#### Returns

| Name | Type | Description |
|---|---|---|
| lockID | bytes32 | The `bytes32` value returned as the lock identifier. |

### mapDeposits

```solidity
function mapDeposits(uint256) external view returns (uint256 remaining, string pixTarget, address seller, address token, bool valid)
```



*Seller list of deposits*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| remaining | uint256 | undefined |
| pixTarget | string | undefined |
| seller | address | undefined |
| token | address | undefined |
| valid | bool | undefined |

### mapLocks

```solidity
function mapLocks(bytes32) external view returns (uint256 depositID, uint256 relayerPremium, uint256 amount, uint256 expirationBlock, address targetAddress, address relayerAddress)
```



*List of Locks.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| depositID | uint256 | undefined |
| relayerPremium | uint256 | undefined |
| amount | uint256 | undefined |
| expirationBlock | uint256 | undefined |
| targetAddress | address | undefined |
| relayerAddress | address | undefined |

### owner

```solidity
function owner() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### release

```solidity
function release(bytes32 lockID, uint256 pixTimestamp, bytes32 r, bytes32 s, uint8 v) external nonpayable
```



*This method can be called by either an  order&#39;s seller, relayer, or buyer.Function sighash: 0x4e1389ed.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| lockID | bytes32 | undefined |
| pixTimestamp | uint256 | undefined |
| r | bytes32 | undefined |
| s | bytes32 | undefined |
| v | uint8 | undefined |

### setOwner

```solidity
function setOwner(address newOwner) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

### unlockExpired

```solidity
function unlockExpired(bytes32[] lockIDs) external nonpayable
```

Unlocks expired locks.

*Triggered in the callgraph by both `lock` and `withdraw` functions.This method can also have any public actor as its `tx.origin`.Function sighash: 0x8e2749d6.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| lockIDs | bytes32[] | undefined |

### validBacenSigners

```solidity
function validBacenSigners(uint256) external view returns (bool)
```



*List of valid Bacen signature addresses*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### withdraw

```solidity
function withdraw(uint256 depositID, bytes32[] expiredLocks) external nonpayable
```

Seller&#39;s expired deposit fund sweeper.

*A seller may use this method to recover  tokens from expired deposits.Function sighash: 0x36317972.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| depositID | uint256 | undefined |
| expiredLocks | bytes32[] | undefined |

### withdrawBalance

```solidity
function withdrawBalance() external nonpayable
```



*Contract&#39;s balance withdraw method. Function sighash: 0x5fd8c710.*




## Events

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

### OwnerUpdated

```solidity
event OwnerUpdated(address indexed user, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |



## Errors

### AlreadyReleased

```solidity
error AlreadyReleased()
```



*Lock already released or returned.0x63b4904e*


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


### LoopOverflow

```solidity
error LoopOverflow()
```



*Loop bounds have overflowed.0xdfb035c9*


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



*Only seller could call this function.0x85d1f726*


### Reentrancy

```solidity
error Reentrancy()
```






### TxAlreadyUsed

```solidity
error TxAlreadyUsed()
```



*Transaction already used to unlock payment.0xf490a6ea*



