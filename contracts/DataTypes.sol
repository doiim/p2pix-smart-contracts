// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

library DataTypes {
    struct Lock {
        uint256 sellerKey;
        uint256 counter;
        /// @dev If not paid at this block will be expired.
        uint256 expirationBlock;
        uint160 pixTarget;
        /// @dev Amount to be paid for relayer.
        uint80 relayerPremium;
        /// @dev Where the tokens are sent the when order gets validated.
        /// @dev Amount to be tranfered via PIX.
        uint80 amount;
        address buyerAddress;
        /// @dev Relayer address (msg.sender) that facilitated this transaction.
        /// @dev Relayer's target address that receives `relayerPremium` funds.
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
