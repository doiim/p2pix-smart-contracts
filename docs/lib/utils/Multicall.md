# Solidity API

## Multicall

Contract that batches view function calls and aggregates their results.

### CallFailed

```solidity
error CallFailed(string reason)
```

_0x_

### Call

```solidity
struct Call {
  address target;
  bytes callData;
}
```

### Result

```solidity
struct Result {
  bool success;
  bytes returnData;
}
```

### constructor

```solidity
constructor() public payable
```

### mtc1

```solidity
function mtc1(struct Multicall.Call[] calls) external returns (uint256, bytes[])
```

### mtc2

```solidity
function mtc2(struct Multicall.Call[] calls) external returns (uint256, bytes32, struct Multicall.Result[])
```

