// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

///         ______         __
/// .-----.|__    |.-----.|__|.--.--.
/// |  _  ||    __||  _  ||  ||_   _|
/// |   __||______||   __||__||__.__|
/// |__|           |__|
///

import { Owned } from "./lib/auth/Owned.sol";
import { Counters } from "./lib/utils/Counters.sol";
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

    using Counters for Counters.Counter;
    using DT for DT.Deposit;
    using DT for DT.Lock;

    /// ███ Storage ████████████████████████████████████████████████████████████

    IReputation public reputation;
    Counters.Counter public depositCount;

    /// @dev Default blocks that lock will hold tokens.
    uint256 public defaultLockBlocks;

    /// @dev Stores an relayer's last computed credit.
    mapping(uint256 => uint256) public userRecord;
    /// @dev List of valid Bacen signature addresses
    mapping(uint256 => bool) public validBacenSigners;
    /// @dev Seller list of deposits
    mapping(uint256 => DT.Deposit) public mapDeposits;
    /// @dev List of Locks.
    mapping(bytes32 => DT.Lock) public mapLocks;
    /// @dev List of Pix transactions already signed.
    mapping(bytes32 => bool) private usedTransactions;
    /// @dev Seller casted to key => Seller's allowlist merkleroot.
    mapping(uint256 => bytes32) public sellerAllowList;
    /// @dev Tokens allowed to serve as the underlying amount of a deposit.
    mapping(ERC20 => bool) public allowedERC20s;

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
    /// @return depositID The `uint256` return value provided
    /// as the deposit identifier.
    /// @dev Function sighash: 0xbfe07da6.
    function deposit(
        address _token,
        uint256 _amount,
        string calldata _pixTarget,
        bytes32 allowlistRoot
    ) public returns (uint256 depositID) {
        ERC20 t = ERC20(_token);
        if (!allowedERC20s[t]) revert TokenDenied();

        (depositID) = _encodeDepositID();

        DT.Deposit memory d = DT.Deposit({
            remaining: _amount,
            pixTarget: _pixTarget,
            seller: msg.sender,
            token: _token,
            valid: true
        });

        setReentrancyGuard();

        if (allowlistRoot != 0) {
            setRoot(msg.sender, allowlistRoot);
        }

        mapDeposits[depositID] = d;
        depositCount.increment();

        SafeTransferLib.safeTransferFrom(
            t,
            msg.sender,
            address(this),
            _amount
        );

        clearReentrancyGuard();

        emit DepositAdded(
            msg.sender,
            depositID,
            _token,
            _amount
        );
    }

    /// @notice Enables seller to invalidate future
    /// locks made to his/her token offering order.
    /// @dev This function does not affect any ongoing active locks.
    /// @dev Function sighash: 0x72fada5c.

    function cancelDeposit(uint256 depositID) public {
        _onlySeller(depositID);
        mapDeposits[depositID].valid = false;
        emit DepositClosed(
            mapDeposits[depositID].seller,
            depositID
        );
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
    /// @param _relayerTarget Target address entitled to the `relayerPremium`.
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
        uint256 _depositID,
        address _buyerAddress,
        address _relayerTarget,
        uint256 _relayerPremium,
        uint256 _amount,
        bytes32[] calldata merkleProof,
        bytes32[] calldata expiredLocks
    ) public nonReentrant returns (bytes32 lockID) {
        unlockExpired(expiredLocks);
        DT.Deposit storage d = mapDeposits[_depositID];

        if (!d.valid) revert InvalidDeposit();
        if (d.remaining < _amount) revert NotEnoughTokens();

        (lockID) = _encodeLockID(
            _depositID,
            _amount,
            _buyerAddress
        );

        DT.Lock memory l = DT.Lock({
            depositID: _depositID,
            relayerPremium: _relayerPremium,
            amount: _amount,
            expirationBlock: (block.number +
                defaultLockBlocks),
            buyerAddress: _buyerAddress,
            relayerTarget: _relayerTarget,
            relayerAddress: msg.sender
        });

        if (merkleProof.length != 0) {
            merkleVerify(
                merkleProof,
                sellerAllowList[_castAddrToKey(d.seller)],
                msg.sender
            );

            mapLocks[lockID] = l;
            d.remaining -= _amount;

            emit LockAdded(
                _buyerAddress,
                lockID,
                l.depositID,
                _amount
            );

            // Halt execution and output `lockID`.
            return lockID;
        } else {
            uint256 userCredit = userRecord[
                _castAddrToKey(msg.sender)
            ];
            uint256 spendLimit;
            (spendLimit) = _limiter(userCredit);

            if (l.amount > spendLimit)
                revert AmountNotAllowed();

            mapLocks[lockID] = l;
            d.remaining -= _amount;

            emit LockAdded(
                _buyerAddress,
                lockID,
                l.depositID,
                _amount
            );

            // Halt execution and output `lockID`.
            return lockID;
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
    /// @param _relayerTarget Target address entitled to the `relayerPremim`.
    /// @dev Function sighash: 0x4e1389ed.
    function release(
        bytes32 lockID,
        address _relayerTarget,
        uint256 pixTimestamp,
        bytes32 r,
        bytes32 s,
        uint8 v
    ) public nonReentrant {
        DT.Lock storage l = mapLocks[lockID];

        if (
            l.expirationBlock <= block.number || l.amount <= 0
        ) revert AlreadyReleased();

        DT.Deposit storage d = mapDeposits[l.depositID];
        bytes32 message = keccak256(
            abi.encodePacked(
                d.pixTarget,
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

        if (usedTransactions[message] == true)
            revert TxAlreadyUsed();

        uint256 signer = _castAddrToKey(
            ecrecover(messageDigest, v, r, s)
        );

        if (!validBacenSigners[signer])
            revert InvalidSigner();

        ERC20 t = ERC20(d.token);

        // We cache values before zeroing them out.
        uint256 totalAmount = (l.amount - l.relayerPremium);

        l.amount = 0;
        l.expirationBlock = 0;
        usedTransactions[message] = true;

        if (msg.sender != l.relayerAddress) {
            userRecord[_castAddrToKey(msg.sender)] += l
                .relayerPremium;
            userRecord[_castAddrToKey(l.relayerAddress)] += l
                .amount;
        } else {
            userRecord[_castAddrToKey(msg.sender)] += (l
                .relayerPremium + l.amount);
        }

        SafeTransferLib.safeTransfer(
            t,
            l.buyerAddress,
            totalAmount
        );

        // Method doesn't check for zero address.
        if (l.relayerPremium != 0) {
            if (_relayerTarget != l.relayerTarget) {
                SafeTransferLib.safeTransfer(
                    t,
                    l.relayerTarget,
                    (l.relayerPremium >> 1)
                );
                SafeTransferLib.safeTransfer(
                    t,
                    _relayerTarget,
                    (l.relayerPremium >> 1)
                );
            } else {
                SafeTransferLib.safeTransfer(
                    t,
                    _relayerTarget,
                    l.relayerPremium
                );
            }
        }

        emit LockReleased(l.buyerAddress, lockID);
    }

    /// @notice Unlocks expired locks.
    /// @dev Triggered in the callgraph by both `lock` and `withdraw` functions.
    /// @dev This method can also have any public actor as its `tx.origin`.
    /// @dev For each successfull unexpired lock recovered,
    /// `userRecord[_castAddrToKey(l.relayerAddress)]` is decreased by half of its value.
    /// @dev Function sighash: 0x8e2749d6.
    function unlockExpired(
        bytes32[] calldata lockIDs
    ) public {
        uint256 i;
        uint256 locksSize = lockIDs.length;

        for (i; i < locksSize; ) {
            DT.Lock storage l = mapLocks[lockIDs[i]];

            _notExpired(l);

            mapDeposits[l.depositID].remaining += l.amount;
            l.amount = 0;

            uint256 userKey = _castAddrToKey(
                l.relayerAddress
            );
            uint256 _newUserRecord = (userRecord[userKey] >>
                1);

            if (_newUserRecord <= 100) {
                userRecord[userKey] = 100;
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
        uint256 depositID,
        bytes32[] calldata expiredLocks
    ) public nonReentrant {
        _onlySeller(depositID);
        unlockExpired(expiredLocks);

        DT.Deposit storage d = mapDeposits[depositID];

        if (d.valid == true) {
            cancelDeposit(depositID);
        }

        ERC20 token = ERC20(d.token);

        // Withdraw remaining tokens from mapDeposit[depositID]
        uint256 amount = d.remaining;
        d.remaining = 0;

        // safeTransfer tokens to seller
        SafeTransferLib.safeTransfer(token, d.seller, amount);

        emit DepositWithdrawn(msg.sender, depositID, amount);
    }

    function setRoot(
        address addr,
        bytes32 merkleroot
    ) public {
        if (addr == msg.sender) {
            sellerAllowList[
                _castAddrToKey(addr)
            ] = merkleroot;
        } else revert OnlySeller();
    }

    /// ███ Owner Only █████████████████████████████████████████████████████████

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
        unchecked {
            uint256 i;
            uint256 len = _validSigners.length;
            for (i; i < len; ) {
                uint256 key = _castAddrToKey(
                    _validSigners[i]
                );
                validBacenSigners[key] = true;
                ++i;
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
            if iszero(tLen) {
                mstore(0x00, 0xdf957883)
                revert(0x1c, 0x04)
            }
            if iszero(eq(tLen, mload(_states))) {
                mstore(0x00, 0xff633a38)
                revert(0x1c, 0x04)
            }
            let tLoc := add(_tokens, 0x20)
            let sLoc := add(_states, 0x20)
            for {
                let end := add(tLoc, mul(tLen, 0x20))
            } iszero(eq(tLoc, end)) {
                tLoc := add(tLoc, 0x20)
                sLoc := add(sLoc, 0x20)
            } {
                mstore(0x00, mload(tLoc))
                mstore(0x20, allowedERC20s.slot)
                let mapSlot := keccak256(0x00, 0x40)
                sstore(mapSlot, mload(sLoc))
                log3(
                    0,
                    0,
                    0x5d6e86e5341d57a92c49934296c51542a25015c9b1782a1c2722a940131c3d9a,
                    mload(tLoc),
                    mload(sLoc)
                )
            }
        }
        /* Solidity Impl */
        // uint256 tLen = _tokens.length;
        // uint256 sLen = _states.length;

        // if (tLen != sLen)
        //     revert LengthMismatch();
        // if (tLen == 0)
        //     revert NoTokens();

        // uint256 i;
        // for (i; i > tLen;) {
        //     allowedERC20s[ERC20(_tokens[i])] = _states[i];
        //     emit AllowedERC20Updated(_tokens[i], _states[i]);
        //     unchecked {
        //         ++i;
        //     }
        // }
    }

    /// ███ Helper FX ██████████████████████████████████████████████████████████

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /// @notice Access control private view method that
    /// performs auth check on an deposit's seller.
    /// @dev Function sighash: 0x4125a4d9.
    function _onlySeller(uint256 _depositID) private view {
        if (mapDeposits[_depositID].seller != msg.sender)
            revert OnlySeller();
    }

    /// @notice Private view auxiliar logic that reverts
    /// on a not expired lock passed as argument of the function.
    /// @dev Called exclusively by the `unlockExpired` method.
    /// @dev Function sighash: 0x74e2a0bb.
    function _notExpired(DT.Lock storage _l) private view {
        // Custom Error Solidity Impl
        if (
            _l.expirationBlock >= block.number ||
            _l.amount <= 0
        ) revert NotExpired();
        /*         
    // Custom Error Yul Impl
        assembly {
            if iszero(iszero(
                    or(
                        or(
                            lt(number(), sload(add(_l.slot, 3))),
                            eq(sload(add(_l.slot, 3)), number())
                        ),
                        iszero(sload(add(_l.slot, 2)))
            )))
            {
                mstore(0x00, 0xd0404f85)
                revert(0x1c, 0x04)
            }
        }
        
    // Require Error Solidity Impl
        require(
                _l.expirationBlock < block.number &&
                    _l.amount > 0,
                "P2PIX: Lock not expired or already released"
            ); 
*/
    }

    /// @notice Internal view auxiliar logic that returns a new valid `_depositID`.
    /// @dev It reverts on an already valid counter (`uint256`) value.
    /// @dev Function sighash: 0xdb51d697.
    function _encodeDepositID()
        internal
        view
        returns (uint256 _depositID)
    {
        (_depositID) = depositCount.current();
        if (mapDeposits[_depositID].valid == true)
            revert DepositAlreadyExists();
    }

    /// @notice Private view auxiliar logic that encodes/returns
    /// the `bytes32` identifier of an lock.
    /// @dev reverts on a not expired lock with the same ID passed
    /// as argument of the function.
    /// @dev Called exclusively by the `lock` method.
    /// @dev Function sighash: 0x3fc5fb52.
    function _encodeLockID(
        uint256 _depositID,
        uint256 _amount,
        address _buyerAddress
    ) private view returns (bytes32 _lockID) {
        _lockID = keccak256(
            abi.encodePacked(
                _depositID,
                _amount,
                _buyerAddress
            )
        );
        if (mapLocks[_lockID].expirationBlock >= block.number)
            revert NotExpired();
    }

    function merkleVerify(
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

    function _limiter(
        uint256 _userCredit
    ) internal view returns (uint256 _spendLimit) {
        // enconde the fx sighash and args
        bytes memory encodedParams = abi.encodeWithSelector(
            IReputation.limiter.selector,
            _userCredit
        );
        // cast the uninitialized return values to memory
        bool success;
        uint256 returnSize;
        uint256 returnValue;
        // perform staticcall from the stack w yul
        assembly {
            success := staticcall(
                // gas
                30000,
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
            returnSize := returndatasize()
            returnValue := mload(0x00)
            _spendLimit := returnValue
            // reverts if call does not succeed.
            if iszero(success) {
                mstore(0x00, 0xe10bf1cc)
                revert(0x1c, 0x04)
            }
        }
    }

    /// @notice Public method that handles `address`
    /// to `uint256` safe type casting.
    /// @dev Function sighash: 0x4b2ae980.
    function _castAddrToKey(
        address _addr
    ) public pure returns (uint256 _key) {
        _key = uint256(uint160(address(_addr))) << 12;
    }
}
