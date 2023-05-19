// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import { OwnerSettings } from "./OwnerSettings.sol";
import { ECDSA } from "../lib/utils/ECDSA.sol";
import { MerkleProofLib as Merkle } from "../lib/utils/MerkleProofLib.sol";

abstract contract BaseUtils is OwnerSettings {
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

    function _castToUint(
        uint96 _amount,
        uint160 _pixTarget,
        bool _valid
    )
        internal
        pure
        returns (
            uint256 _amountCasted,
            uint256 _pixTargetCasted,
            uint256 _validCasted
        )
    {
        assembly {
            _amountCasted := _amount
            _pixTargetCasted := _pixTarget
            _validCasted := _valid
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
            _key := shl(12, _addr)
        }
    }

    function _castKeyToAddr(
        uint256 _key
    ) public pure returns (address _addr) {
        // _addr = address(uint160(uint256(_key >> 12)));
        assembly {
            _addr := shr(12, _key)
        }
    }
}
