// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { JSONParserLib } from "./JSONParserLib.sol";

/// @notice Reads the flat JSON object a Primus attestor reveals in `attestation.data`.
/// @dev Parsing is Solady's `JSONParserLib`. The object maps `keyName` to a string,
///      a bare number or a boolean; `"<key>.count"` companions and key order vary by
///      attestor version and are ignored. A key present twice, a value of any other
///      type, or a value still holding a quote or a backslash after decoding, is
///      refused, so a prover-chosen value can never read as another field.
library PixFields {
    using JSONParserLib for JSONParserLib.Item;
    using JSONParserLib for string;

    bytes1 private constant QUOTE = 0x22; // `"`
    bytes1 private constant BACKSLASH = "\\";

    /// @dev Returns the decoded value of `key` in `root`, or `ok == false`.
    function field(
        JSONParserLib.Item memory root,
        string memory key
    ) internal pure returns (bool ok, bytes memory value) {
        (bool found, JSONParserLib.Item memory hit) = _only(
            root,
            key
        );
        if (!found) return (false, "");
        string memory raw = hit.value();
        if (hit.isString()) {
            value = bytes(_unwrap(raw.decodeString()));
        } else if (hit.isNumber() || hit.isBoolean()) {
            value = bytes(raw);
        } else {
            return (false, "");
        }
        return (_clean(value), value);
    }

    /// @dev The single child of `root` keyed `key`; `found == false` on zero or many.
    function _only(
        JSONParserLib.Item memory root,
        string memory key
    )
        private
        pure
        returns (bool found, JSONParserLib.Item memory hit)
    {
        if (!root.isObject()) return (false, hit);
        bytes32 wanted = keccak256(
            abi.encodePacked(QUOTE, key, QUOTE)
        );
        JSONParserLib.Item[] memory items = root.children();
        uint256 hits;
        for (uint256 i; i < items.length; ++i) {
            if (keccak256(bytes(items[i].key())) != wanted)
                continue;
            hit = items[i];
            ++hits;
        }
        return (hits == 1, hit);
    }

    /// @dev No quote or backslash survives decoding.
    function _clean(
        bytes memory value
    ) private pure returns (bool) {
        for (uint256 k; k < value.length; ++k) {
            if (value[k] == QUOTE || value[k] == BACKSLASH)
                return false;
        }
        return true;
    }

    /// @dev Non-empty, at most `maxLen` bytes, all ASCII digits.
    function isDigits(
        bytes memory s,
        uint256 maxLen
    ) internal pure returns (bool) {
        uint256 len = s.length;
        if (len == 0 || len > maxLen) return false;
        for (uint256 i; i < len; ++i) {
            if (s[i] < "0" || s[i] > "9") return false;
        }
        return true;
    }

    /// @dev Parses `100`, `100.5` or `100.50` into 18-decimal units. Rejects a sign,
    ///      an exponent, `.5`, `1.`, more than 18 fraction digits, more than 40
    ///      integer digits and any other byte.
    function parseDecimal18(
        bytes memory s
    ) internal pure returns (bool ok, uint256 amount) {
        uint256 len = s.length;
        uint256 i;
        uint256 intDigits;
        while (i < len && s[i] >= "0" && s[i] <= "9") {
            amount = amount * 10 + (uint8(s[i]) - 48);
            ++i;
            ++intDigits;
        }
        if (intDigits == 0 || intDigits > 40)
            return (false, 0);
        amount *= 1e18;
        if (i == len) return (true, amount);
        if (s[i] != ".") return (false, 0);
        ++i;
        uint256 fracDigits;
        uint256 scale = 1e17;
        while (i < len && s[i] >= "0" && s[i] <= "9") {
            amount += (uint8(s[i]) - 48) * scale;
            scale /= 10;
            ++i;
            ++fracDigits;
        }
        if (fracDigits == 0 || fracDigits > 18 || i != len)
            return (false, 0);
        return (true, amount);
    }

    function equals(
        bytes memory a,
        string memory b
    ) internal pure returns (bool) {
        return keccak256(a) == keccak256(bytes(b));
    }

    /// @dev Some attestor versions keep a JSON string's own quotes (`"\"abc\""`
    ///      decodes to `"abc"`); one such layer is removed.
    function _unwrap(
        string memory s
    ) private pure returns (string memory) {
        bytes memory v = bytes(s);
        uint256 len = v.length;
        if (len < 2 || v[0] != QUOTE || v[len - 1] != QUOTE)
            return s;
        bytes memory out = new bytes(len - 2);
        for (uint256 k; k < out.length; ++k)
            out[k] = v[k + 1];
        return string(out);
    }
}
