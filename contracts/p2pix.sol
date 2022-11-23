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

    // Vendedor precisa mandar token para o smart contract + chave PIX destino. Retorna um DepositID.
    function deposit(
        address token,
        uint256 amount,
        string calldata pixTarget
    ) 
        public 
        payable 
        returns (uint256 depositID) 
    {
        (depositID) = _encodeDepositID();
        ERC20 t = ERC20(token);
        
        DT.Deposit memory d = 
            DT.Deposit({
                remaining: amount,
                premium: msg.value,
                pixTarget: pixTarget,
                seller: msg.sender,
                token: token,
                valid: true
            });
        
        setReentrancyGuard();

        mapDeposits[depositID] = d;
        depositCount.increment();

        SafeTransferLib.safeTransferFrom(
            t,
            msg.sender,
            address(this),
            amount
        );
        
        clearReentrancyGuard();

        emit DepositAdded(
            msg.sender,
            depositID,
            token,
            msg.value,
            amount
        );
    }

    // Vendedor pode invalidar da ordem de venda impedindo novos
    // locks na mesma (isso não afeta nenhum lock que esteja ativo).
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

    // Relayer interaje adicionando um “lock” na ordem de venda.
    // O lock precisa incluir address do comprador + address do relayer + reembolso/premio relayer + valor.
    // **Só poder ter um lock em aberto para cada (ordem de venda, valor)**.
    // Só pode fazer lock de ordens que não estão invalidadas(Passo 5).
    // Essa etapa pode ser feita pelo vendedor conjuntamente com a parte 1.
    // Retorna um LockID.
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

    // Relayer interage com o smart contract, colocando no calldata o comprovante do PIX realizado.
    // Smart contract valida o comprovante, manda os tokens para o endereço do pagador,
    // e reembolsa o custo do gás para o endereço do relayer especificado na parte (2).
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
        // TODO **Prevenir que um Pix não relacionado ao APP seja usado pois tem o mesmo destino
        DT.Lock storage l = mapLocks[lockID];

        if( 
            l.expirationBlock <= block.number 
            && l.amount <= 0
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


    // Unlock expired locks
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

    // Após os locks expirarem, vendedor pode interagir c/ o contrato e recuperar os tokens de um depósito específico.
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

    // O dono do contrato pode sacar os premiums pagos
    function withdrawPremiums() external onlyOwner {
        uint256 balance = 
            address(this).balance;
        SafeTransferLib.safeTransferETH(
            msg.sender, 
            balance
        );
        emit PremiumsWithdrawn(
            msg.sender, 
            balance
        );
    }

    /// ███ Helper FX ██████████████████████████████████████████████████████████

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

        // Custom Error Yul Impl
        // assembly {
        //     if iszero(iszero(
        //             or(
        //                 or(
        //                     lt(number(), sload(add(_l.slot, 3))),
        //                     eq(sload(add(_l.slot, 3)), number())
        //                 ),
        //                 iszero(sload(add(_l.slot, 2)))
        //     )))
        //     {
        //         mstore(0x00, 0xd0404f85)
        //         revert(0x1c, 0x04)
        //     }
        // }
        
        // Require Error Solidity Impl
        // require(
        //         _l.expirationBlock < block.number &&
        //             _l.amount > 0,
        //         "P2PIX: Lock not expired or already released"
        //     );
    }

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
