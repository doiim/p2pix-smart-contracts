# Solidity API

## BaseUtils

### _setUsedTransactions

```solidity
function _setUsedTransactions(bytes32 message) internal
```

███ Helper FX ██████████████████████████████████████████████████████████

### usedTransactions

```solidity
function usedTransactions(bytes32 message) public view returns (bool used)
```

### _signerCheck

```solidity
function _signerCheck(bytes32 _message, bytes _signature) internal view
```

### _merkleVerify

```solidity
function _merkleVerify(bytes32[] _merkleProof, bytes32 _root, address _addr) internal pure
```

### _castBool

```solidity
function _castBool(bool _valid) internal pure returns (uint256 _validCasted)
```

### getStr

```solidity
function getStr(string str) public pure returns (bytes32 strEnc)
```

### _setSellerBalance

```solidity
function _setSellerBalance(address _sellerKey, contract ERC20 _erc20, uint256 _packed, bytes32 _pixTarget) internal
```

### _setValidState

```solidity
function _setValidState(address _sellerKey, contract ERC20 _erc20, uint256 _packed) internal
```

### _addSellerBalance

```solidity
function _addSellerBalance(address _sellerKey, contract ERC20 _erc20, uint256 _amount) internal
```

### _decSellerBalance

```solidity
function _decSellerBalance(address _sellerKey, contract ERC20 _erc20, uint256 _amount) internal
```

### __sellerBalance

```solidity
function __sellerBalance(address _sellerKey, contract ERC20 _erc20) internal view returns (uint256 _packed)
```

### _castAddrToKey

```solidity
function _castAddrToKey(address _addr) public pure returns (uint256 _key)
```

Public method that handles `address`
to `uint256` safe type casting.

_Function sighash: 0x4b2ae980._

### _castKeyToAddr

```solidity
function _castKeyToAddr(uint256 _key) public pure returns (address _addr)
```

