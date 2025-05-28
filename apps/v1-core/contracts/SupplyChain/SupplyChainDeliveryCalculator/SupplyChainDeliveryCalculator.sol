// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

contract SupplyChainDeliveryCalculator {
    uint256 public baseRate = 1e15;
    uint256 public ratePerKm = 1e14;
    uint256 public ratePerGram = 5e10;

    function calculateDelivery(uint256 distanceMeters, uint256 weightGrams, uint256 volumeCm3) public view returns (uint256) {
        uint256 volumetricWeightGrams = volumeCm3 / 5;

        uint256 chargeableWeightGrams = weightGrams > volumetricWeightGrams
            ? weightGrams
            : volumetricWeightGrams;

        uint256 distanceCost = distanceMeters * ratePerKm / 1000;
        uint256 weightCost = chargeableWeightGrams * ratePerGram;
        uint256 totalCost = baseRate + distanceCost + weightCost;

        return totalCost;
    }

    /// @dev Изменение тарифов (в wei)
    function _setRates(uint256 _baseRateWei, uint256 _ratePerKmWei, uint256 _ratePerGramWei) internal virtual {
        baseRate = _baseRateWei;
        ratePerKm = _ratePerKmWei;
        ratePerGram = _ratePerGramWei;
    }
}
