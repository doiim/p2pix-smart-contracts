// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import { ERC20 } from "contracts/lib/tokens/ERC20.sol";

library DataTypes {
    struct DepositArgs {
        string pixTarget;
        bytes32 allowlistRoot;
        ERC20 token;
        uint96 amount;
        bool valid;
    }

    struct LockArgs {
        address seller;
        ERC20 token;
        uint80 amount;
        bytes32[] merkleProof;
        uint256[] expiredLocks;
    }

    struct ReleaseArgs {
        uint256 lockID;
        bytes32 pixTimestamp;
        bytes signature;
    }

    struct Lock {
        uint256 counter;
        uint256 expirationBlock;
        bytes32 pixTarget;
        uint80 amount;
        address token;
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
