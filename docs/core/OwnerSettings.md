# Solidity API

## OwnerSettings

### reputation

```solidity
contract IReputation reputation
```

_List of valid Bacen signature addresses
    mapping(uint256 => bool) public validBacenSigners;
Value in custom storage slot given by:
    let value := sload(shl(12, address))._

### defaultLockBlocks

```solidity
uint256 defaultLockBlocks
```

_Default blocks that lock will hold tokens._

### constructor

```solidity
constructor(uint256 defaultBlocks, address[] validSigners, address _reputation, contract ERC20[] tokens, bool[] tokenStates) internal
```

███ Constructor ████████████████████████████████████████████████████████

### setTrustedFowarders

```solidity
function setTrustedFowarders(address[] forwarders, bool[] states) external
```

███ Owner Only █████████████████████████████████████████████████████████

### withdrawBalance

```solidity
function withdrawBalance() external
```

_Contract's underlying balance withdraw method.
Function sighash: 0x5fd8c710._

### setReputation

```solidity
function setReputation(contract IReputation _reputation) public
```

### setDefaultLockBlocks

```solidity
function setDefaultLockBlocks(uint256 _blocks) public
```

### setValidSigners

```solidity
function setValidSigners(address[] _validSigners) public
```

### tokenSettings

```solidity
function tokenSettings(contract ERC20[] _tokens, bool[] _states) public
```

### validBacenSigners

```solidity
function validBacenSigners(uint256 signer) public view returns (bool valid)
```

███ View FX ████████████████████████████████████████████████████████████

### sellerAllowList

```solidity
function sellerAllowList(address sellerKey) public view returns (bytes32 root)
```

### allowedERC20s

```solidity
function allowedERC20s(contract ERC20 erc20) public view returns (bool state)
```

### _limiter

```solidity
function _limiter(uint256 _userCredit) internal view returns (uint256 _spendLimit)
```

