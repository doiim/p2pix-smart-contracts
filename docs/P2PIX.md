# P2PIX

## Methods

### \_castAddrToKey

```solidity
function _castAddrToKey(address _addr) external pure returns (uint256 _key)
```

Public method that handles `address` to `uint256` safe type casting.

_Function sighash: 0x4b2ae980._

#### Parameters

| Name   | Type    | Description |
| ------ | ------- | ----------- |
| \_addr | address | undefined   |

#### Returns

| Name  | Type    | Description |
| ----- | ------- | ----------- |
| \_key | uint256 | undefined   |

### allowedERC20s

```solidity
function allowedERC20s(contract ERC20) external view returns (bool)
```

_Tokens allowed to serve as the underlying amount of a deposit._

#### Parameters

| Name | Type           | Description |
| ---- | -------------- | ----------- |
| \_0  | contract ERC20 | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### cancelDeposit

```solidity
function cancelDeposit(uint256 depositID) external nonpayable
```

Enables seller to invalidate future locks made to his/her token offering order.

_This function does not affect any ongoing active locks.Function sighash: 0x72fada5c._

#### Parameters

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| depositID | uint256 | undefined   |

### defaultLockBlocks

```solidity
function defaultLockBlocks() external view returns (uint256)
```

_Default blocks that lock will hold tokens._

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### deposit

```solidity
function deposit(address _token, uint256 _amount, string _pixTarget, bytes32 allowlistRoot) external nonpayable returns (uint256 depositID)
```

Creates a deposit order based on a seller&#39;s offer of an amount of ERC20 tokens.

_Seller needs to send his tokens to the P2PIX smart contract.Function sighash: 0xbfe07da6._

#### Parameters

| Name          | Type    | Description                                             |
| ------------- | ------- | ------------------------------------------------------- |
| \_token       | address | undefined                                               |
| \_amount      | uint256 | undefined                                               |
| \_pixTarget   | string  | Pix key destination provided by the offer&#39;s seller. |
| allowlistRoot | bytes32 | Optional allow list merkleRoot update `bytes32` value.  |

#### Returns

| Name      | Type    | Description                                                    |
| --------- | ------- | -------------------------------------------------------------- |
| depositID | uint256 | The `uint256` return value provided as the deposit identifier. |

### depositCount

```solidity
function depositCount() external view returns (uint256 _val)
```

#### Returns

| Name  | Type    | Description |
| ----- | ------- | ----------- |
| \_val | uint256 | undefined   |

### lock

```solidity
function lock(uint256 _depositID, address _buyerAddress, address _relayerTarget, uint256 _relayerPremium, uint256 _amount, bytes32[] merkleProof, bytes32[] expiredLocks) external nonpayable returns (bytes32 lockID)
```

Public method designed to lock an remaining amount of the deposit order of a seller.

_This method can be performed either by: - An user allowed via the seller&#39;s allowlist; - An user with enough userRecord to lock the wished amount; There can only exist a lock per each `_amount` partitioned from the total `remaining` value.Locks can only be performed in valid orders.Function sighash: 0x03aaf306._

#### Parameters

| Name             | Type      | Description                                                                                                              |
| ---------------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| \_depositID      | uint256   | undefined                                                                                                                |
| \_buyerAddress   | address   | The address of the buyer of a `_depositID`.                                                                              |
| \_relayerTarget  | address   | Target address entitled to the `relayerPremim`.                                                                          |
| \_relayerPremium | uint256   | The refund/premium owed to a relayer.                                                                                    |
| \_amount         | uint256   | The deposit&#39;s remaining amount wished to be locked.                                                                  |
| merkleProof      | bytes32[] | This value should be: - Provided as a pass if the `msg.sender` is in the seller&#39;s allowlist; - Left empty otherwise; |
| expiredLocks     | bytes32[] | An array of `bytes32` identifiers to be provided so to unexpire locks using this transaction gas push.                   |

#### Returns

| Name   | Type    | Description                                          |
| ------ | ------- | ---------------------------------------------------- |
| lockID | bytes32 | The `bytes32` value returned as the lock identifier. |

### mapDeposits

```solidity
function mapDeposits(uint256) external view returns (uint256 remaining, string pixTarget, address seller, address token, bool valid)
```

_Seller list of deposits_

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

#### Returns

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| remaining | uint256 | undefined   |
| pixTarget | string  | undefined   |
| seller    | address | undefined   |
| token     | address | undefined   |
| valid     | bool    | undefined   |

### mapLocks

```solidity
function mapLocks(bytes32) external view returns (uint256 depositID, uint256 relayerPremium, uint256 amount, uint256 expirationBlock, address buyerAddress, address relayerTarget, address relayerAddress)
```

_List of Locks._

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | bytes32 | undefined   |

#### Returns

| Name            | Type    | Description |
| --------------- | ------- | ----------- |
| depositID       | uint256 | undefined   |
| relayerPremium  | uint256 | undefined   |
| amount          | uint256 | undefined   |
| expirationBlock | uint256 | undefined   |
| buyerAddress    | address | undefined   |
| relayerTarget   | address | undefined   |
| relayerAddress  | address | undefined   |

