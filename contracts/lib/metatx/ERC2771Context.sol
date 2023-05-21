// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4;

/// @author OpenZeppelin Contracts v4.4.1 (utils/Context.sol)
/// (https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Context.sol)

/// @dev Provides information about the current execution context, including the
/// sender of the transaction and its data. While these are generally available
/// via msg.sender and msg.data, they should not be accessed in such a direct
/// manner, since when dealing with meta-transactions the account sending and
/// paying for execution may not be the actual sender (as far as an application
/// is concerned).
///
/// This contract is only required for intermediate, library-like contracts.
abstract contract Context {
    function _msgSender()
        internal
        view
        virtual
        returns (address)
    {
        return msg.sender;
    }

    function _msgData()
        internal
        view
        virtual
        returns (bytes calldata)
    {
        return msg.data;
    }
}

/// @author Modified from OpenZeppelin Contracts (last updated v4.7.0) (metatx/ERC2771Context.sol)
/// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/metatx/ERC2771Context.sol

/// @dev Context variant with ERC2771 support.
abstract contract ERC2771Context is Context {
    // address private immutable _trustedForwarder;
    mapping(address => bool) public isTrustedForwarder;

    /// @custom:oz-upgrades-unsafe-allow constructor
    // constructor(address trustedForwarder) {
    //     _trustedForwarder = trustedForwarder;
    // }

    function _msgSender()
        internal
        view
        virtual
        override
        returns (address sender)
    {
        if (isTrustedForwarder[msg.sender]) {
            // The assembly code is more direct than the Solidity version using `abi.decode`.
            /// @solidity memory-safe-assembly
            assembly {
                sender := shr(
                    96,
                    calldataload(sub(calldatasize(), 20))
                )
            }
        } else {
            return super._msgSender();
        }
    }

    function _isTrustedForwarder()
        internal
        view
        returns (address _sender, uint256 _forwarder)
    {
        _sender = _msgSender();
        _forwarder = (_sender != msg.sender)
            ? uint256(1)
            : uint256(0);
    }

    function _msgData()
        internal
        view
        virtual
        override
        returns (bytes calldata)
    {
        if (isTrustedForwarder[msg.sender]) {
            return msg.data[:msg.data.length - 20];
        } else {
            return super._msgData();
        }
    }
}
