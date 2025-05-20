// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

struct Order {
    address seller;
    address buyer;
    uint256[] productIds;
    uint256 totalCost;
    uint256 deliveryCost;
    uint256 fromWarehouseId;
    uint256 toWarehouseId;
    bool paid;
}

contract SupplyChainOrders {
    uint256 private orderIterator;

    mapping(uint256 orderId => Order order) public orders;

    function _createOrder(address _seller, address _buyer, uint256[] memory _productIds, uint256[] memory _prices, uint256 _fromWarehouseId, uint256 _toWarehouseId) internal returns (uint256) {
        require(_productIds.length == _prices.length, "Length mismatch");

        uint256 totalCost = 0;

        for (uint256 i = 0; i < _prices.length; i++) {
            totalCost += _prices[i];
        }

        uint256 orderId = ++orderIterator;

        orders[orderId] = Order({
            seller: _seller,
            buyer: _buyer,
            productIds: _productIds,
            totalCost: totalCost,
            deliveryCost: 0,
            fromWarehouseId: _fromWarehouseId,
            toWarehouseId: _toWarehouseId,
            paid: false
        });

        return orderId;
    }
}
