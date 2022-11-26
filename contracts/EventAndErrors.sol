// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface EventAndErrors {

    /// ███ Events ████████████████████████████████████████████████████████████

    event DepositAdded(
        address indexed seller,
        uint256 depositID,
        address token,
        uint256 amount
    );
    event DepositClosed(
        address indexed seller,
        uint256 depositID
    );
    event DepositWithdrawn(
        address indexed seller,
        uint256 depositID,
        uint256 amount
    );
    event LockAdded(
        address indexed buyer,
        bytes32 indexed lockID,
        uint256 depositID,
        uint256 amount
    );
    event LockReleased(
        address indexed buyer, 
        bytes32 lockId
    );
    event LockReturned(
        address indexed buyer, 
        bytes32 lockId
    );
    event FundsWithdrawn(
        address owner, 
        uint256 amount
    );

    /// ███ Errors ████████████████████████████████████████████████████████████

    /// @dev Deposit already exist and it is still valid.
    /// @dev 0xc44bd765
    error DepositAlreadyExists();
    /// @dev Only seller could call this function.
    /// @dev 0x85d1f726
    error OnlySeller();
    /// @dev Lock not expired or already released.
    /// @dev Another lock with same ID is not expired yet.
    /// @dev 0xd0404f85
    error NotExpired();
    /// @dev Loop bounds have overflowed.
    /// @dev 0xdfb035c9
    error LoopOverflow();
    /// @dev Deposit not valid anymore.
    /// @dev 0xb2e532de
    error InvalidDeposit();
    /// @dev Not enough token remaining on deposit.
    /// @dev 0x22bbb43c
    error NotEnoughTokens();
    /// @dev Lock already released or returned.
    /// @dev 0x63b4904e
    error AlreadyReleased();
    /// @dev Transaction already used to unlock payment.
    /// @dev 0xf490a6ea
    error TxAlreadyUsed();
    /// @dev Signer is not a valid signer.
    /// @dev 0x815e1d64
    error InvalidSigner();
}
