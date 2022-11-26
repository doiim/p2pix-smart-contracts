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

    Counters.Counter public depositCount;
    
    /// @dev Default blocks that lock will hold tokens.
    uint256 public defaultLockBlocks;


    /// @dev List of valid Bacen signature addresses
    mapping(uint256 => bool) public validBacenSigners;
    /// @dev Seller list of deposits
    mapping(uint256 => DT.Deposit) public mapDeposits;
    /// @dev List of Locks.
    mapping(bytes32 => DT.Lock) public mapLocks;
    /// @dev List of Pix transactions already signed.
    mapping(bytes32 => bool) private usedTransactions;

    /// ███ Constructor ████████████████████████████████████████████████████████

    constructor(
        uint256 defaultBlocks,
        address[] memory validSigners
    ) payable {
        assembly {
            sstore(defaultLockBlocks.slot, defaultBlocks)
        }
        unchecked {
            uint256 i;
            uint256 len = validSigners.length;
            for (i; i < len; ) {
                uint256 key = _castAddrToKey(validSigners[i]);
                validBacenSigners[key] = true;
                ++i;
            }
        }
    }

    /// ███ Public FX ██████████████████████████████████████████████████████████

    /// @notice Creates a deposit order based on a seller's 
    /// offer of an amount of ERC20 tokens.
    /// @dev Seller needs to send his tokens to the P2PIX smart contract.
    /// @param _pixTarget Pix key destination provided by the offer's seller.
    /// @return depositID The `uint256` return value provided 
    /// as the deposit identifier. 
    /// @dev Function sighash: 0xbfe07da6.
    function deposit(
        address _token,
        uint256 _amount,
        string calldata _pixTarget
    ) 
        public 
        returns (uint256 depositID) 
    {
        (depositID) = _encodeDepositID();
        ERC20 t = ERC20(_token);
        
        DT.Deposit memory d = 
            DT.Deposit({
                remaining: _amount,
                pixTarget: _pixTarget,
                seller: msg.sender,
                token: _token,
                valid: true
            });
        
        setReentrancyGuard();

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
    
    function cancelDeposit(
        uint256 depositID
    ) public {
        _onlySeller(depositID);
        mapDeposits[depositID].valid = false;
        emit DepositClosed(
            mapDeposits[depositID].seller,
            depositID
        );
    }

    /// @notice Public method designed to lock an remaining amount of 
    /// the deposit order of a seller.     
    /// @dev This method can be performed by either an order's seller,
    /// relayer, or buyer.
    /// @dev There can only exist a lock per each `_amount` partitioned 
    /// from the total `remaining` value.
    /// @dev Locks can only be performed in valid orders.
    /// @param _targetAddress The address of the buyer of a `_depositID`.
    /// @param _relayerAddress The relayer's address.
    /// @param _relayerPremium The refund/premium owed to a relayer.
    /// @param expiredLocks An array of `bytes32` identifiers to be 
    /// provided so to unexpire locks using this transaction gas push. 
    /// @return lockID The `bytes32` value returned as the lock identifier.
    /// @dev Function sighash: 0x03aaf306.
    function lock(
        uint256 _depositID,
        address _targetAddress,
        address _relayerAddress,
        uint256 _relayerPremium,
        uint256 _amount,
        bytes32[] calldata expiredLocks
    ) 
        public 
        nonReentrant
        returns (bytes32 lockID) 
    {
        unlockExpired(expiredLocks);
        DT.Deposit storage d = 
            mapDeposits[_depositID];
        
        if(!d.valid) 
            revert InvalidDeposit();
        if(d.remaining < _amount) 
            revert NotEnoughTokens();
        (lockID) = 
            _encodeLockID(
                _depositID, 
                _amount, 
                _targetAddress
            ); 
        
        DT.Lock memory l = 
            DT.Lock
            ({
                depositID: _depositID,
                relayerPremium: _relayerPremium,
                amount: _amount,
                expirationBlock: (block.number + defaultLockBlocks),
                targetAddress: _targetAddress,
                relayerAddress: _relayerAddress
            });
        
        mapLocks[lockID] = l;
        d.remaining -= _amount;
        
        emit LockAdded(
            _targetAddress,
            lockID,
            _depositID,
            _amount
        );
    }

    /// @notice Lock release method that liquidate lock 
    // orders and distributes relayer fees.
    /// @dev This method can be called by either an 
    /// order's seller, relayer, or buyer.
    /// @dev Function sighash: 0x4e1389ed.
    function release(
        bytes32 lockID,
        uint256 pixTimestamp,
        bytes32 r,
        bytes32 s,
        uint8 v
    ) 
        public 
        nonReentrant
    {
        /// @todo Prevent a PIX non-related to the app from 
        /// getting targeted, due to both sharing the same destination. 
        DT.Lock storage l = mapLocks[lockID];

        if( 
            l.expirationBlock <= block.number || 
            l.amount <= 0
        ) revert 
            AlreadyReleased();

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

        if(
            usedTransactions[message] 
                == true
        ) revert
            TxAlreadyUsed();

            uint256 signer = _castAddrToKey(
                ecrecover(
                        messageDigest, 
                        v, 
                        r, 
                        s
            ));

        if(!validBacenSigners[signer]) 
            revert InvalidSigner();

        ERC20 t = ERC20(d.token);

        // We cache values before zeroing them out.
        uint256 totalAmount = (l.amount - l.relayerPremium);

        l.amount = 0;
        l.expirationBlock = 0;
        usedTransactions[message] = true;

        SafeTransferLib.safeTransfer(   
            t, 
            l.targetAddress, 
            totalAmount
        );

        if (l.relayerPremium != 0) {
            SafeTransferLib.safeTransfer(
                t, 
                l.relayerAddress, 
                l.relayerPremium
            );
        }

        emit LockReleased(
            l.targetAddress, 
            lockID
        );
    }


    /// @notice Unlocks expired locks.
    /// @dev Triggered in the callgraph by both `lock` and `withdraw` functions.
    /// @dev This method can also have any public actor as its `tx.origin`.
    /// @dev Function sighash: 0x8e2749d6.
    function unlockExpired(
        bytes32[] calldata lockIDs
    ) public {
        uint256 i;
        uint256 locksSize =
            lockIDs.length;
            
        for (i; i < locksSize;) 
        {
            DT.Lock storage l = mapLocks[lockIDs[i]];

            _notExpired(l);

            mapDeposits[l.depositID].remaining 
                += l.amount;
            l.amount = 0;
            
            emit LockReturned(
                l.targetAddress, 
                lockIDs[i]
            );
            
            unchecked {
                ++i;
            }
        }

        assembly {
            if lt(i, locksSize) {
                // LoopOverflow()
                mstore(
                    0x00, 
                    0xdfb035c9
                )
                revert(
                    0x1c, 
                    0x04
                )
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
    )   
        public 
        nonReentrant
    {
        _onlySeller(depositID);
        unlockExpired(expiredLocks);
        
        DT.Deposit storage d = 
            mapDeposits[depositID];
        
        if (d.valid == true) { 
            cancelDeposit(depositID); 
        }
        
        ERC20 token = ERC20(d.token);

        // Withdraw remaining tokens from mapDeposit[depositID]
        uint256 amount = d.remaining;
        d.remaining = 0;

        // safeTransfer tokens to seller
        SafeTransferLib.safeTransfer(
            token, 
            d.seller, 
            amount
        );

        emit DepositWithdrawn(
            msg.sender, 
            depositID, 
            amount
        );
    }

    /// ███ Owner Only █████████████████████████████████████████████████████████

    /// @dev Contract's balance withdraw method. 
    /// @dev Function sighash: 0x5fd8c710.
    function withdrawBalance() external onlyOwner {
        uint256 balance = 
            address(this).balance;
        SafeTransferLib.safeTransferETH(
            msg.sender, 
            balance
        );
        emit FundsWithdrawn(
            msg.sender, 
            balance
        );
    }

    /// ███ Helper FX ██████████████████████████████████████████████████████████
    
    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /// @notice Access control private view method that 
    /// performs auth check on an deposit's seller.
    /// @dev Function sighash: 0x4125a4d9.
    function _onlySeller(uint256 _depositID) 
        private 
        view 
    {
        if (
            mapDeposits[_depositID].seller 
            != msg.sender
        ) revert 
            OnlySeller();
    }

    /// @notice Private view auxiliar logic that reverts 
    /// on a not expired lock passed as argument of the function.
    /// @dev Called exclusively by the `unlockExpired` method.
    /// @dev Function sighash: 0x74e2a0bb.
    function _notExpired(DT.Lock storage _l) 
        private 
        view
    {
        // Custom Error Solidity Impl
        if 
        (
            _l.expirationBlock >= block.number || 
            _l.amount <= 0
        ) revert 
            NotExpired();
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
        if (
            mapDeposits[_depositID].valid 
            == true
        ) revert 
            DepositAlreadyExists();
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
        address _targetAddress) 
        private 
        view
        returns (bytes32 _lockID)
    {
        _lockID = keccak256(
            abi.encodePacked(_depositID, _amount, _targetAddress)
        );
        if (
            mapLocks[_lockID].expirationBlock 
            >= block.number
        ) revert
            NotExpired();
    }

    /// @notice Public method that handles `address` 
    /// to `uint256` safe type casting.
    /// @dev Function sighash: 0x4b2ae980.
    function _castAddrToKey(address _addr) 
    public 
    pure
    returns (uint256 _key) 
    {
        _key = uint256(
            uint160(
                address(
                    _addr
        ))) << 12;
    }
}
