# Solidity API

## ERC20

Modern and gas efficient ERC20 + EIP-2612 implementation.

_Do not manually set balances without updating totalSupply, as the sum of all user balances must not exceed it._

### Transfer

```solidity
event Transfer(address from, address to, uint256 amount)
```

### Approval

```solidity
event Approval(address owner, address spender, uint256 amount)
```

### name

```solidity
string name
```

### symbol

```solidity
string symbol
```

### decimals

```solidity
uint8 decimals
```

### totalSupply

```solidity
uint256 totalSupply
```

### balanceOf

```solidity
mapping(address => uint256) balanceOf
```

### allowance

```solidity
mapping(address => mapping(address => uint256)) allowance
```

### INITIAL_CHAIN_ID

```solidity
uint256 INITIAL_CHAIN_ID
```

### INITIAL_DOMAIN_SEPARATOR

```solidity
bytes32 INITIAL_DOMAIN_SEPARATOR
```

### nonces

```solidity
mapping(address => uint256) nonces
```

### constructor

```solidity
constructor(string _name, string _symbol, uint8 _decimals) internal
```

### approve

```solidity
function approve(address spender, uint256 amount) public virtual returns (bool)
```

### transfer

```solidity
function transfer(address to, uint256 amount) public virtual returns (bool)
```

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 amount) public virtual returns (bool)
```

### permit

```solidity
function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public virtual
```

### DOMAIN_SEPARATOR

```solidity
function DOMAIN_SEPARATOR() public view virtual returns (bytes32)
```

### computeDomainSeparator

```solidity
function computeDomainSeparator() internal view virtual returns (bytes32)
```

### _mint

```solidity
function _mint(address to, uint256 amount) internal virtual
```

### _burn

```solidity
function _burn(address from, uint256 amount) internal virtual
```

