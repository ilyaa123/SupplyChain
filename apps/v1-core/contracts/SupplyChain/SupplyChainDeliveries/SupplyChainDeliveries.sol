// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

struct DeliveryProduct {
    uint256 orderId;
    uint256 productId;
    uint256 toWarehouseId;
    bool delivered;
    bool completed;
}

struct DeliveryLeg {
    address courier;
    uint256 fromWarehouseId;
    uint256 toWarehouseId;
    uint256 distance;
}

contract SupplyChainDeliveries {
    uint256 private deliveryProductIterator;

    mapping(uint256 deliveryId => DeliveryLeg[]) public deliveryLegs;
    mapping(uint256 deliveryId => DeliveryProduct deliveryProduct) public deliveryProducts;
    
    function _createLeg(uint256 _deliveryId, address _courier, uint256 _fromWarehouseId, uint256 _toWarehouseId) internal returns(uint256 lastIndex) {
        deliveryLegs[_deliveryId].push(DeliveryLeg({
            courier: _courier,
            fromWarehouseId: _fromWarehouseId,
            toWarehouseId: _toWarehouseId,
            distance: 0
        }));

        return deliveryLegs[_deliveryId].length - 1;
    }

    function _createDelivery(uint256 _orderId, uint256 _productId, uint256 _toWarehouseId) internal returns (uint256 deliveryId) {
        deliveryId = ++deliveryProductIterator;

        deliveryProducts[deliveryId] = DeliveryProduct({
            orderId: _orderId,
            productId: _productId,
            toWarehouseId: _toWarehouseId,
            delivered: false,
            completed: false
        });

        return deliveryId;
    }

    function _createDeliveries(uint256 _orderId, uint256[] memory _productIds, uint256 _toWarehouseId) internal returns (uint256[] memory deliveryIds) {
        uint256[] memory _deliveryIds = new uint256[](_productIds.length);

        for (uint256 i = 0; i < _productIds.length; i++) {
            uint256 deliveryId = _createDelivery(_orderId, _productIds[i], _toWarehouseId);

            _deliveryIds[i] = deliveryId;
        }

        return _deliveryIds;
    }
}
