// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import { ERC20 } from "../tokens/ERC20.sol";

contract MockToken is ERC20 {
    constructor(uint256 supply) ERC20("MockBRL", "MBRL", 18) {
        _mint(msg.sender, supply);
    }
}
