// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import { ERC2771Context } from "@openzeppelin/contracts/metatx/ERC2771Context.sol";

abstract contract ERC2771 is ERC2771Context(address(0)) {
    mapping(address => bool) public trustedForwarders;
    
    function isTrustedForwarder(address forwarder) public view override returns (bool) {
      return trustedForwarders[forwarder];
    }

}
