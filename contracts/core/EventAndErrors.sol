// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// prettier-ignore
interface EventAndErrors {
    /// ███ Events ████████████████████████████████████████████████████████████

    /// @dev 0x63d8d7d5e63e9840ec91a12a160d27b7cfab294f6ba070b7359692acfe6b03bf
    event DepositAdded(
        address indexed seller,
        // uint256 depositID,
        ERC20 token,
        uint256 amount
    );
    /// @dev 0xca585721b6b442dc9183932f7c84dc2880efb67c4da52cc06873e78971105d49
    event ValidSet(
        address indexed seller,
        ERC20 token,
        bool state
    );
    /// @dev 0x2cd6435b1b961c13f55202979edd0765a809f69a539d8a477436c94c1211e43e
    event DepositWithdrawn(
        address indexed seller,
        ERC20 token,
        uint256 amount
    );
    /// @dev 0x8fb3989f70bd172a37d15b41b015e48ea09d59329638377304a4198cd0c4ea65
    event LockAdded(
        address indexed buyer,
        uint256 indexed lockID,
        address seller,
        uint256 amount
    );
    /// @dev 0x364537f14276f2a0ce9905588413f96454cbb8fb2e4f5308389307c1098bede8
    event LockReleased(
        address indexed buyer, 
        uint256 lockId,
        uint256 amount
    );
    /// @dev 0x830501e61b8b075e170b22a430e39454bdb12ed3e9620e586430b6ac00079da5
    event LockReturned(
        address indexed buyer, 
        uint256 lockId
    );
    /// @dev 0xeaff4b37086828766ad3268786972c0cd24259d4c87a80f9d3963a3c3d999b0d
    event FundsWithdrawn(
        address owner, 
        uint256 amount
    );
    /// @dev 0x0b294da292f26e55fd442b5c0164fbb9013036ff00c5cfdde0efd01c1baaf632
    event RootUpdated(
        address indexed seller, 
        bytes32 indexed merkleRoot
    );
    /// @dev 0x5d6e86e5341d57a92c49934296c51542a25015c9b1782a1c2722a940131c3d9a
    event AllowedERC20Updated(
        address indexed token,
        bool indexed state
    );
    /// @dev 0xbee55516e29d3969d3cb8eb01351eb3c52d06f9e2435bd5a8bfe3647e185df92
    event TrustedForwarderUpdated(
        address indexed forwarder, 
        bool indexed state
    );
    /// @dev 0xe127cf589a3879da0156d4a24f43b44f65cfa3570de594806b0bfa2fcf06884f
    event ReputationUpdated(address reputation);
    /// @dev 0x70fa43ca70216ad905ade86b9e650a691b2ce5a01980d0a81bdd8324141b8511
    event LockBlocksUpdated(uint256 blocks);
    /// @dev 0x88eacf65f98d0f2ce681cef59c7714000cc73ff6897728296e721e86e9474148
    event ValidAttestorsUpdated(address[] attestors, bool[] states);
    /// @dev 0x6924242e554a57cb5f0c4a3b1bf49b3d3dc6f39ee392abd531bfe3cd562c746e
    event BankConfigUpdated();
    /// @dev 0x52dd1bef79b79f03d1c5c160b2d041c41b8578a23904fadc4aeae4c071b00f03
    event ProverUpdated(address prover);
    /// @dev 0xa02cd8b37653c4f468a2463047b342138ac24b48b418fa206ffa364208438e18
    event ProofMaxAgeUpdated(uint256 maxAgeMs);


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
    /// @dev The proof's signature does not recover an allowed Primus attestor.
    /// @dev 0xacec4753
    error InvalidAttestor();
    /// @dev The proof's recipient, conditions or algorithm are not the expected ones.
    /// @dev 0x09bde339
    error InvalidProof();
    /// @dev The proof's data cannot be read as the expected fields.
    /// @dev 0xf4ea0ab0
    error MalformedProof();
    /// @dev The bank does not report the charge as paid once, in full, unrefunded.
    /// @dev 0x34862073
    error PixNotPaid();
    /// @dev The charged amount differs from the lock's amount.
    /// @dev 0x55e97b0d
    error AmountMismatch();
    /// @dev The charge's payee is not the lock's pixTarget on this chain.
    /// @dev 0xf524f90a
    error PixTargetMismatch();
    /// @dev The charge's reconciliation code names another lock.
    /// @dev 0x459808cf
    error LockMismatch();
    /// @dev The proof is older than `proofMaxAgeMs` or dated in the future.
    /// @dev 0xb67a7713
    error ProofExpired();
    /// @dev Lock amounts must be whole centavos.
    /// @dev 0xd589c94e
    error AmountNotCentavo();
    /// @dev No attestor addresses provided as argument.
    /// @dev 0x87a15126
    error NoAttestors();
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
