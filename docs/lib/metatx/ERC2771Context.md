# Solidity API

## Context

_Provides information about the current execution context, including the
sender of the transaction and its data. While these are generally available
via msg.sender and msg.data, they should not be accessed in such a direct
manner, since when dealing with meta-transactions the account sending and
paying for execution may not be the actual sender (as far as an application
is concerned).

This contract is only required for intermediate, library-like contracts._

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

## ERC2771Context

_Context variant with ERC2771 support._

### trustedForwarders

```solidity
mapping(address => bool) trustedForwarders
```

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address sender)
```

### isTrustedForwarder

```solidity
function isTrustedForwarder(address forwarder) public view virtual returns (bool)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

