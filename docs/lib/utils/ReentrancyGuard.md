# Solidity API

## ReentrancyGuard

Reentrancy protection for smart contracts.

### Reentrancy

```solidity
error Reentrancy()
```

### nonReentrant

```solidity
modifier nonReentrant()
```

### setReentrancyGuard

```solidity
function setReentrancyGuard() internal virtual
```

_Check guard sentinel value and set it._

### clearReentrancyGuard

```solidity
function clearReentrancyGuard() internal virtual
```

_Unset sentinel value._

