// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

abstract contract Constants {
    /// ███ Constants ██████████████████████████████████████████████████████████

    uint256 constant _ROOT_UPDATED_EVENT_SIGNATURE =
        0x0b294da292f26e55fd442b5c0164fbb9013036ff00c5cfdde0efd01c1baaf632;
    uint256 constant _ALLOWED_ERC20_UPDATED_EVENT_SIGNATURE =
        0x5d6e86e5341d57a92c49934296c51542a25015c9b1782a1c2722a940131c3d9a;
    uint256 constant _TRUSTED_FORWARDER_UPDATED_EVENT_SIGNATURE =
        0xbee55516e29d3969d3cb8eb01351eb3c52d06f9e2435bd5a8bfe3647e185df92;

    /// @dev Seller casted to key => Seller's allowlist merkleroot.
    /// mapping(uint256 => bytes32) public sellerAllowList;
    uint256 constant _SELLER_ALLOWLIST_SLOT_SEED = 0x74dfee70;
    /// @dev Tokens allowed to serve as the underlying amount of a deposit.
    /// mapping(ERC20 => bool) public allowedERC20s;
    uint256 constant _ALLOWED_ERC20_SLOT_SEED = 0xcbc9d1c4;

    /// @dev `balance` max. value = 10**26.
    /// @dev `pixTarget` keys are restricted to 160 bits.
    ///     mapping(uint256 => mapping(ERC20 => { `uint256`, `uint96` } )) public sellerBalance;

    /// @dev Bits layout:
    /// `bytes32` [0...255] := pixTarget
    /// `uint96`  [0...94]   := balance
    /// `bool`    [95]       := valid

    /// @dev Value in custom storage slot given by:
    ///     mstore(0x20, token)
    ///     mstore(0x0c, _SELLER_BALANCE_SLOT_SEED)
    ///     mstore(0x00, seller)
    ///     let value := sload(keccak256(0x0c, 0x34)).
    uint256 constant _SELLER_BALANCE_SLOT_SEED = 0x739094b1;

    /// @dev The bitmask of `sellerBalance` entry.
    uint256 constant BITMASK_SB_ENTRY = (1 << 94) - 1;
    /// @dev The bit position of `valid` in `sellerBalance`.
    uint256 constant BITPOS_VALID = 95;
    /// @dev The bitmask of all 256 bits of `sellerBalance` except for the last one.
    // uint256 constant BITMASK_VALID = (1 << 255) - 1;

    /// @dev The scalar of BRZ token.
    uint256 constant WAD = 1e18;
    uint256 constant MAXBALANCE_UPPERBOUND = 1e8 ether;
    uint256 constant REPUTATION_LOWERBOUND = 1e2 ether;
    uint256 constant LOCKAMOUNT_UPPERBOUND = 1e6 ether;
}
