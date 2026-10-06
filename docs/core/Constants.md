# Solidity API

## Constants

### _ROOT_UPDATED_EVENT_SIGNATURE

```solidity
uint256 _ROOT_UPDATED_EVENT_SIGNATURE
```

███ Constants ██████████████████████████████████████████████████████████

### _ALLOWED_ERC20_UPDATED_EVENT_SIGNATURE

```solidity
uint256 _ALLOWED_ERC20_UPDATED_EVENT_SIGNATURE
```

### _TRUSTED_FORWARDER_UPDATED_EVENT_SIGNATURE

```solidity
uint256 _TRUSTED_FORWARDER_UPDATED_EVENT_SIGNATURE
```

### _SELLER_ALLOWLIST_SLOT_SEED

```solidity
uint256 _SELLER_ALLOWLIST_SLOT_SEED
```

_Seller casted to key => Seller's allowlist merkleroot.
mapping(uint256 => bytes32) public sellerAllowList;_

### _ALLOWED_ERC20_SLOT_SEED

```solidity
uint256 _ALLOWED_ERC20_SLOT_SEED
```

_Tokens allowed to serve as the underlying amount of a deposit.
mapping(ERC20 => bool) public allowedERC20s;_

### _SELLER_BALANCE_SLOT_SEED

```solidity
uint256 _SELLER_BALANCE_SLOT_SEED
```

_Value in custom storage slot given by:
    mstore(0x20, token)
    mstore(0x0c, _SELLER_BALANCE_SLOT_SEED)
    mstore(0x00, seller)
    let value := sload(keccak256(0x0c, 0x34))._

### BITMASK_SB_ENTRY

```solidity
uint256 BITMASK_SB_ENTRY
```

_The bitmask of `sellerBalance` entry._

### BITPOS_VALID

```solidity
uint256 BITPOS_VALID
```

_The bit position of `valid` in `sellerBalance`._

### WAD

```solidity
uint256 WAD
```

_The scalar of BRZ token._

### MAXBALANCE_UPPERBOUND

```solidity
uint256 MAXBALANCE_UPPERBOUND
```

### REPUTATION_LOWERBOUND

```solidity
uint256 REPUTATION_LOWERBOUND
```

### LOCKAMOUNT_UPPERBOUND

```solidity
uint256 LOCKAMOUNT_UPPERBOUND
```

