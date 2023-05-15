// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import { ERC20 } from "../tokens/ERC20.sol";

contract MockToken is ERC20 {
    constructor(uint256 supply) ERC20("MockBRL", "MBRL", 18) {
        _mint(msg.sender, supply);
    }

    function mint(
        address[] memory to,
        uint256 value
    ) public virtual {
        uint256 len = to.length;
        uint256 j;
        while (j < len) {
            _mint(to[j], value);
            ++j;
        }
    }
}
