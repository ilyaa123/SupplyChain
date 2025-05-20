// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "./SupplyChainOrders.sol";

contract SupplyChainOrdersMock is SupplyChainOrders {
    function createOrderPublic(
        address _seller,
        address _buyer,
        uint256[] memory _productIds,
        uint256[] memory _prices,
        uint256 _fromWarehouseId,
        uint256 _toWarehouseId
    ) external returns (uint256) {
        return _createOrder(_seller, _buyer, _productIds, _prices, _fromWarehouseId, _toWarehouseId);
    }
}