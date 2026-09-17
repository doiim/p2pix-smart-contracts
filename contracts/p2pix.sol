// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

///         ______         __
/// .-----.|__    |.-----.|__|.--.--.
/// |  _  ||    __||  _  ||  ||_   _|
/// |   __||______||   __||__||__.__|
/// |__|           |__|
///

import { OwnerSettings, ERC20, SafeTransferLib } from "./core/OwnerSettings.sol";
import { BaseUtils } from "./core/BaseUtils.sol";
import { DataTypes as DT } from "./core/DataTypes.sol";

contract P2PIX is BaseUtils {
    // solhint-disable use-forbidden-name
    // solhint-disable no-inline-assembly
    // solhint-disable no-empty-blocks

    using DT for DT.Lock;
    using DT for DT.LockStatus;

    uint256 public lockCounter;

    /// @dev List of Locks.
    mapping(uint256 => DT.Lock) public mapLocks;
    /// @dev Stores an relayer's last computed credit.
    mapping(uint256 => uint256) public userRecord;

    constructor(
        uint256 defaultBlocks,
        address[] memory attestors,
        address _reputation,
        ERC20[] memory tokens,
        bool[] memory tokenStates,
        DT.BankConfig memory bankConfig,
        address _prover,
        uint256 maxAgeMs
    )
        payable
        OwnerSettings(
            defaultBlocks,
            attestors,
            _reputation,
            tokens,
            tokenStates,
            bankConfig,
            _prover,
            maxAgeMs
        )
    {
        /*  */
    }

    /// @notice Creates a deposit order based on a seller's
    /// offer of an amount of ERC20 tokens.
    /// @notice Seller needs to send his tokens to the P2PIX smart contract.
    /// @param pixTarget Pix key destination provided by the offer's seller.
    /// @param allowlistRoot Optional allow list merkleRoot update `bytes32` value.
    /// as the deposit identifier.
    /// @dev Function sighash: 0x5e918943
    function deposit(
        string calldata pixTarget,
        bytes32 allowlistRoot,
        ERC20 token,
        uint96 amount,
        bool valid
    ) public nonReentrant {
        if (bytes(pixTarget).length == 0)
            revert EmptyPixTarget();
        if (!allowedERC20s(token)) revert TokenDenied();
        uint256 _sellerBalance = __sellerBalance(
            msg.sender,
            token
        );

        uint256 currBal = _sellerBalance & BITMASK_SB_ENTRY;
        uint256 _newBal = uint256(currBal + amount);
        if (_newBal > MAXBALANCE_UPPERBOUND)
            revert MaxBalExceeded();

        if (allowlistRoot != 0) {
            setRoot(msg.sender, allowlistRoot);
        }

        bytes32 pixTargetCasted = getStr(pixTarget);
        uint256 validCasted = _castBool(valid);

        _setSellerBalance(
            msg.sender,
            token,
            (_newBal | (validCasted << BITPOS_VALID)),
            pixTargetCasted
        );

        SafeTransferLib.safeTransferFrom(
            token,
            msg.sender,
            address(this),
            amount
        );

        emit DepositAdded(msg.sender, token, amount);
    }

    /// @notice Enables seller to invalidate future
    /// locks made to his/her token offering order.
    /// @notice This function does not affect any ongoing active locks.
    /// @dev Function sighash: 0x6d82d9e0
    function setValidState(ERC20 token, bool state) public {
        uint256 _sellerBalance = __sellerBalance(
            msg.sender,
            token
        );

        if (_sellerBalance != 0) {
            uint256 _valid = _castBool(state);

            _sellerBalance =
                (_sellerBalance & BITMASK_SB_ENTRY) |
                (_valid << BITPOS_VALID);

            _setValidState(msg.sender, token, _sellerBalance);

            emit ValidSet(msg.sender, token, state);
        } else revert NotInitialized();
    }

    /// @notice Public method designed to lock an remaining amount of
    /// the deposit order of a seller.
    /// @notice Transaction forwarding must leave `merkleProof` empty;
    /// otherwise, the trustedForwarder must be previously added
    /// to a seller whitelist.
    /// @notice This method can be performed either by:
    /// - An user allowed via the seller's allowlist;
    /// - An user with enough userRecord to lock the wished amount;
    /// @notice There can only exist a lock per each `amount` partitioned
    /// from the total `remaining` value.
    /// @notice Locks can only be performed in valid orders.
    /// @notice `amount` must be a whole number of centavos (a multiple of
    /// `CENTAVO`); reverts with `AmountNotCentavo` otherwise.
    /// @param amount The deposit's remaining amount wished to be locked.
    /// @param merkleProof Provided as a pass if the `msg.sender` is in the
    /// seller's allowlist; Left empty otherwise;
    /// @param expiredLocks An array of identifiers to be
    /// provided so to unexpire locks using this transaction gas push.
    /// @return lockID The lock identifier.
    /// @dev Function sighash: 0xdc43221c
    function lock(
        address seller,
        ERC20 token,
        uint80 amount,
        bytes32[] calldata merkleProof,
        uint256[] calldata expiredLocks
    ) public nonReentrant returns (uint256 lockID) {
        unlockExpired(expiredLocks);

        if (!getValid(seller, token)) revert InvalidDeposit();

        uint256 bal = getBalance(seller, token);
        if (bal < amount) revert NotEnoughTokens();

        unchecked {
            lockID = ++lockCounter;
        }

        if (mapLocks[lockID].expirationBlock >= block.number)
            revert NotExpired();

        bytes32 _pixTarget = getPixTarget(seller, token);

        // transaction forwarding must leave `merkleProof` empty;
        // otherwise, the trustedForwarder must be previously added
        // to a seller whitelist.
        if (merkleProof.length != 0) {
            _merkleVerify(
                merkleProof,
                sellerAllowList(seller),
                _msgSender()
            );
        } else if (
            amount > REPUTATION_LOWERBOUND &&
            msg.sender == _msgSender()
        ) {
            uint256 spendLimit;
            uint256 userCredit = userRecord[
                _castAddrToKey(_msgSender())
            ];
            (spendLimit) = _limiter(userCredit / WAD);
            if (
                amount > (spendLimit * WAD) ||
                amount > LOCKAMOUNT_UPPERBOUND
            ) revert AmountNotAllowed();
        }
        // The bank reports the paid amount with at most two decimals and
        // `release` requires it to equal `amount` exactly; a sub-centavo
        // lock could never be released and would sit until it expires.
        if (amount % CENTAVO != 0) revert AmountNotCentavo();

        DT.Lock memory l = DT.Lock(
            lockID,
            (block.number + defaultLockBlocks),
            _pixTarget,
            amount,
            token,
            _msgSender(),
            seller
        );

        _addLock(bal, l);
    }

    /// @notice Lock release method that liquidate lock
    /// orders and distributes relayer fees.
    /// @notice This method can be called by any public actor
    /// as long as the proof of Pix payment is valid: a Primus
    /// attestation of the bank's own answer whose attestor is in
    /// `validAttestors` and whose fields name this lock, its amount
    /// and its pixTarget on this chain.
    /// @notice If the `msg.sender` of this method and `l.buyerAddress` are the same,
    /// `msg.sender` accrues l.amount as userRecord credit.
    ///  In case of they differing, both accrue half of it.
    function release(
        uint256 lockID,
        DT.PixProof calldata proof
    ) public nonReentrant {
        DT.Lock storage l = mapLocks[lockID];

        if (l.amount == 0) revert AlreadyReleased();
        if (l.expirationBlock < block.number)
            revert LockExpired();

        bytes32 message = _proofCheck(lockID, l, proof);
        if (usedTransactions(message)) revert TxAlreadyUsed();

        ERC20 t = ERC20(l.token);

        // We cache lockAmount value before zeroing it out.
        uint256 lockAmount = l.amount;

        l.amount = 0;
        l.expirationBlock = 0;
        _setUsedTransactions(message);

        if (_msgSender() == msg.sender) {
            if (msg.sender != l.buyerAddress) {
                userRecord[
                    _castAddrToKey(msg.sender)
                ] += (lockAmount >> 1);
                userRecord[
                    _castAddrToKey(l.buyerAddress)
                ] += (lockAmount >> 1);
            } else {
                userRecord[
                    _castAddrToKey(msg.sender)
                ] += lockAmount;
            }
        }

        SafeTransferLib.safeTransfer(
            t,
            l.buyerAddress,
            lockAmount
        );

        emit LockReleased(l.buyerAddress, lockID, lockAmount);
    }

    /// @notice Unlocks expired locks.
    /// @notice Triggered in the callgraph by both `lock` and `withdraw` functions.
    /// @notice This method can also have any public actor as its `tx.origin`.
    /// @notice For each successfull unexpired lock recovered,
    /// `userRecord[_castAddrToKey(l.relayerAddress)]` is decreased by half of its value.
    /// @dev Function sighash: 0xb0983d39
    function unlockExpired(
        uint256[] calldata lockIDs
    ) public {
        uint256 i;
        uint256 locksSize = lockIDs.length;

        for (i; i < locksSize; ) {
            DT.Lock storage l = mapLocks[lockIDs[i]];

            _notExpired(l);

            uint256 _sellerBalance = __sellerBalance(
                l.seller,
                l.token
            ) & BITMASK_SB_ENTRY;

            if (
                (_sellerBalance + l.amount) >
                MAXBALANCE_UPPERBOUND
            ) revert MaxBalExceeded();

            _addSellerBalance(l.seller, l.token, l.amount);

            l.amount = 0;

            uint256 userKey = _castAddrToKey(l.buyerAddress);
            uint256 _newUserRecord = (userRecord[userKey] >>
                1);

            if (_newUserRecord <= REPUTATION_LOWERBOUND) {
                userRecord[userKey] = REPUTATION_LOWERBOUND;
            } else {
                userRecord[userKey] = _newUserRecord;
            }
            emit LockReturned(l.buyerAddress, lockIDs[i]);

            unchecked {
                ++i;
            }
        }

        assembly ("memory-safe") {
            if lt(i, locksSize) {
                // LoopOverflow()
                mstore(0x00, 0xdfb035c9)
                revert(0x1c, 0x04)
            }
        }
    }

    /// @notice Seller's expired deposit fund sweeper.
    /// @notice A seller may use this method to recover
    /// tokens from expired deposits.
    /// @dev Function sighash: 0xfb8c5ef0
    function withdraw(
        ERC20 token,
        uint256 amount,
        uint256[] calldata expiredLocks
    ) public nonReentrant {
        unlockExpired(expiredLocks);

        if (getValid(msg.sender, token))
            setValidState(token, false);

        _decBal(
            (__sellerBalance(msg.sender, token) &
                BITMASK_SB_ENTRY),
            amount,
            token,
            msg.sender
        );

        // safeTransfer tokens to seller
        SafeTransferLib.safeTransfer(
            token,
            msg.sender,
            amount
        );

        emit DepositWithdrawn(msg.sender, token, amount);
    }

    function setRoot(
        address addr,
        bytes32 merkleroot
    ) public {
        assembly ("memory-safe") {
            // if (addr != msg.sender)
            if iszero(eq(addr, caller())) {
                // revert OnlySeller()
                mstore(0x00, 0x85d1f726)
                revert(0x1c, 0x04)
            }
            // sets root to SellerAllowlist's storage slot
            mstore(0x0c, _SELLER_ALLOWLIST_SLOT_SEED)
            mstore(0x00, addr)
            sstore(keccak256(0x00, 0x20), merkleroot)

            // emit RootUpdated(addr, merkleroot);
            log3(
                0,
                0,
                _ROOT_UPDATED_EVENT_SIGNATURE,
                addr,
                merkleroot
            )
        }
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /// @notice Private view auxiliar logic that reverts
    /// on a not expired lock passed as argument of the function.
    /// @dev Called exclusively by the `unlockExpired` method.
    function _notExpired(DT.Lock storage _l) private view {
        if (_l.expirationBlock > block.number)
            revert NotExpired();
        if (_l.amount == 0) revert AlreadyReleased();
    }

    function _addLock(
        uint256 _bal,
        DT.Lock memory _l
    ) internal {
        mapLocks[_l.counter] = _l;

        _decBal(_bal, _l.amount, ERC20(_l.token), _l.seller);

        emit LockAdded(
            _l.buyerAddress,
            _l.counter,
            _l.seller,
            _l.amount
        );
    }

    function _decBal(
        uint256 _bal,
        uint256 _amount,
        ERC20 _t,
        address _k
    ) private {
        assembly ("memory-safe") {
            if iszero(
                iszero(
                    or(
                        iszero(_bal),
                        gt(sub(_bal, _amount), _bal)
                    )
                )
            ) {
                // DecOverflow()
                mstore(0x00, 0xce3a3d37)
                revert(0x1c, 0x04)
            }
        }

        // we can directly dec from packed uint entry value
        _decSellerBalance(_k, _t, _amount);
    }

    function getBalance(
        address seller,
        ERC20 token
    ) public view returns (uint256 bal) {
        assembly ("memory-safe") {
            for {
                /*  */
            } iszero(returndatasize()) {
                /*  */
            } {
                mstore(0x20, token)
                mstore(0x0c, _SELLER_BALANCE_SLOT_SEED)
                mstore(0x00, seller)
                bal := and(
                    BITMASK_SB_ENTRY,
                    sload(add(keccak256(0x0c, 0x34), 0x01))
                )
                break
            }
        }
    }

    function getValid(
        address seller,
        ERC20 token
    ) public view returns (bool valid) {
        assembly ("memory-safe") {
            for {
                /*  */
            } iszero(returndatasize()) {
                /*  */
            } {
                mstore(0x20, token)
                mstore(0x0c, _SELLER_BALANCE_SLOT_SEED)
                mstore(0x00, seller)
                valid := and(
                    BITMASK_SB_ENTRY,
                    shr(
                        BITPOS_VALID,
                        sload(
                            add(keccak256(0x0c, 0x34), 0x01)
                        )
                    )
                )
                break
            }
        }
    }

    function getPixTarget(
        address seller,
        ERC20 token
    ) public view returns (bytes32 pixTarget) {
        assembly ("memory-safe") {
            for {
                /*  */
            } iszero(returndatasize()) {
                /*  */
            } {
                mstore(0x20, token)
                mstore(0x0c, _SELLER_BALANCE_SLOT_SEED)
                mstore(0x00, seller)
                pixTarget := sload(keccak256(0x0c, 0x34))
                break
            }
        }
    }

    function getPixTargetString(
        address seller,
        ERC20 token
    ) public view returns (string memory pixTarget) {
        bytes32 _pixEnc = getPixTarget(seller, token);
        pixTarget = string(abi.encodePacked(_pixEnc));
    }

    function getBalances(
        address[] memory sellers,
        ERC20 token
    ) external view returns (uint256[] memory) {
        uint256 j;
        uint256 len = sellers.length;
        uint256[] memory balances = new uint256[](len);
        while (j < len) {
            uint256 bal = getBalance(sellers[j], token);
            balances[j] = bal;
            unchecked {
                ++j;
            }
        }

        return balances;
    }

    /// @notice External getter that returns the status of a lockIDs array.
    /// @notice Call will not revert if provided with an empty array as parameter.
    /// @dev Function sighash: 0x49ef8448
    function getLocksStatus(
        uint256[] memory ids
    )
        external
        view
        returns (uint256[] memory, DT.LockStatus[] memory)
    {
        if (ids.length == 0) {
            uint256[] memory null1 = new uint256[](0);
            DT.LockStatus[]
                memory null2 = new DT.LockStatus[](0);
            return (null1, null2);
        }

        uint256 c;
        uint256 len = ids.length;

        uint256[] memory sortedIDs = new uint256[](len);
        DT.LockStatus[] memory status = new DT.LockStatus[](
            len
        );
        unchecked {
            for (c; c < len; ) {
                if (mapLocks[ids[c]].seller == address(0)) {
                    sortedIDs[c] = ids[c];
                    status[c] = type(DT.LockStatus).min;
                    ++c;
                } else if (mapLocks[ids[c]].amount == 0x0) {
                    sortedIDs[c] = ids[c];
                    status[c] = type(DT.LockStatus).max;
                    ++c;
                } else if (
                    mapLocks[ids[c]].expirationBlock <
                    block.number
                ) {
                    sortedIDs[c] = ids[c];
                    status[c] = DT.LockStatus.Expired;
                    ++c;
                } else {
                    sortedIDs[c] = ids[c];
                    status[c] = DT.LockStatus.Active;
                    ++c;
                }
            }
        }
        return (sortedIDs, status);
    }
}
