# Solidity API

## Reputation

### maxLimit

```solidity
uint256 maxLimit
```

_Asymptote numerator constant value for the `limiter` fx._

### magicValue

```solidity
uint256 magicValue
```

_Denominator's constant operand for the `limiter` fx._

### constructor

```solidity
constructor() public payable
```

### limiter

```solidity
function limiter(uint256 _userCredit) external pure returns (uint256 _spendLimit)
```

### sqrt

```solidity
function sqrt(uint256 x) internal pure returns (uint256 z)
```

Taken from Solmate's FixedPointMathLib.
(https://github.com/transmissions11/solmate/blob/main/src/utils/FixedPointMathLib.sol)

