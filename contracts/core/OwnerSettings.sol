// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import { ERC2771Context as ERC2771 } from "contracts/lib/metatx/ERC2771Context.sol";
import { ERC20, SafeTransferLib } from "contracts/lib/utils/SafeTransferLib.sol";
import { IReputation } from "contracts/lib/interfaces/IReputation.sol";
import { EventAndErrors } from "contracts/core/EventAndErrors.sol";
import { Constants } from "contracts/core/Constants.sol";
import { Owned } from "contracts/lib/auth/Owned.sol";

abstract contract OwnerSettings is
    Constants,
    EventAndErrors,
    Owned(msg.sender),
    ERC2771
{
    /// ███ Storage ████████████████████████████████████████████████████████████

    /// @dev List of valid Bacen signature addresses
    ///     mapping(uint256 => bool) public validBacenSigners;
    /// @dev Value in custom storage slot given by:
    ///     let value := sload(shl(12, address)).

    IReputation public reputation;
    /// @dev Default blocks that lock will hold tokens.
    uint256 public defaultLockBlocks;

    /// ███ Constructor ████████████████████████████████████████████████████████

    constructor(
        uint256 defaultBlocks,
        address[] memory validSigners,
        address _reputation,
        address[] memory tokens,
        bool[] memory tokenStates
    ) {
        setDefaultLockBlocks(defaultBlocks);
        setValidSigners(validSigners);
        setReputation(IReputation(_reputation));
        tokenSettings(tokens, tokenStates);
    }

    /// ███ Owner Only █████████████████████████████████████████████████████████

    function setTrustedFowarders(
        address[] memory forwarders,
        bool[] memory states
    ) external onlyOwner {
        assembly {
            // first 32 bytes eq to array's length
            let fLen := mload(forwarders)
            // halts execution if forwarders.length eq 0
            if iszero(fLen) {
                invalid()
            }
            // revert with `LengthMismatch()`
            if iszero(eq(fLen, mload(states))) {
                mstore(0x00, 0xff633a38)
                revert(0x1c, 0x04)
            }
            let fLoc := add(forwarders, 0x20)
            let sLoc := add(states, 0x20)
            for {
                let end := add(fLoc, shl(5, fLen))
            } iszero(eq(fLoc, end)) {
                fLoc := add(fLoc, 0x20)
                sLoc := add(sLoc, 0x20)
            } {
                // cache hashmap entry in scratch space
                mstore(0x20, isTrustedForwarder.slot)
                mstore(0x00, mload(fLoc))
                //  let mapSlot := keccak256(0x00, 0x40)
                sstore(keccak256(0x00, 0x40), mload(sLoc))

                // emit TrustedForwarderUpdated(address, bool)
                log3(
                    0,
                    0,
                    _TRUSTED_FORWARDER_UPDATED_EVENT_SIGNATURE,
                    mload(fLoc),
                    mload(sLoc)
                )
            }
        }
    }

    /// @dev Contract's underlying balance withdraw method.
    /// @dev Function sighash: 0x5fd8c710.
    function withdrawBalance() external onlyOwner {
        uint256 balance = address(this).balance;
        SafeTransferLib.safeTransferETH(msg.sender, balance);
        emit FundsWithdrawn(msg.sender, balance);
    }

    function setReputation(
        IReputation _reputation
    ) public onlyOwner {
        assembly {
            sstore(reputation.slot, _reputation)
        }
        emit ReputationUpdated(address(_reputation));
    }

    function setDefaultLockBlocks(
        uint256 _blocks
    ) public onlyOwner {
        assembly {
            sstore(defaultLockBlocks.slot, _blocks)
        }
        emit LockBlocksUpdated(_blocks);
    }

    function setValidSigners(
        address[] memory _validSigners
    ) public onlyOwner {
        assembly {
            let i := add(_validSigners, 0x20)
            let end := add(i, shl(0x05, mload(_validSigners)))
            for {
                /*  */
            } iszero(returndatasize()) {
                /*  */
            } {
                sstore(shl(0xc, mload(i)), true)
                i := add(i, 0x20)

                if iszero(lt(i, end)) {
                    break
                }
            }
        }
        emit ValidSignersUpdated(_validSigners);
    }

    function tokenSettings(
        address[] memory _tokens,
        bool[] memory _states
    ) public onlyOwner {
        /* Yul Impl */
        assembly {
            // first 32 bytes eq to array's length
            let tLen := mload(_tokens)
            // NoTokens()
            if iszero(tLen) {
                mstore(0x00, 0xdf957883)
                revert(0x1c, 0x04)
            }
            // LengthMismatch()
            if iszero(eq(tLen, mload(_states))) {
                mstore(0x00, 0xff633a38)
                revert(0x1c, 0x04)
            }
            let tLoc := add(_tokens, 0x20)
            let sLoc := add(_states, 0x20)
            for {
                let end := add(tLoc, shl(5, tLen))
            } iszero(eq(tLoc, end)) {
                tLoc := add(tLoc, 0x20)
                sLoc := add(sLoc, 0x20)
            } {
                // cache hashmap entry in scratch space
                mstore(0x0c, _ALLOWED_ERC20_SLOT_SEED)
                mstore(0x00, mload(tLoc))
                //  let mapSlot := keccak256(0x0c, 0x20)
                sstore(keccak256(0x0c, 0x20), mload(sLoc))

                // emit AllowedERC20Updated(address, bool)
                log3(
                    0,
                    0,
                    _ALLOWED_ERC20_UPDATED_EVENT_SIGNATURE,
                    mload(tLoc),
                    mload(sLoc)
                )
            }
        }
    }

    /// ███ View FX ████████████████████████████████████████████████████████████

    function validBacenSigners(
        uint256 signer
    ) public view returns (bool valid) {
        assembly {
            valid := sload(signer)
        }
    }

    function sellerAllowList(
        address sellerKey
    ) public view returns (bytes32 root) {
        assembly {
            mstore(0x0c, _SELLER_ALLOWLIST_SLOT_SEED)
            mstore(0x00, sellerKey)
            root := sload(keccak256(0x00, 0x20))
        }
    }

    function allowedERC20s(
        ERC20 erc20
    ) public view returns (bool state) {
        assembly {
            mstore(0x0c, _ALLOWED_ERC20_SLOT_SEED)
            mstore(0x00, erc20)
            state := sload(keccak256(0x0c, 0x20))
        }
    }

    function _limiter(
        uint256 _userCredit
    ) internal view returns (uint256 _spendLimit) {
        bytes memory encodedParams = abi.encodeWithSelector(
            // IReputation.limiter.selector,
            0x4d2b1791,
            _userCredit
        );
        bool success;
        assembly {
            success := staticcall(
                // gas
                0x7530,
                // address
                sload(reputation.slot),
                // argsOffset
                add(encodedParams, 0x20),
                // argsSize
                mload(encodedParams),
                // retOffset
                0x00,
                // retSize
                0x20
            )
            _spendLimit := mload(0x00)
            if iszero(success) {
                // StaticCallFailed()
                mstore(0x00, 0xe10bf1cc)
                revert(0x1c, 0x04)
            }
        }
    }
}
