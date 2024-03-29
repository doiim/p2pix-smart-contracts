// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

library DataTypes {
    struct Lock {
        uint256 sellerKey;
        uint256 counter;
        /// @dev Amount to be paid for relayer.
        uint256 relayerPremium;
        /// @dev Amount to be tranfered via PIX.
        uint256 amount;
        /// @dev If not paid at this block will be expired.
        uint256 expirationBlock;
        uint160 pixTarget;
        /// @dev Where the tokens are sent the when order gets validated.
        address buyerAddress;
        /// @dev Relayer's target address that receives `relayerPremium` funds.
        address relayerTarget;
        /// @dev Relayer address (msg.sender) that facilitated this transaction.
        /// @dev Reputation points accruer.
        address relayerAddress;
        address token;
    }

    // prettier-ignore
    enum LockStatus {
        Inexistent,     // 0 := Uninitialized Lock.
        Active,         // 1 := Valid Lock.
        Expired,        // 2 := Expired Lock.
        Released        // 3 := Already released Lock.
    }
}
