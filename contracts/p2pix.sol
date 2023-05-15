// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

///         ______         __
/// .-----.|__    |.-----.|__|.--.--.
/// |  _  ||    __||  _  ||  ||_   _|
/// |   __||______||   __||__||__.__|
/// |__|           |__|
///

import { Owned } from "./lib/auth/Owned.sol";
import { ERC20, SafeTransferLib } from "./lib/utils/SafeTransferLib.sol";
import { IReputation } from "./lib/interfaces/IReputation.sol";
import { MerkleProofLib as Merkle } from "./lib/utils/MerkleProofLib.sol";
import { ReentrancyGuard } from "./lib/utils/ReentrancyGuard.sol";
import { EventAndErrors } from "./EventAndErrors.sol";
import { DataTypes as DT } from "./DataTypes.sol";

contract P2PIX is
    EventAndErrors,
    Owned(msg.sender),
    ReentrancyGuard
{
    // solhint-disable use-forbidden-name
    // solhint-disable no-inline-assembly
    // solhint-disable no-empty-blocks

    using DT for DT.Lock;
    using DT for DT.LockStatus;

    /// ███ Constants ██████████████████████████████████████████████████████████

    uint256 private constant _ROOT_UPDATED_EVENT_SIGNATURE =
        0x0b294da292f26e55fd442b5c0164fbb9013036ff00c5cfdde0efd01c1baaf632;
    uint256 private constant _ALLOWED_ERC20_UPDATED_EVENT_SIGNATURE =
        0x5d6e86e5341d57a92c49934296c51542a25015c9b1782a1c2722a940131c3d9a;

    /// @dev Seller casted to key => Seller's allowlist merkleroot.
    /// mapping(uint256 => bytes32) public sellerAllowList;
    uint256 private constant _SELLER_ALLOWLIST_SLOT_SEED = 0x74dfee70;
    /// @dev Tokens allowed to serve as the underlying amount of a deposit.
    /// mapping(ERC20 => bool) public allowedERC20s;
    uint256 private constant _ALLOWED_ERC20_SLOT_SEED = 0xcbc9d1c4;

    // BITS LAYOUT
    // `uint96`  [0...94]   := balance
    // `uint160` [95...254] := pixTarget
    // `bool`    [255]       := valid

    /// @dev `balance` max. value = 10**26.
    /// @dev `pixTarget` keys are restricted to 160 bits.
    // mapping(uint256 => mapping(ERC20 => uint256)) public sellerBalance;
    uint256 private constant _SELLER_BALANCE_SLOT_SEED = 0x739094b1;

    /// @dev The bitmask of `sellerBalance` entry.
    uint256 private constant BITMASK_SB_ENTRY = (1 << 94) - 1;
    /// @dev The bit position of `pixTarget` in `sellerBalance`.
    uint256 private constant BITPOS_PIXTARGET = 95;
    /// @dev The bit position of `valid` in `sellerBalance`.
    uint256 private constant BITPOS_VALID = 255;
    /// @dev The bitmask of all 256 bits of `sellerBalance` except for the last one.
    uint256 private constant BITMASK_VALID = (1 << 255) - 1;
    
    /// @dev The scalar of BRZ token.
    uint256 public constant WAD = 1e18;

    /// ███ Storage ████████████████████████████████████████████████████████████

    /// @dev List of valid Bacen signature addresses
    /// @dev Value in custom storage slot given by: 
    /// let slot := sload(shl(12, address)).
    // mapping(uint256 => bool) public validBacenSigners;
    
    /// @dev List of Pix transactions already signed.
    /// @dev Value in custom storage slot given by: 
    /// let slot := sload(bytes32).
    // mapping(bytes32 => bool) public usedTransactions;

    IReputation public reputation;

    /// @dev Default blocks that lock will hold tokens.
    uint256 public defaultLockBlocks;
    uint256 public lockCounter;

    /// @dev List of Locks.
    mapping(uint256 => DT.Lock) public mapLocks;
    /// @dev Stores an relayer's last computed credit.
    mapping(uint256 => uint256) public userRecord;

    /// ███ Constructor ████████████████████████████████████████████████████████

    constructor(
        uint256 defaultBlocks,
        address[] memory validSigners,
        IReputation _reputation,
        address[] memory tokens,
        bool[] memory tokenStates
    ) payable {
        setDefaultLockBlocks(defaultBlocks);
        setReputation(_reputation);
        setValidSigners(validSigners);
        tokenSettings(tokens, tokenStates);
    }

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
        uint160 _pixTarget,
        bool _valid,
        bytes32 allowlistRoot
    ) public {
        ERC20 t = ERC20(_token);
        uint256 k = _castAddrToKey(msg.sender);

        if (_pixTarget == 0) revert EmptyPixTarget();
        if (!allowedERC20s(t)) revert TokenDenied();
        uint256 _sellerBalance = sellerBalance(k,t);

        uint256 currBal = _sellerBalance & BITMASK_SB_ENTRY;
        if ((currBal + _amount) > 1e8 ether)
            revert MaxBalExceeded();

        setReentrancyGuard();

        if (allowlistRoot != 0) {
            setRoot(msg.sender, allowlistRoot);
        }

        uint256 amountCasted;
        uint256 pixTargetCasted;
        uint256 validCasted;
        (
            amountCasted,
            pixTargetCasted,
            validCasted
        ) = _castToUint(_amount, _pixTarget, _valid);

        _setSellerBalance(
            k, 
            t, 
            ((currBal + amountCasted) |
            (pixTargetCasted << BITPOS_PIXTARGET) |
            (validCasted << BITPOS_VALID))
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
        uint256 _sellerBalance = sellerBalance(key, token);

        if (_sellerBalance != 0) {
            uint256 _valid;
            assembly {
                _valid := state
            }

            _sellerBalance =
                (_sellerBalance & BITMASK_VALID) |
                (_valid << BITPOS_VALID);

            _setSellerBalance(key, token, _sellerBalance);

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
    /// @param _buyerAddress The address of the buyer of a `_depositID`.
    /// @param _relayerPremium The refund/premium owed to a relayer.
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
        address _buyerAddress,
        // address _relayerTarget,
        uint256 _relayerPremium,
        uint256 _amount,
        bytes32[] calldata merkleProof,
        uint256[] calldata expiredLocks
    ) public nonReentrant returns (uint256) {
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

        DT.Lock memory l = DT.Lock(
            k,
            cCounter,
            _relayerPremium,
            _amount,
            (block.number + defaultLockBlocks),
            uint160(sellerBalance(k, t) >> BITPOS_PIXTARGET),
            _buyerAddress,
            // _relayerTarget,
            msg.sender,
            address(t)
        );

        if (merkleProof.length != 0) {
            _merkleVerify(
                merkleProof,
                sellerAllowList(k),
                msg.sender
            );

            _addLock(bal, _amount, cCounter, l, t, k);

            lockCounter++;

            // Halt execution and output `lockID`.
            return cCounter;
        } else {
            if (l.amount <= 1e2 ether) {
                _addLock(bal, _amount, cCounter, l, t, k);

                lockCounter++;

                // Halt execution and output `lockID`.
                return cCounter;
            } else {
                uint256 userCredit = userRecord[
                    _castAddrToKey(msg.sender)
                ];

                uint256 spendLimit;
                (spendLimit) = _limiter(userCredit / WAD);

                if (
                    l.amount > (spendLimit * WAD) ||
                    l.amount > 1e6 ether
                ) revert AmountNotAllowed();

                _addLock(bal, _amount, cCounter, l, t, k);

                lockCounter++;

                // Halt execution and output `lockID`.
                return cCounter;
            }
        }
    }

    /// @notice Lock release method that liquidate lock
    /// orders and distributes relayer fees.
    /// @dev This method can be called by any public actor
    /// as long the signature provided is valid.
    /// @dev `relayerPremium` gets splitted equaly
    /// if `relayerTarget` addresses differ.
    /// @dev If the `msg.sender` of this method and `l.relayerAddress` are the same,
    /// `msg.sender` accrues both l.amount and l.relayerPremium as userRecord credit.
    ///  In case of they differing:
    /// - `lock` caller gets accrued with `l.amount` as userRecord credit;
    /// - `release` caller gets accrued with `l.relayerPremium` as userRecord credit;
    /// @dev Function sighash: 0x4e1389ed.
    function release(
        uint256 lockID,
        // address _relayerTarget,
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
        bytes32 messageDigest = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                message
            )
        );

        if (usedTransactions(message) == true)
            revert TxAlreadyUsed();

        uint256 signer = _castAddrToKey(
            ecrecover(messageDigest, v, r, s)
        );

        if (!validBacenSigners(signer))
            revert InvalidSigner();

        ERC20 t = ERC20(l.token);

        // We cache values before zeroing them out.
        uint256 lockAmount = l.amount;
        uint256 totalAmount = (lockAmount - l.relayerPremium);

        l.amount = 0;
        l.expirationBlock = 0;
        _setUsedTransactions(message);

        if (msg.sender != l.relayerAddress) {
            userRecord[_castAddrToKey(msg.sender)] += l
                .relayerPremium;
            userRecord[
                _castAddrToKey(l.relayerAddress)
            ] += lockAmount;
        } else {
            userRecord[_castAddrToKey(msg.sender)] += (l
                .relayerPremium + lockAmount);
        }

        SafeTransferLib.safeTransfer(
            t,
            l.buyerAddress,
            totalAmount
        );

        // Method doesn't check for zero address.
        if (l.relayerPremium != 0) {
            if (msg.sender != l.relayerAddress) {
                SafeTransferLib.safeTransfer(
                    t,
                    l.relayerAddress,
                    (l.relayerPremium >> 1)
                );
                SafeTransferLib.safeTransfer(
                    t,
                    msg.sender,
                    (l.relayerPremium >> 1)
                );
            } else {
                SafeTransferLib.safeTransfer(
                    t,
                    msg.sender,
                    l.relayerPremium
                );
            }
        }

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

            uint256 _sellerBalance = sellerBalance(l.sellerKey, ERC20(l.token)) & BITMASK_SB_ENTRY;

            if ((_sellerBalance + l.amount) > 1e8 ether)
                revert MaxBalExceeded();

            _addSellerBalance(l.sellerKey, ERC20(l.token), l.amount);

            l.amount = 0;

            uint256 userKey = _castAddrToKey(
                l.relayerAddress
            );
            uint256 _newUserRecord = (userRecord[userKey] >>
                1);

            if (_newUserRecord <= 1e2 ether) {
                userRecord[userKey] = 1e2 ether;
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

        if (getValid(msg.sender, token) == true) {
            setValidState(token, false);
        }

        uint256 key = _castAddrToKey(msg.sender);
        _decBal(
            (sellerBalance(key, token) & BITMASK_SB_ENTRY),
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


    /// ███ Owner Only █████████████████████████████████████████████████████████

    /// @dev Contract's underlying balance withdraw method.
    /// @dev Function sighash: 0x5fd8c710.
    function withdrawBalance() external onlyOwner {
        uint256 balance = address(this).balance;
        SafeTransferLib.safeTransferETH(msg.sender, balance);
        emit FundsWithdrawn(msg.sender, balance);
    }

    function setReputation(IReputation _reputation)
        public
        onlyOwner
    {
        assembly {
            sstore(reputation.slot, _reputation)
        }
        emit ReputationUpdated(address(_reputation));
    }

    function setDefaultLockBlocks(uint256 _blocks)
        public
        onlyOwner
    {
        assembly {
            sstore(defaultLockBlocks.slot, _blocks)
        }
        emit LockBlocksUpdated(_blocks);
    }

    function setValidSigners(address[] memory _validSigners)
        public
        onlyOwner
    {
        assembly {
            let i := add(_validSigners, 0x20)
            let end := add(i, shl(0x05, mload(_validSigners)))
            for {/*  */} iszero(returndatasize()) {/*  */} {
                sstore(shl(12, mload(i)), true)
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
    ) internal {
        mapLocks[_lockID] = _l;

        _decBal(_bal, _amount, _t, _k);

        emit LockAdded(
            _l.buyerAddress,
            _lockID,
            _l.sellerKey,
            _l.amount
        );
    }

    function _merkleVerify(
        bytes32[] calldata _merkleProof,
        bytes32 root,
        address _addr
    ) private pure {
        if (
            !Merkle.verify(
                _merkleProof,
                root,
                bytes32(uint256(uint160(_addr)))
            )
        ) revert AddressDenied();
    }

    function _limiter(uint256 _userCredit)
        internal
        view
        returns (uint256 _spendLimit)
    {
        // enconde the fx sighash and args
        bytes memory encodedParams = abi.encodeWithSelector(
            IReputation.limiter.selector,
            _userCredit
        );
        // cast the uninitialized return values to memory
        bool success;
        // uint256 returnSize;
        // uint256 returnValue;
        // perform staticcall from the stack w yul
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
            // returnSize := returndatasize()
            // returnValue := mload(0x00)
            // _spendLimit := returnValue
            _spendLimit := mload(0x00)
            // reverts if call does not succeed.
            if iszero(success) {
                // StaticCallFailed()
                mstore(0x00, 0xe10bf1cc)
                revert(0x1c, 0x04)
            }
        }
    }

    function _castToUint(
        uint96 _amount,
        uint160 _pixTarget,
        bool _valid
    )
        private
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
        // bal =
        // sellerBalance[_castAddrToKey(seller)][token] &
        // BITMASK_SB_ENTRY;
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
                    sload(keccak256(0x0c, 0x34))
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
        // uint256 b = sellerBalance[
        // _castAddrToKey(seller)
        // ][token];
        // ] >> BITPOS_VALID) & BITMASK_SB_ENTRY;
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
                        sload(keccak256(0x0c, 0x34))
                    )
                )
                break
            }
        }
    }

    function getPixTarget(address seller, ERC20 token)
        public
        view
        returns (uint160 pixTarget)
    {
        // pixTarget = uint160(
        // sellerBalance[_castAddrToKey(seller)][token] >>
        // BITPOS_PIXTARGET
        // );
        assembly {
            for {
                /*  */
            } iszero(returndatasize()) {
                /*  */
            } {
                mstore(0x20, token)
                mstore(0x0c, _SELLER_BALANCE_SLOT_SEED)
                mstore(0x00, seller)
                pixTarget := shr(
                    BITPOS_PIXTARGET,
                    sload(keccak256(0x0c, 0x34))
                )
                break
            }
        }
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

    function allowedERC20s(ERC20 erc20) public view returns (bool state) {
        assembly {
            mstore(0x0c, _ALLOWED_ERC20_SLOT_SEED)
            mstore(0x00, erc20)
            state := sload(keccak256(0x0c, 0x20))
        }
    }

    function _setUsedTransactions(bytes32 message) private {
        assembly {
            sstore(message, true)
        }
    }

    function usedTransactions(bytes32 message) public view returns(bool used) {
        assembly {
            used := sload(message)
        }
    }

    function validBacenSigners(uint256 signer) public view returns(bool valid) {
        assembly {
            valid := sload(signer)
        }
    }

    function sellerAllowList(uint256 sellerKey) public view returns(bytes32 root) {
        assembly {
            mstore(0x0c, _SELLER_ALLOWLIST_SLOT_SEED)
            mstore(0x00, shr(12, sellerKey))
            root := sload(keccak256(0x00, 0x20))
        }
    }

    function _setSellerBalance(uint256 sellerKey, ERC20 erc20, uint256 packed) private {
        assembly {
            mstore(0x20, erc20)
            mstore(0x0c, _SELLER_BALANCE_SLOT_SEED)
            mstore(0x00, shr(12, sellerKey))
            sstore(keccak256(0x0c, 0x34), packed)
        }
    }

    function _addSellerBalance(uint256 sellerKey, ERC20 erc20, uint256 amount) private {
        assembly {
            mstore(0x20, erc20)
            mstore(0x0c, _SELLER_BALANCE_SLOT_SEED)
            mstore(0x00, shr(12, sellerKey))
            let slot := keccak256(0x0c, 0x34)
            sstore(slot, add(sload(slot), amount))
        }
    }

    function _decSellerBalance(uint256 sellerKey, ERC20 erc20, uint256 amount) private {
        assembly {
            mstore(0x20, erc20)
            mstore(0x0c, _SELLER_BALANCE_SLOT_SEED)
            mstore(0x00, shr(12, sellerKey))
            let slot := keccak256(0x0c, 0x34)
            sstore(slot, sub(sload(slot), amount))
        }
    }

    function sellerBalance(uint256 sellerKey, ERC20 erc20) public view returns(uint256 packed) {
        assembly {
            mstore(0x20, erc20)
            mstore(0x0c, _SELLER_BALANCE_SLOT_SEED)
            mstore(0x00, shr(12, sellerKey))
            packed := sload(keccak256(0x0c, 0x34))

        }
    }

    /// @notice Public method that handles `address`
    /// to `uint256` safe type casting.
    /// @dev Function sighash: 0x4b2ae980.
    function _castAddrToKey(address _addr)
        public
        pure
        returns (uint256 _key)
    {
        // _key = uint256(uint160(address(_addr))) << 12;
        assembly {
            _key := shl(12, _addr)
        }
    }

    function _castKeyToAddr(uint256 _key)
        public
        pure
        returns (address _addr)
    {
        // _addr = address(uint160(uint256(_key >> 12)));
        assembly {
            _addr := shr(12, _key)
        }
    }
}
