# Solidity API

## Owned

Simple single owner authorization mixin.

### Unauthorized

```solidity
error Unauthorized()
```

### OwnerUpdated

```solidity
event OwnerUpdated(address user, address newOwner)
```

### owner

```solidity
address owner
```

### onlyOwner

```solidity
modifier onlyOwner()
```

### constructor

```solidity
constructor(address _owner) internal
```

### setOwner

```solidity
function setOwner(address newOwner) public virtual
```

