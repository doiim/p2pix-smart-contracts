// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;


interface IReputation {

  function limiter(uint256 _userCredit) 
  external 
  pure 
  returns(uint256 _spendLimit);

}
