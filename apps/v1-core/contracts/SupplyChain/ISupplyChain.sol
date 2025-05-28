// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

interface ISupplyChain {
    function getProductIdByDelivery(uint256 _deliveryId) external view returns (uint256 productId);

    function trackMovement(uint256 _deliveryId, address _courier) external;

    function confirmDelivery(uint256 _deliveryId, address buyer) external;

    function createDeliverRequest(uint256 _productId, address _shop, uint256 _toWarehouseId) external;
}