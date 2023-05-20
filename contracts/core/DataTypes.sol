// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

library DataTypes {
    struct Lock {
        uint80 amount;
        uint160 pixTarget;
        address token;
        /// @dev Amount to be tranfered via PIX.
        address buyerAddress;
        uint256 sellerKey;
        uint256 counter;
        /// @dev If not paid at this block will be expired.
        uint256 expirationBlock;
    }

    // prettier-ignore
    enum LockStatus {
        Inexistent,     // 0 := Uninitialized Lock.
        Active,         // 1 := Valid Lock.
        Expired,        // 2 := Expired Lock.
        Released        // 3 := Already released Lock.
    }
}
