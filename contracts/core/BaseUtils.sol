// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { ERC20, OwnerSettings } from "./OwnerSettings.sol";
import { DataTypes as DT } from "./DataTypes.sol";
import { JSONParserLib } from "./lib/utils/JSONParserLib.sol";
import { PixFields } from "./lib/utils/PixFields.sol";
import { PrimusAttestation } from "./lib/utils/PrimusAttestation.sol";

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MerkleProof as Merkle } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

abstract contract BaseUtils is
    OwnerSettings,
    ReentrancyGuard
{
    using JSONParserLib for JSONParserLib.Item;
    using JSONParserLib for string;
    using PixFields for bytes;

    /// ███ Storage ████████████████████████████████████████████████████████████

    /// @dev List of Pix transactions already used to release a lock.
    ///     mapping(bytes32 => bool) public usedTransactions;
    /// @dev Value in custom storage slot given by:
    ///     let value := sload(bytes32).

    bytes1 private constant QUOTE = 0x22; // `"`

    /// @dev `encodeResponse` of the resolves every proof must carry, in order.
    bytes32 internal immutable RESOLVES_HASH;

    constructor() {
        bytes memory packed;
        packed = _resolve(packed, KEY_AMOUNT, PATH_AMOUNT);
        packed = _resolve(packed, KEY_SETTLED, PATH_SETTLED);
        packed = _resolve(packed, KEY_PAYEE, PATH_PAYEE);
        packed = _resolve(packed, KEY_TXID, PATH_TXID);
        packed = _resolve(packed, KEY_LOCK, PATH_LOCK);
        RESOLVES_HASH = keccak256(packed);
    }

    /// @dev Appends one resolve as `encodeResponse` packs it.
    function _resolve(
        bytes memory acc,
        string memory key,
        string memory path
    ) private pure returns (bytes memory) {
        return abi.encodePacked(acc, key, PARSE_TYPE, path);
    }

    /// ███ Proof of Pix payment ███████████████████████████████████████████████

    function _digest(
        DT.PixProof calldata p
    ) internal view returns (bytes32) {
        string[] memory urls = new string[](1);
        urls[0] = string.concat(
            bank.solicitationUrlPrefix,
            Strings.toString(p.numeroSolicitacao),
            bank.solicitationUrlSuffix
        );
        return
            PrimusAttestation.digest(
                p.recipient,
                PrimusAttestation.requestHash(
                    urls,
                    REQUEST_HEADER,
                    REQUEST_METHOD,
                    REQUEST_BODY
                ),
                RESOLVES_HASH,
                p.data,
                p.attConditions,
                p.timestamp,
                p.additionParams
            );
    }

    /// @dev Verifies the proof against the lock; returns the key that marks
    ///      the Pix payment as used.
    function _proofCheck(
        uint256 lockID,
        DT.Lock storage lock_,
        DT.PixProof calldata p
    ) internal view returns (bytes32 txIdKey) {
        if (p.recipient != prover) revert InvalidProof();
        if (bytes(p.attConditions).length != 0)
            revert InvalidProof();
        _checkAlgorithm(p.additionParams);
        _checkFreshness(p.timestamp);

        JSONParserLib.Item memory root = p.data.parse();
        bytes memory payee = _field(root, KEY_PAYEE);
        if (!payee.isDigits(20)) revert MalformedProof();

        address signer = ECDSA.recoverCalldata(
            _digest(p),
            p.signature
        );
        if (signer != p.attestor || !validAttestors[signer])
            revert InvalidAttestor();

        _checkPayment(lock_, root);
        _checkTarget(lock_, payee);
        _checkLock(lockID, root);
        return keccak256(_field(root, KEY_TXID));
    }

    function _checkAlgorithm(
        string calldata additionParams
    ) private pure {
        JSONParserLib.Item memory item = additionParams
            .parse()
            .at(
                string(
                    abi.encodePacked(
                        QUOTE,
                        KEY_ALGORITHM,
                        QUOTE
                    )
                )
            );
        if (!item.isString()) revert InvalidProof();
        bytes memory algorithm = bytes(
            item.value().decodeString()
        );
        if (
            !algorithm.equals(ALGORITHM_PROXY) &&
            !algorithm.equals(ALGORITHM_MPC)
        ) revert InvalidProof();
    }

    function _checkFreshness(uint64 timestamp) private view {
        uint256 nowMs = block.timestamp * 1000;
        if (timestamp > nowMs + PROOF_FUTURE_TOLERANCE_MS)
            revert ProofExpired();
        if (
            timestamp < nowMs &&
            nowMs - timestamp > proofMaxAgeMs
        ) revert ProofExpired();
    }

    /// @dev The bank charged the lock's amount and reports it settled in full.
    function _checkPayment(
        DT.Lock storage lock_,
        JSONParserLib.Item memory root
    ) private view {
        (bool ok, uint256 amount) = _field(root, KEY_AMOUNT)
            .parseDecimal18();
        if (!ok) revert MalformedProof();
        if (amount != lock_.amount) revert AmountMismatch();
        uint256 settled;
        (ok, settled) = _field(root, KEY_SETTLED)
            .parseDecimal18();
        if (!ok) revert MalformedProof();
        if (settled < lock_.amount) revert PixNotPaid();
    }

    /// @dev The recipient is the lock's pixTarget on this chain.
    function _checkTarget(
        DT.Lock storage lock_,
        bytes memory payee
    ) private view {
        string memory target = string.concat(
            Strings.toString(block.chainid),
            "-",
            string(payee)
        );
        if (bytes(target).length > 32)
            revert MalformedProof();
        if (getStr(target) != lock_.pixTarget)
            revert PixTargetMismatch();
    }

    /// @dev The charge's reconciliation code names this lock on this chain.
    function _checkLock(
        uint256 lockID,
        JSONParserLib.Item memory root
    ) private view {
        string memory expected = string.concat(
            Strings.toString(block.chainid),
            "-",
            Strings.toString(lockID)
        );
        if (!_field(root, KEY_LOCK).equals(expected))
            revert LockMismatch();
    }

    function _field(
        JSONParserLib.Item memory root,
        string memory key
    ) private pure returns (bytes memory value) {
        bool ok;
        (ok, value) = PixFields.field(root, key);
        if (!ok) revert MalformedProof();
    }

    /// ███ Helper FX ██████████████████████████████████████████████████████████
    function _setUsedTransactions(bytes32 message) internal {
        assembly ("memory-safe") {
            sstore(message, true)
        }
    }

    function usedTransactions(
        bytes32 message
    ) public view returns (bool used) {
        assembly ("memory-safe") {
            used := sload(message)
        }
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
        assembly ("memory-safe") {
            _validCasted := _valid
        }
    }

    function getStr(
        string memory str
    ) public pure returns (bytes32 strEnc) {
        bytes memory enc = bytes(abi.encodePacked(str));
        assembly ("memory-safe") {
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
        assembly ("memory-safe") {
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
        assembly ("memory-safe") {
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
        assembly ("memory-safe") {
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
        assembly ("memory-safe") {
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
        assembly ("memory-safe") {
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
        assembly ("memory-safe") {
            _key := shl(0xc, _addr)
        }
    }

    function _castKeyToAddr(
        uint256 _key
    ) public pure returns (address _addr) {
        // _addr = address(uint160(uint256(_key >> 12)));
        assembly ("memory-safe") {
            _addr := shr(0xc, _key)
        }
    }
}
