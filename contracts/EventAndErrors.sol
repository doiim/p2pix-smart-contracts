// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

// prettier-ignore
interface EventAndErrors {
    /// ███ Events ████████████████████████████████████████████████████████████

    event DepositAdded(
        address indexed seller,
        // uint256 depositID,
        address token,
        uint256 amount
    );
    event ValidSet(
        address indexed seller,
        address token,
        bool state
    );
    event DepositWithdrawn(
        address indexed seller,
        address token,
        uint256 amount
    );
    event LockAdded(
        address indexed buyer,
        uint256 indexed lockID,
        uint256 seller,
        uint256 amount
    );
    event LockReleased(
        address indexed buyer, 
        uint256 lockId,
        uint256 amount
    );
    event LockReturned(
        address indexed buyer, 
        uint256 lockId
    );
    event FundsWithdrawn(
        address owner, 
        uint256 amount
    );
    event RootUpdated(
        address seller, 
        bytes32 merkleRoot
    );
    event AllowedERC20Updated(
        address indexed token,
        bool indexed state
    );
    event ReputationUpdated(address reputation);
    event LockBlocksUpdated(uint256 blocks);
    event ValidSignersUpdated(address[] signers);

    /// ███ Errors ████████████████████████████████████████████████████████████

    /// @dev Only seller could call this function.
    /// @dev `msg.sender` and the seller differ.
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
    /// @dev Address doesn't exist in a MerkleTree.
    /// @dev Address not allowed as relayer.
    /// @dev 0x3b8474be
    error AddressDenied();
    /// @dev Arrays' length don't match.
    /// @dev 0xff633a38
    error LengthMismatch();
    /// @dev No tokens array provided as argument.
    /// @dev 0xdf957883
    error NoTokens();
    /// @dev Token address not allowed to be deposited.
    /// @dev 0x1578328e
    error TokenDenied();
    /// @dev Wished amount to be locked exceeds the limit allowed.
    /// @dev 0x1c18f846
    error AmountNotAllowed();
    /// @dev Reverts when success return value returns false.
    /// @dev 0xe10bf1cc
    error StaticCallFailed();
    /// @dev Reverts on an expired lock.
    /// @dev 0xf6fafba0
    error LockExpired();
    /// @dev 0xce3a3d37
    error DecOverflow();
    /// @dev 0xf3fb0eb9
    error MaxBalExceeded();
    /// @dev 0x6a3bc53e
    error EmptyPixTarget();
    /// @dev 0x87138d5c
    error NotInitialized();
}
