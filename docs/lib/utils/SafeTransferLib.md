# Solidity API

## SafeTransferLib

Safe ETH and ERC20 transfer library that gracefully handles missing return values.

_Caution! This library won't check that a token has code, responsibility is delegated to the caller._

### ETHTransferFailed

```solidity
error ETHTransferFailed()
```

_The ETH transfer has failed._

### TransferFromFailed

```solidity
error TransferFromFailed()
```

_The ERC20 `transferFrom` has failed._

### TransferFailed

```solidity
error TransferFailed()
```

_The ERC20 `transfer` has failed._

### safeTransferETH

```solidity
function safeTransferETH(address to, uint256 amount) internal
```

_Sends `amount` (in wei) ETH to `to`.
Reverts upon failure._

### safeTransferFrom

```solidity
function safeTransferFrom(contract ERC20 token, address from, address to, uint256 amount) internal
```

_Sends `amount` of ERC20 `token` from `from` to `to`.
Reverts upon failure.

The `from` account must have at least `amount` approved for
the current contract to manage._

### safeTransfer

```solidity
function safeTransfer(contract ERC20 token, address to, uint256 amount) internal
```

_Sends `amount` of ERC20 `token` from the current contract to `to`.
Reverts upon failure._

