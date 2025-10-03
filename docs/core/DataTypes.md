# Solidity API

## DataTypes

### Lock

```solidity
struct Lock {
  uint256 counter;
  uint256 expirationBlock;
  bytes32 pixTarget;
  uint80 amount;
  contract ERC20 token;
  address buyerAddress;
  address seller;
}
```

### LockStatus

```solidity
enum LockStatus {
  Inexistent,
  Active,
  Expired,
  Released
}
```

