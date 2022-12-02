// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import { IReputation } from "./lib/interfaces/IReputation.sol";
import { Owned } from "./lib/auth/Owned.sol";
import { FixedPointMathLib as WADMath } from "./lib/utils/FixedPointMathLib.sol";


contract Reputation is 
  IReputation, 
  Owned(msg.sender) 
{

  using WADMath for uint256;

  /// @dev Asymptote numerator constant value for the `limiter` fx.
  uint256 constant public maxLimit = 1e6; 
  /// @dev Denominator's constant operand for the `limiter` fx. 
  uint256 constant public magicValue = 2.5e11;

  constructor(/*  */) {/*  */}

  function limiter(uint256 _userCredit) 
  external 
  pure 
  override(IReputation)
  returns(uint256 _spendLimit) 
  {
    // _spendLimit = 1 + ( ( maxLimit * _userCredit ) / sqrt( magicValue * ( _userCredit * _userCredit ) ) );
    // return _spendLimit;


    unchecked {
      uint256 numeratorWad = 
        maxLimit.mulWadDown(_userCredit);
      uint256 userCreditSquaredWad = 
        _userCredit.mulWadDown(_userCredit);
      uint256 denominatorSqrtWad = 
        (userCreditSquaredWad.mulWadDown(magicValue)).sqrt();
      
      _spendLimit = (1 + (numeratorWad).divWadDown(denominatorSqrtWad));
    }
  }

}
