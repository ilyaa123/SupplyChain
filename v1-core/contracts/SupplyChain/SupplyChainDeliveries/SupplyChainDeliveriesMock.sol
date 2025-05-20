// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./SupplyChainDeliveries.sol";

contract SupplyChainDeliveriesMock is SupplyChainDeliveries {
    function createDelivery(uint256 orderId, uint256 productId, uint256 toWarehouseId) external returns (uint256) {
        return _createDelivery(orderId, productId, toWarehouseId);
    }

    function createDeliveries(uint256 orderId, uint256[] calldata productIds, uint256 toWarehouseId) external returns (uint256[] memory) {
        return _createDeliveries(orderId, productIds, toWarehouseId);
    }

    function createLeg(uint256 deliveryId, address courier, uint256 fromWarehouseId, uint256 toWarehouseId) external returns (uint256) {
        return _createLeg(deliveryId, courier, fromWarehouseId, toWarehouseId);
    }

    function getDeliveryProduct(uint256 deliveryId) external view returns (DeliveryProduct memory) {
        return deliveryProducts[deliveryId];
    }

    function getDeliveryLegs(uint256 deliveryId) external view returns (DeliveryLeg[] memory) {
        return deliveryLegs[deliveryId];
    }
}
