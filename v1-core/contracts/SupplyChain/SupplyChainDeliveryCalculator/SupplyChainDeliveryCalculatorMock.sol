// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "./SupplyChainDeliveryCalculator.sol";

contract SupplyChainDeliveryCalculatorMock is SupplyChainDeliveryCalculator {
    function setRates(uint256 _baseRateWei, uint256 _ratePerKmWei, uint256 _ratePerGramWei) external {
        _setRates(_baseRateWei, _ratePerKmWei, _ratePerGramWei);
    }
}