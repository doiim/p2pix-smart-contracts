// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import { ERC20, OwnerSettings } from "contracts/core/OwnerSettings.sol";

import { ECDSA } from "contracts/lib/utils/ECDSA.sol";
import { MerkleProofLib as Merkle } from "contracts/lib/utils/MerkleProofLib.sol";
import { ReentrancyGuard } from "contracts/lib/utils/ReentrancyGuard.sol";

abstract contract BaseUtils is
    OwnerSettings,
    ReentrancyGuard
{
    /// ███ Storage ████████████████████████████████████████████████████████████

    /// @dev List of Pix transactions already signed.
    ///     mapping(bytes32 => bool) public usedTransactions;
    /// @dev Value in custom storage slot given by:
    ///     let value := sload(bytes32).

    /// ███ Helper FX ██████████████████████████████████████████████████████████
    function _setUsedTransactions(bytes32 message) internal {
        assembly {
            sstore(message, true)
        }
    }

    function usedTransactions(
        bytes32 message
    ) public view returns (bool used) {
        assembly {
            used := sload(message)
        }
    }

    function _signerCheck(
        bytes32 _message,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
    ) internal view {
        if (usedTransactions(_message))
            revert TxAlreadyUsed();

        if (
            !validBacenSigners(
                _castAddrToKey(
                    ECDSA.recover(
                        ECDSA.toEthSignedMessageHash(
                            _message
                        ),
                        _v,
                        _r,
                        _s
                    )
                )
            )
        ) revert InvalidSigner();
    }

    function _merkleVerify(
        bytes32[] calldata _merkleProof,
        bytes32 _root,
        address _addr
    ) internal pure {
        if (
            !Merkle.verify(
                _merkleProof,
                _root,
                bytes32(uint256(uint160(_addr)))
            )
        ) revert AddressDenied();
    }

    function _castBool(
        bool _valid
    ) internal pure returns (uint256 _validCasted) {
        assembly {
            _validCasted := _valid
        }
    }

    function getStr(
        string memory str
    ) public pure returns (bytes32 strEnc) {
        bytes memory enc = bytes(abi.encodePacked(str));
        assembly {
            if lt(0x20, mload(enc)) {
                invalid()
            }
            strEnc := mload(add(enc, 0x20))
        }
    }

    function _setSellerBalance(
        address _sellerKey,
        ERC20 _erc20,
        uint256 _packed,
        bytes32 _pixTarget
    ) internal {
        assembly {
            mstore(0x20, _erc20)
            mstore(0x0c, _SELLER_BALANCE_SLOT_SEED)
            mstore(0x00, _sellerKey)
            let _loc := keccak256(0x0c, 0x34)
            sstore(add(_loc, 0x01), _packed)
            sstore(_loc, _pixTarget)
        }
    }

    function _setValidState(
        address _sellerKey,
        ERC20 _erc20,
        uint256 _packed
    ) internal {
        assembly {
            mstore(0x20, _erc20)
            mstore(0x0c, _SELLER_BALANCE_SLOT_SEED)
            mstore(0x00, _sellerKey)
            let _loc := keccak256(0x0c, 0x34)
            sstore(add(_loc, 0x01), _packed)
        }
    }

    function _addSellerBalance(
        address _sellerKey,
        ERC20 _erc20,
        uint256 _amount
    ) internal {
        assembly {
            mstore(0x20, _erc20)
            mstore(0x0c, _SELLER_BALANCE_SLOT_SEED)
            mstore(0x00, _sellerKey)
            let _loc := add(keccak256(0x0c, 0x34), 0x01)
            sstore(_loc, add(sload(_loc), _amount))
        }
    }

    function _decSellerBalance(
        address _sellerKey,
        ERC20 _erc20,
        uint256 _amount
    ) internal {
        assembly {
            mstore(0x20, _erc20)
            mstore(0x0c, _SELLER_BALANCE_SLOT_SEED)
            mstore(0x00, _sellerKey)
            let _loc := add(keccak256(0x0c, 0x34), 0x01)
            sstore(_loc, sub(sload(_loc), _amount))
        }
    }

    function __sellerBalance(
        address _sellerKey,
        ERC20 _erc20
    ) internal view returns (uint256 _packed) {
        assembly {
            mstore(0x20, _erc20)
            mstore(0x0c, _SELLER_BALANCE_SLOT_SEED)
            mstore(0x00, _sellerKey)
            _packed := sload(add(keccak256(0x0c, 0x34), 0x01))
        }
    }

    /// @notice Public method that handles `address`
    /// to `uint256` safe type casting.
    /// @dev Function sighash: 0x4b2ae980.
    function _castAddrToKey(
        address _addr
    ) public pure returns (uint256 _key) {
        // _key = uint256(uint160(address(_addr))) << 12;
        assembly {
            _key := shl(0xc, _addr)
        }
    }

    function _castKeyToAddr(
        uint256 _key
    ) public pure returns (address _addr) {
        // _addr = address(uint160(uint256(_key >> 12)));
        assembly {
            _addr := shr(0xc, _key)
        }
    }
}