### owner

```solidity
function owner() external view returns (address)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### release

```solidity
function release(bytes32 lockID, address _relayerTarget, uint256 pixTimestamp, bytes32 r, bytes32 s, uint8 v) external nonpayable
```

Lock release method that liquidate lock orders and distributes relayer fees.

_This method can be called by any public actor as long the signature provided is valid.`relayerPremium` gets splitted equaly if `relayerTarget` addresses differ.If the `msg.sender` of this method and `l.relayerAddress` are the same, `msg.sender` accrues both l.amount and l.relayerPremium as userRecord credit. In case of they differing: - `lock` caller gets accrued with `l.amount` as userRecord credit; - `release` caller gets accrued with `l.relayerPremium` as userRecord credit; Function sighash: 0x4e1389ed._

#### Parameters

| Name            | Type    | Description                                     |
| --------------- | ------- | ----------------------------------------------- |
| lockID          | bytes32 | undefined                                       |
| \_relayerTarget | address | Target address entitled to the `relayerPremim`. |
| pixTimestamp    | uint256 | undefined                                       |
| r               | bytes32 | undefined                                       |
| s               | bytes32 | undefined                                       |
| v               | uint8   | undefined                                       |

### reputation

```solidity
function reputation() external view returns (contract IReputation)
```

███ Storage ████████████████████████████████████████████████████████████

#### Returns

| Name | Type                 | Description |
| ---- | -------------------- | ----------- |
| \_0  | contract IReputation | undefined   |

### sellerAllowList

```solidity
function sellerAllowList(uint256) external view returns (bytes32)
```

_Seller casted to key =&gt; Seller&#39;s allowlist merkleroot._

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | bytes32 | undefined   |

### setDefaultLockBlocks

```solidity
function setDefaultLockBlocks(uint256 _blocks) external nonpayable
```

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| \_blocks | uint256 | undefined   |

### setOwner

```solidity
function setOwner(address newOwner) external nonpayable
```

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| newOwner | address | undefined   |

### setReputation

```solidity
function setReputation(contract IReputation _reputation) external nonpayable
```

#### Parameters

| Name         | Type                 | Description |
| ------------ | -------------------- | ----------- |
| \_reputation | contract IReputation | undefined   |

### setRoot

```solidity
function setRoot(address addr, bytes32 merkleroot) external nonpayable
```

#### Parameters

| Name       | Type    | Description |
| ---------- | ------- | ----------- |
| addr       | address | undefined   |
| merkleroot | bytes32 | undefined   |

### setValidSigners

```solidity
function setValidSigners(address[] _validSigners) external nonpayable
```

#### Parameters

| Name           | Type      | Description |
| -------------- | --------- | ----------- |
| \_validSigners | address[] | undefined   |

### tokenSettings

```solidity
function tokenSettings(address[] _tokens, bool[] _states) external nonpayable
```

#### Parameters

| Name     | Type      | Description |
| -------- | --------- | ----------- |
| \_tokens | address[] | undefined   |
| \_states | bool[]    | undefined   |

### unlockExpired

```solidity
function unlockExpired(bytes32[] lockIDs) external nonpayable
```

Unlocks expired locks.

_Triggered in the callgraph by both `lock` and `withdraw` functions.This method can also have any public actor as its `tx.origin`.For each successfull unexpired lock recovered, `userRecord[_castAddrToKey(l.relayerAddress)]` is decreased by half of its value.Function sighash: 0x8e2749d6._

#### Parameters

| Name    | Type      | Description |
| ------- | --------- | ----------- |
| lockIDs | bytes32[] | undefined   |

### userRecord

```solidity
function userRecord(uint256) external view returns (uint256)
```

_Stores an relayer&#39;s last computed credit._

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### validBacenSigners

```solidity
function validBacenSigners(uint256) external view returns (bool)
```

_List of valid Bacen signature addresses_

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### withdraw

```solidity
function withdraw(uint256 depositID, bytes32[] expiredLocks) external nonpayable
```

Seller&#39;s expired deposit fund sweeper.

_A seller may use this method to recover tokens from expired deposits.Function sighash: 0x36317972._

#### Parameters

| Name         | Type      | Description |
| ------------ | --------- | ----------- |
| depositID    | uint256   | undefined   |
| expiredLocks | bytes32[] | undefined   |

### withdrawBalance

```solidity
function withdrawBalance() external nonpayable
```

_Contract&#39;s underlying balance withdraw method.Function sighash: 0x5fd8c710._

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

### OwnerUpdated

```solidity
event OwnerUpdated(address indexed user, address indexed newOwner)
```

#### Parameters

| Name               | Type    | Description |
| ------------------ | ------- | ----------- |
| user `indexed`     | address | undefined   |
| newOwner `indexed` | address | undefined   |

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

### Reentrancy

```solidity
error Reentrancy()
```

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
