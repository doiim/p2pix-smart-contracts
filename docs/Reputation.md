# Reputation

## Methods

### limiter

```solidity
function limiter(uint256 _userCredit) external pure returns (uint256 _spendLimit)
```

#### Parameters

| Name         | Type    | Description |
| ------------ | ------- | ----------- |
| \_userCredit | uint256 | undefined   |

#### Returns

| Name         | Type    | Description |
| ------------ | ------- | ----------- |
| \_spendLimit | uint256 | undefined   |

### magicValue

```solidity
function magicValue() external view returns (uint256)
```

_Denominator&#39;s constant operand for the `limiter` fx. _

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### maxLimit

```solidity
function maxLimit() external view returns (uint256)
```

_Asymptote numerator constant value for the `limiter` fx._

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### owner

```solidity
function owner() external view returns (address)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### setOwner

```solidity
function setOwner(address newOwner) external nonpayable
```

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| newOwner | address | undefined   |

## Events

### OwnerUpdated

```solidity
event OwnerUpdated(address indexed user, address indexed newOwner)
```

#### Parameters

| Name               | Type    | Description |
| ------------------ | ------- | ----------- |
| user `indexed`     | address | undefined   |
| newOwner `indexed` | address | undefined   |
