// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract P2PIX {

    event DepositAdded(address indexed seller, bytes32 depositID, address token, uint256 amount);
    event DepositClosed(address indexed seller, bytes32 depositID);
    event DepositWithdrawn(address indexed seller, bytes32 depositID, uint256 amount);
    event LockAdded(address indexed buyer, bytes32 indexed lockID, bytes32 depositID, uint256 amount);
    event LockReleased(address indexed buyer, bytes32 lockId);
    event LockReturned(address indexed buyer, bytes32 lockId);

    struct Deposit {
        address seller;
        address token;          // ERC20 stable token address
        uint256 remaining;      // Remaining tokens available
        bool valid;             // Could be invalidated by the seller
        string pixTarget;       // The PIX account for the seller receive transactions
    }

    struct Lock {
        bytes32 depositID;
        address targetAddress;          // Where goes the tokens when validated
        address relayerAddress;         // Relayer address that facilitated this transaction
        uint256 relayerPremium;         // Amount to be paid for relayer
        uint256 amount;                 // Amount to be transfered to buyer
        uint256 expirationBlock;        // If not paid at this block will be expired
    }

    // Default blocks that lock will hold tokens
    uint256 public defaultLockBlocks;
    // List of valid Bacen signature addresses
    mapping(address => bool) public validBacenSigners;

    // Seller list of deposits
    mapping(bytes32 => Deposit) mapDeposits;
    // List of Locks
    mapping(bytes32 => Lock) mapLocks;
    // List of Pix transactions already signed
    mapping(bytes32 => bool) usedTransactions;

    modifier onlySeller(bytes32 depositID) {
        require(mapDeposits[depositID].seller == msg.sender, "P2PIX: Only seller could call this function.");
        _;
    }

    constructor (uint256 defaultBlocks, address[] memory validSigners) {
        defaultLockBlocks = defaultBlocks;
        for (uint8 i = 0; i < validSigners.length; i++){
            validBacenSigners[validSigners[i]] = true;
        }
    }

    // Vendedor precisa mandar token para o smart contract + chave PIX destino. Retorna um DepositID.
    function deposit(
        address token,
        uint256 amount,
        string calldata pixTarget
    ) public returns (bytes32 depositID){
        depositID = keccak256(abi.encodePacked(pixTarget, amount));
        require(!mapDeposits[depositID].valid, 'P2PIX: Deposit already exist and it is still valid');
        // TODO Prevent seller to use same depositID
        // TODO Transfer tokens to this address
        Deposit memory d = Deposit(msg.sender, token, amount, true, pixTarget);
        mapDeposits[depositID] = d;
        emit DepositAdded(msg.sender, depositID, token, amount);
    }

    // Vendedor pode invalidar da ordem de venda impedindo novos locks na mesma (isso não afeta nenhum lock que esteja ativo).
    function cancelDeposit(bytes32 depositID) public onlySeller(depositID) {
        mapDeposits[depositID].valid = false;
        emit DepositClosed(mapDeposits[depositID].seller, depositID);
    }

    // Relayer interaje adicionando um “lock” na ordem de venda.
    // O lock precisa incluir address do comprador + address do relayer + reembolso/premio relayer + valor.
    // **Só poder ter um lock em aberto para cada (ordem de venda, valor)**.
    // Só pode fazer lock de ordens que não estão invalidadas(Passo 5).
    // Essa etapa pode ser feita pelo vendedor conjuntamente com a parte 1.
    // Retorna um LockID.
    function lock(
        bytes32 depositID,
        address targetAddress,
        address relayerAddress,
        uint256 relayerPremium,
        uint256 amount,
        bytes32[] calldata expiredLocks
    ) public returns (bytes32 lockID){
        unlockExpired(expiredLocks);
        Deposit storage d = mapDeposits[depositID];
        require(d.valid, "P2PIX: Deposit not valid anymore");
        require(d.remaining > amount, "P2PIX: Not enough remaining");
        lockID = keccak256(abi.encodePacked(depositID, amount, targetAddress));
        require(
            mapLocks[lockID].expirationBlock < block.number,
            "P2PIX: Another lock with same ID is not expired yet"
        );
        Lock memory l = Lock(
            depositID,
            targetAddress,
            relayerAddress,
            relayerPremium,
            amount,
            block.number+defaultLockBlocks
        );
        mapLocks[lockID] = l;
        d.remaining -= amount;
        emit LockAdded(targetAddress, lockID, depositID, amount);
    }

    // Relayer interage com o smart contract, colocando no calldata o comprovante do PIX realizado.
    // Smart contract valida o comprovante, manda os tokens para o endereço do pagador, e reembolsa o custo do gás para o endereço do relayer especificado na parte (2).
    function release(
        bytes32 lockID,
        uint256 pixTimestamp,
        bytes32 r,
        bytes32 s,
        uint8 v
    ) public {
        // TODO Check if lockID exists and is enabled
        // TODO **Prevenir que um Pix não relacionado ao APP seja usado pois tem o mesmo destino
        Lock storage l = mapLocks[lockID];
        bytes32 message = keccak256(abi.encodePacked(
            mapDeposits[l.depositID].pixTarget,
            l.amount,
            pixTimestamp
        ));
        require(!usedTransactions[message], "Transaction already used to unlock payment.");
        address signer = ecrecover(message, v, r, s);
        require(validBacenSigners[signer], "Signer is not a valid signer.");
        // TODO Transfer token to l.target
        // TODO Transfer relayer fees to relayer
        l.amount = 0;
        usedTransactions[message] = true;
        emit LockReleased(l.targetAddress, lockID);
    }

    // Unlock expired locks
    function unlockExpired(bytes32[] calldata lockIDs) internal {
        uint256 locksSize = lockIDs.length;
        for (uint16 i = 0; i < locksSize; i++){
            Lock storage l = mapLocks[lockIDs[i]];
            require(l.expirationBlock < block.number && l.amount > 0, "P2PIX: Lock not expired or already paid");
            mapDeposits[l.depositID].remaining += l.amount;
            l.amount = 0;
            emit LockReturned(l.targetAddress, lockIDs[i]);
        }
    }

    // Após os locks expirarem, vendedor pode interagir c/ o contrato e recuperar os tokens de um depósito específico.
    function withdraw(
        bytes32 depositID,
        bytes32[] calldata expiredLocks
    ) public onlySeller(depositID) {
        unlockExpired(expiredLocks);
        if (mapDeposits[depositID].valid) cancelDeposit(depositID);
        // TODO Transfer remaining tokens back to the seller
        // Withdraw remaining tokens from mapDeposit[depositID]
        uint256 amount = mapDeposits[depositID].remaining;
        mapDeposits[depositID].remaining = 0;
        emit DepositWithdrawn(msg.sender, depositID, amount);
    }

}