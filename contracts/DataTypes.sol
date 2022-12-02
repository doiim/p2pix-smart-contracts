// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

library DataTypes {
    struct Deposit {
        /// @dev Remaining tokens available.
        uint256 remaining;
        /// @dev The PIX account for the seller receive transactions.
        string pixTarget;
        address seller;
        /// @dev ERC20 stable token address.
        address token;
        /// @dev Could be invalidated by the seller.
        bool valid;
    }

    struct Lock {
        uint256 depositID;
        /// @dev Amount to be paid for relayer.
        uint256 relayerPremium; 
        /// @dev Amount to be tranfered via PIX.
        uint256 amount;  
        /// @dev If not paid at this block will be expired.
        uint256 expirationBlock; 
        /// @dev Where the tokens are sent the when order gets validated.
        address buyerAddress;
        /// @dev Relayer's target address that receives `relayerPremium` funds.
        address relayerTarget;
        /// @dev Relayer address (msg.sender) that facilitated this transaction.
        /// @dev Reputation points accruer.
        address relayerAddress;
    }
}
