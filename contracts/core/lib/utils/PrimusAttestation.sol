// SPDX-License-Identifier: MIT
// Encoding ported from primus-labs/network-contracts (src/lib/PrimusZKTLS.sol, MIT).
pragma solidity ^0.8.19;

/// @notice Rebuilds the digest a Primus network attestor signs over an attestation.
/// @dev `encodeAttestation` there is
///      keccak256(abi.encodePacked(recipient, encodeRequest(request), encodeResponse(responseResolve),
///                                 data, attConditions, timestamp, additionParams))
///      with `encodeRequest` one keccak over url‖header‖method‖body of every request and
///      `encodeResponse` one keccak over keyName‖parseType‖parsePath of every resolve.
///      The attestor signs the raw digest: no EIP-191 prefix, no EIP-712 domain.
library PrimusAttestation {
    /// @dev `encodeRequest` for requests that share header, method and body.
    function requestHash(
        string[] memory urls,
        string memory header,
        string memory method,
        string memory body
    ) internal pure returns (bytes32) {
        bytes memory packed;
        uint256 len = urls.length;
        for (uint256 i; i < len; ++i) {
            packed = abi.encodePacked(
                packed,
                urls[i],
                header,
                method,
                body
            );
        }
        return keccak256(packed);
    }

    /// @dev `encodeAttestation` given the two inner hashes.
    function digest(
        address recipient,
        bytes32 reqHash,
        bytes32 resolvesHash,
        string calldata data,
        string calldata attConditions,
        uint64 timestamp,
        string calldata additionParams
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    recipient,
                    reqHash,
                    resolvesHash,
                    data,
                    attConditions,
                    timestamp,
                    additionParams
                )
            );
    }
}
