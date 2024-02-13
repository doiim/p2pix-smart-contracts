// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import { ERC20 } from "contracts/lib/tokens/ERC20.sol";

library DataTypes {

    struct Lock {
        uint256 counter;
        uint256 expirationBlock;
        bytes32 pixTarget;
        uint80 amount;
        ERC20 token;
        address buyerAddress;
        address seller;
    }

    // prettier-ignore
    enum LockStatus {
        Inexistent,     // 0 := Uninitialized Lock.
        Active,         // 1 := Valid Lock.
        Expired,        // 2 := Expired Lock.
        Released        // 3 := Already released Lock.
    }
}
