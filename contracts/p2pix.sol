// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

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

    /// ███ Storage ████████████████████████████████████████████████████████████

    uint256 public lockCounter;

    /// @dev List of Locks.
    mapping(uint256 => DT.Lock) public mapLocks;
    /// @dev Stores an relayer's last computed credit.
    mapping(uint256 => uint256) public userRecord;

    /// ███ Constructor ████████████████████████████████████████████████████████

    constructor(
        uint256 defaultBlocks,
        address[] memory validSigners,
        address _reputation,
        address[] memory tokens,
        bool[] memory tokenStates
    ) 
        OwnerSettings(
            defaultBlocks, 
            validSigners, 
            _reputation, 
            tokens, 
            tokenStates
        ) 
        payable {/*  */}

    /// ███ Public FX ██████████████████████████████████████████████████████████

    /// @notice Creates a deposit order based on a seller's
    /// offer of an amount of ERC20 tokens.
    /// @dev Seller needs to send his tokens to the P2PIX smart contract.
    /// @param _pixTarget Pix key destination provided by the offer's seller.
    /// @param allowlistRoot Optional allow list merkleRoot update `bytes32` value.
    /// as the deposit identifier.
    /// @dev Function sighash: 0xbfe07da6.
    function deposit(
        address _token,
        uint96 _amount,
        string memory _pixTarget,
        bool _valid,
        bytes32 allowlistRoot
    ) public {
        ERC20 t = ERC20(_token);
        uint256 k = _castAddrToKey(msg.sender);

        if (bytes(_pixTarget).length == 0) revert EmptyPixTarget();
        if (!allowedERC20s(t)) revert TokenDenied();
        uint256 _sellerBalance = __sellerBalance(k,t);

        uint256 currBal = _sellerBalance & BITMASK_SB_ENTRY;
        uint256 _newBal = uint256(currBal + _amount); 
        if (_newBal > MAXBALANCE_UPPERBOUND)
            revert MaxBalExceeded();

        setReentrancyGuard();

        if (allowlistRoot != 0) {
            setRoot(msg.sender, allowlistRoot);
        }

        bytes32 pixTargetCasted = getStr(_pixTarget);
        uint256 validCasted = _castBool(_valid);

        _setSellerBalance(
            k, 
            t, 
            (_newBal | (validCasted << BITPOS_VALID)),
            pixTargetCasted
        );

        SafeTransferLib.safeTransferFrom(
            t,
            msg.sender,
            address(this),
            _amount
        );

        clearReentrancyGuard();

        emit DepositAdded(msg.sender, _token, _amount);
    }

    /// @notice Enables seller to invalidate future
    /// locks made to his/her token offering order.
    /// @dev This function does not affect any ongoing active locks.
    /// @dev Function sighash: 0x72fada5c.
    function setValidState(ERC20 token, bool state) public {
        uint256 key = _castAddrToKey(msg.sender);
        uint256 _sellerBalance = __sellerBalance(key, token);

        if (_sellerBalance != 0) {
            uint256 _valid = _castBool(state);

            _sellerBalance =
                (_sellerBalance & BITMASK_SB_ENTRY) |
                (_valid << BITPOS_VALID);

            _setValidState(key, token, _sellerBalance);

            emit ValidSet(msg.sender, address(token), state);
        } else revert NotInitialized();
    }

    /// @notice Public method designed to lock an remaining amount of
    /// the deposit order of a seller.
    /// @dev This method can be performed either by:
    /// - An user allowed via the seller's allowlist;
    /// - An user with enough userRecord to lock the wished amount;
    /// @dev There can only exist a lock per each `_amount` partitioned
    /// from the total `remaining` value.
    /// @dev Locks can only be performed in valid orders.
    /// @param _amount The deposit's remaining amount wished to be locked.
    /// @param merkleProof This value should be:
    /// - Provided as a pass if the `msg.sender` is in the seller's allowlist;
    /// - Left empty otherwise;
    /// @param expiredLocks An array of `bytes32` identifiers to be
    /// provided so to unexpire locks using this transaction gas push.
    /// @return lockID The `bytes32` value returned as the lock identifier.
    /// @dev Function sighash: 0x03aaf306.
    function lock(
        address _seller,
        address _token,
        uint80 _amount,
        bytes32[] calldata merkleProof,
        uint256[] calldata expiredLocks
    ) public nonReentrant returns (uint256 lockID) {
        unlockExpired(expiredLocks);

        ERC20 t = ERC20(_token);
        if (!getValid(_seller, t)) revert InvalidDeposit();

        uint256 bal = getBalance(_seller, t);
        if (bal < _amount) revert NotEnoughTokens();

        uint256 k = _castAddrToKey(_seller);

        uint256 cCounter = lockCounter + 1;

        if (
            mapLocks[cCounter].expirationBlock >= block.number
        ) revert NotExpired();

        address sender; uint256 forwarder;
        (sender, forwarder) = _isTrustedForwarder();

        DT.Lock memory l = DT.Lock(
            k,
            cCounter,
            (block.number + defaultLockBlocks),
            getPixTarget(_seller, t),
            _amount,
            address(t),
            sender
        );

        // transaction forwarding must leave `merkleProof` empty;
        // otherwise, the trustedForwarder must be previously added 
        // to a seller whitelist.
        if (merkleProof.length != 0) {
            _merkleVerify(merkleProof, sellerAllowList(k), sender);
            lockID = _addLock(bal, _amount, cCounter, l, t, k);

        } else {
            if (l.amount <= REPUTATION_LOWERBOUND) {
            lockID = _addLock(bal, _amount, cCounter, l, t, k);

        } else {
            if (forwarder != 0) {
                lockID = _addLock(bal, _amount, cCounter, l, t, k);
        } else {
            uint256 userCredit = userRecord[_castAddrToKey(msg.sender)];
            uint256 spendLimit; (spendLimit) = _limiter(userCredit / WAD);
            if ( 
                l.amount > (spendLimit * WAD) || 
                l.amount > LOCKAMOUNT_UPPERBOUND 
            ) revert AmountNotAllowed();
            lockID = _addLock(bal, _amount, cCounter, l, t, k);

        /*  */}/*  */}/*  */}
    }

    /// @notice Lock release method that liquidate lock
    /// orders and distributes relayer fees.
    /// @dev This method can be called by any public actor
    /// as long the signature provided is valid.
    /// @dev `relayerPremium` gets splitted equaly
    /// if relayer addresses differ.
    /// @dev If the `msg.sender` of this method and `l.relayerAddress` are the same,
    /// `msg.sender` accrues both l.amount and l.relayerPremium as userRecord credit.
    ///  In case of they differing:
    /// - `lock` caller gets accrued with `l.amount` as userRecord credit;
    /// - `release` caller gets accrued with `l.relayerPremium` as userRecord credit;
    /// @dev Function sighash: 0x4e1389ed.
    function release(
        uint256 lockID,
        bytes32 pixTimestamp,
        bytes32 r,
        bytes32 s,
        uint8 v
    ) public nonReentrant {
        DT.Lock storage l = mapLocks[lockID];

        if (l.amount == 0) revert AlreadyReleased();
        if (l.expirationBlock < block.number)
            revert LockExpired();

        bytes32 message = keccak256(
            abi.encodePacked(
                l.pixTarget,
                l.amount,
                pixTimestamp
            )
        );

        _signerCheck(message, r, s, v);

        ERC20 t = ERC20(l.token);

        // We cache lockAmount value before zeroing it out.
        uint256 lockAmount = l.amount;

        l.amount = 0;
        l.expirationBlock = 0;
        _setUsedTransactions(message);

        address sender; uint256 forwarder;
        (sender, forwarder) = _isTrustedForwarder();
        
        if (forwarder == 0) { 
        if (msg.sender != l.buyerAddress) {
            userRecord[_castAddrToKey(msg.sender)] += (lockAmount >> 1);
            userRecord[_castAddrToKey(l.buyerAddress)] += (lockAmount >> 1);
        } else {
            userRecord[_castAddrToKey(msg.sender)] += lockAmount;
        }}

        SafeTransferLib.safeTransfer(
            t,
            l.buyerAddress,
            lockAmount
        );

        emit LockReleased(l.buyerAddress, lockID, lockAmount);
    }

    /// @notice Unlocks expired locks.
    /// @dev Triggered in the callgraph by both `lock` and `withdraw` functions.
    /// @dev This method can also have any public actor as its `tx.origin`.
    /// @dev For each successfull unexpired lock recovered,
    /// `userRecord[_castAddrToKey(l.relayerAddress)]` is decreased by half of its value.
    /// @dev Function sighash: 0x8e2749d6.
    function unlockExpired(uint256[] calldata lockIDs)
        public
    {
        uint256 i;
        uint256 locksSize = lockIDs.length;

        for (i; i < locksSize; ) {
            DT.Lock storage l = mapLocks[lockIDs[i]];

            _notExpired(l);

            uint256 _sellerBalance = 
            __sellerBalance(l.sellerKey, ERC20(l.token)) & BITMASK_SB_ENTRY;

            if ((_sellerBalance + l.amount) > MAXBALANCE_UPPERBOUND)
                revert MaxBalExceeded();

            _addSellerBalance(l.sellerKey, ERC20(l.token), l.amount);

            l.amount = 0;

            uint256 userKey = _castAddrToKey(
                l.buyerAddress
            );
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

        assembly {
            if lt(i, locksSize) {
                // LoopOverflow()
                mstore(0x00, 0xdfb035c9)
                revert(0x1c, 0x04)
            }
        }
    }

    /// @notice Seller's expired deposit fund sweeper.
    /// @dev A seller may use this method to recover
    /// tokens from expired deposits.
    /// @dev Function sighash: 0x36317972.
    function withdraw(
        ERC20 token,
        uint256 amount,
        uint256[] calldata expiredLocks
    ) public nonReentrant {
        unlockExpired(expiredLocks);

        if (getValid(msg.sender, token))
            setValidState(token, false);

        uint256 key = _castAddrToKey(msg.sender);
        _decBal(
            (__sellerBalance(key, token) & BITMASK_SB_ENTRY),
            amount,
            token,
            key
        );

        // safeTransfer tokens to seller
        SafeTransferLib.safeTransfer(
            token,
            msg.sender,
            amount
        );

        emit DepositWithdrawn(
            msg.sender,
            address(token),
            amount
        );
    }

    function setRoot(address addr, bytes32 merkleroot)
        public
    {
        assembly {
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

    /// ███ Helper FX ██████████████████████████████████████████████████████████

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /// @notice Private view auxiliar logic that reverts
    /// on a not expired lock passed as argument of the function.
    /// @dev Called exclusively by the `unlockExpired` method.
    /// @dev Function sighash: 0x74e2a0bb.
    function _notExpired(DT.Lock storage _l) private view {
        if (_l.expirationBlock > block.number)
            revert NotExpired();
        if (_l.amount == 0) revert AlreadyReleased();
    }

    function _addLock(
        uint256 _bal,
        uint256 _amount,
        uint256 _lockID,
        DT.Lock memory _l,
        ERC20 _t,
        uint256 _k
    ) internal returns(uint256 counter){
        mapLocks[_lockID] = _l;

        _decBal(_bal, _amount, _t, _k);
        ++lockCounter;
        counter = _lockID;

        emit LockAdded(
            _l.buyerAddress,
            _lockID,
            _l.sellerKey,
            _l.amount
        );
    }

    function _decBal(
        uint256 _bal,
        uint256 _amount,
        ERC20 _t,
        uint256 _k
    ) private {
        assembly {
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
        _decSellerBalance(_k,_t, _amount);
    }

    function getBalance(address seller, ERC20 token)
        public
        view
        returns (uint256 bal)
    {
        assembly {
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

    function getValid(address seller, ERC20 token)
        public
        view
        returns (bool valid)
    {
        assembly {
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
                        sload(add(keccak256(0x0c, 0x34), 0x01))
                    )
                )
                break
            }
        }
    }

    function getPixTarget(address seller, ERC20 token)
        public
        view
        returns (bytes32 pixTarget)
    {
        assembly {
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

    function getPixTargetString(address seller, ERC20 token) public view returns (string memory pixTarget) {
        bytes32 _pixEnc = getPixTarget(seller, token);
        pixTarget =  string(abi.encodePacked(_pixEnc));
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
    /// @dev Call will not revert if provided with an empty array as parameter.
    /// @dev Function sighash: 0x49ef8448
    function getLocksStatus(uint256[] memory ids)
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
                if (mapLocks[ids[c]].sellerKey == 0x0) {
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
