// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4;

/// @title Counters
/// @author buf0t9
/// @author Modified from OpenZeppelin Contracts
/// (https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Counters.sol)
/// @notice Provides counters that can only be incremented, decrementedor reset.
/// @dev Include with `using Counters for Counters.Counter;`
library Counters {
    // solhint-disable no-inline-assembly
    struct Counter {
        /// @dev Interactions must be restricted to the library's function.
        uint256 _val; // := 0
    }

    /// @dev 0xce3a3d37
    error DecOverflow();

    function current(
        Counter storage counter
    ) internal view returns (uint256 _val) {
        assembly {
            _val := sload(counter.slot)
        }
    }

    function increment(Counter storage counter) internal {
        assembly {
            let _val := sload(counter.slot)
            sstore(counter.slot, add(_val, 0x01))
        }
    }

    function decrement(Counter storage counter) internal {
        assembly {
            let _val := sload(counter.slot)
            if or(iszero(_val), lt(_val, 0x00)) {
                mstore(0x00, 0xce3a3d37)
                revert(0x1c, 0x04)
            }
            sstore(counter.slot, sub(_val, 0x01))
        }
    }

    function reset(Counter storage counter) internal {
        assembly {
            sstore(counter.slot, 0)
        }
    }
}
