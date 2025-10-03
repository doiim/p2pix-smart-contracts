# Solidity API

## P2PIX

### lockCounter

```solidity
uint256 lockCounter
```

### mapLocks

```solidity
mapping(uint256 => struct DataTypes.Lock) mapLocks
```

_List of Locks._

### userRecord

```solidity
mapping(uint256 => uint256) userRecord
```

_Stores an relayer's last computed credit._

### constructor

```solidity
constructor(uint256 defaultBlocks, address[] validSigners, address _reputation, contract ERC20[] tokens, bool[] tokenStates) public payable
```

### deposit

```solidity
function deposit(string pixTarget, bytes32 allowlistRoot, contract ERC20 token, uint96 amount, bool valid) public
```

Creates a deposit order based on a seller's
offer of an amount of ERC20 tokens.
Seller needs to send his tokens to the P2PIX smart contract.

_Function sighash: 0x5e918943_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pixTarget | string | Pix key destination provided by the offer's seller. |
| allowlistRoot | bytes32 | Optional allow list merkleRoot update `bytes32` value. as the deposit identifier. |
| token | contract ERC20 |  |
| amount | uint96 |  |
| valid | bool |  |

### setValidState

```solidity
function setValidState(contract ERC20 token, bool state) public
```

Enables seller to invalidate future
locks made to his/her token offering order.
This function does not affect any ongoing active locks.

_Function sighash: 0x6d82d9e0_

### lock

```solidity
function lock(address seller, contract ERC20 token, uint80 amount, bytes32[] merkleProof, uint256[] expiredLocks) public returns (uint256 lockID)
```

Public method designed to lock an remaining amount of
the deposit order of a seller.
Transaction forwarding must leave `merkleProof` empty;
otherwise, the trustedForwarder must be previously added 
to a seller whitelist.
This method can be performed either by:
- An user allowed via the seller's allowlist;
- An user with enough userRecord to lock the wished amount;
There can only exist a lock per each `_amount` partitioned
from the total `remaining` value.
Locks can only be performed in valid orders.

_Function sighash: 0xdc43221c_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| seller | address |  |
| token | contract ERC20 |  |
| amount | uint80 | The deposit's remaining amount wished to be locked. |
| merkleProof | bytes32[] | Provided as a pass if the `msg.sender` is in the seller's allowlist; Left empty otherwise; |
| expiredLocks | uint256[] | An array of identifiers to be provided so to unexpire locks using this transaction gas push. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| lockID | uint256 | The lock identifier. |

### release

```solidity
function release(uint256 lockID, bytes32 pixTimestamp, bytes signature) public
```

Lock release method that liquidate lock
orders and distributes relayer fees.
This method can be called by any public actor
as long the signature provided is valid.
`relayerPremium` gets splitted equaly
if relayer addresses differ.
If the `msg.sender` of this method and `l.relayerAddress` are the same,
`msg.sender` accrues both l.amount and l.relayerPremium as userRecord credit.
 In case of they differing:
- `lock` caller gets accrued with `l.amount` as userRecord credit;
- `release` caller gets accrued with `l.relayerPremium` as userRecord credit;

_Function sighash: 0x11fc7f9a_

### unlockExpired

```solidity
function unlockExpired(uint256[] lockIDs) public
```

Unlocks expired locks.
Triggered in the callgraph by both `lock` and `withdraw` functions.
This method can also have any public actor as its `tx.origin`.
For each successfull unexpired lock recovered,
`userRecord[_castAddrToKey(l.relayerAddress)]` is decreased by half of its value.

_Function sighash: 0xb0983d39_

### withdraw

```solidity
function withdraw(contract ERC20 token, uint256 amount, uint256[] expiredLocks) public
```

Seller's expired deposit fund sweeper.
A seller may use this method to recover
tokens from expired deposits.

_Function sighash: 0xfb8c5ef0_

### setRoot

```solidity
function setRoot(address addr, bytes32 merkleroot) public
```

### receive

```solidity
receive() external payable
```

### _addLock

```solidity
function _addLock(uint256 _bal, struct DataTypes.Lock _l) internal
```

### getBalance

```solidity
function getBalance(address seller, contract ERC20 token) public view returns (uint256 bal)
```

### getValid

```solidity
function getValid(address seller, contract ERC20 token) public view returns (bool valid)
```

### getPixTarget

```solidity
function getPixTarget(address seller, contract ERC20 token) public view returns (bytes32 pixTarget)
```

### getPixTargetString

```solidity
function getPixTargetString(address seller, contract ERC20 token) public view returns (string pixTarget)
```

### getBalances

```solidity
function getBalances(address[] sellers, contract ERC20 token) external view returns (uint256[])
```

### getLocksStatus

```solidity
function getLocksStatus(uint256[] ids) external view returns (uint256[], enum DataTypes.LockStatus[])
```

External getter that returns the status of a lockIDs array.
Call will not revert if provided with an empty array as parameter.

_Function sighash: 0x49ef8448_

