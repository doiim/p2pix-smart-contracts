// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

library DataTypes {
    struct Lock {
        uint256 counter;
        uint256 expirationBlock;
        bytes32 pixTarget;
        uint80 amount;
        ERC20 token;
        address buyerAddress;
        address seller;
    }

    /// @dev The bank request the attestor replays, rebuilt on-chain:
    ///      `<solicitationUrlPrefix><numeroSolicitacao><solicitationUrlSuffix>`;
    ///      the suffix carries the convênio query as the attestor records it.
    struct BankConfig {
        string solicitationUrlPrefix;
        string solicitationUrlSuffix;
    }

    /// @dev A proof of Pix payment: the Primus attestation of the bank's own
    ///      answer, minus what the contract rebuilds from its settings.
    struct PixProof {
        uint256 numeroSolicitacao;
        address recipient;
        string data;
        uint64 timestamp;
        string additionParams;
        string attConditions;
        address attestor;
        bytes signature;
    }

    // prettier-ignore
    enum LockStatus {
        Inexistent,     // 0 := Uninitialized Lock.
        Active,         // 1 := Valid Lock.
        Expired,        // 2 := Expired Lock.
        Released        // 3 := Already released Lock.
    }
}
