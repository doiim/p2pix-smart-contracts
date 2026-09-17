// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { ERC2771 } from "./lib/metatx/ERC2771Context.sol";
import { ERC20, SafeTransferLib } from "./lib/utils/SafeTransferLib.sol";
import { IReputation } from "./lib/interfaces/IReputation.sol";
import { EventAndErrors } from "./EventAndErrors.sol";
import { Constants } from "./Constants.sol";
import { Owned } from "./lib/auth/Owned.sol";
import { DataTypes as DT } from "./DataTypes.sol";

abstract contract OwnerSettings is
    Constants,
    EventAndErrors,
    Owned(msg.sender),
    ERC2771
{
    /// ███ Storage ████████████████████████████████████████████████████████████

    IReputation public reputation;
    /// @dev Default blocks that lock will hold tokens.
    uint256 public defaultLockBlocks;
    /// @dev Primus attestors whose signature releases a lock.
    mapping(address => bool) public validAttestors;
    /// @dev The bank request a proof must have attested.
    DT.BankConfig public bank;
    /// @dev The prover's Primus task wallet: the only accepted proof recipient.
    address public prover;
    /// @dev Oldest attestation accepted, in milliseconds.
    uint256 public proofMaxAgeMs;

    /// ███ Constructor ████████████████████████████████████████████████████████

    constructor(
        uint256 defaultBlocks,
        address[] memory attestors,
        address _reputation,
        ERC20[] memory tokens,
        bool[] memory tokenStates,
        DT.BankConfig memory bankConfig,
        address _prover,
        uint256 maxAgeMs
    ) {
        setDefaultLockBlocks(defaultBlocks);
        setValidAttestors(
            attestors,
            _allTrue(attestors.length)
        );
        setReputation(IReputation(_reputation));
        tokenSettings(tokens, tokenStates);
        setBankConfig(bankConfig);
        setProver(_prover);
        setProofMaxAgeMs(maxAgeMs);
    }

    /// ███ Owner Only █████████████████████████████████████████████████████████

    function setTrustedFowarders(
        address[] memory forwarders,
        bool[] memory states
    ) external onlyOwner {
        assembly ("memory-safe") {
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
                mstore(0x20, trustedForwarders.slot)
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
        assembly ("memory-safe") {
            sstore(reputation.slot, _reputation)
        }
        emit ReputationUpdated(address(_reputation));
    }

    function setDefaultLockBlocks(
        uint256 _blocks
    ) public onlyOwner {
        assembly ("memory-safe") {
            sstore(defaultLockBlocks.slot, _blocks)
        }
        emit LockBlocksUpdated(_blocks);
    }

    /// @dev Adds or removes Primus attestors. Primus rotates and revokes node
    ///      keys, so removal must stay possible.
    function setValidAttestors(
        address[] memory attestors,
        bool[] memory states
    ) public onlyOwner {
        uint256 len = attestors.length;
        if (len == 0) revert NoAttestors();
        if (len != states.length) revert LengthMismatch();
        for (uint256 i; i < len; ++i) {
            if (attestors[i] == address(0))
                revert NoAttestors();
            validAttestors[attestors[i]] = states[i];
        }
        emit ValidAttestorsUpdated(attestors, states);
    }

    function setBankConfig(
        DT.BankConfig memory config
    ) public onlyOwner {
        bank = config;
        emit BankConfigUpdated();
    }

    function setProver(address _prover) public onlyOwner {
        prover = _prover;
        emit ProverUpdated(_prover);
    }

    function setProofMaxAgeMs(
        uint256 maxAgeMs
    ) public onlyOwner {
        proofMaxAgeMs = maxAgeMs;
        emit ProofMaxAgeUpdated(maxAgeMs);
    }

    function tokenSettings(
        ERC20[] memory _tokens,
        bool[] memory _states
    ) public onlyOwner {
        /* Yul Impl */
        assembly ("memory-safe") {
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

    function sellerAllowList(
        address sellerKey
    ) public view returns (bytes32 root) {
        assembly ("memory-safe") {
            mstore(0x0c, _SELLER_ALLOWLIST_SLOT_SEED)
            mstore(0x00, sellerKey)
            root := sload(keccak256(0x00, 0x20))
        }
    }

    function allowedERC20s(
        ERC20 erc20
    ) public view returns (bool state) {
        assembly ("memory-safe") {
            mstore(0x0c, _ALLOWED_ERC20_SLOT_SEED)
            mstore(0x00, erc20)
            state := sload(keccak256(0x0c, 0x20))
        }
    }

    function _allTrue(
        uint256 len
    ) private pure returns (bool[] memory states) {
        states = new bool[](len);
        for (uint256 i; i < len; ++i) states[i] = true;
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
        assembly ("memory-safe") {
            success := staticcall(
                // gas
                gas(),
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
