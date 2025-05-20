// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "../SupplyChain/SupplyChain.sol";

contract SupplyChainMock is SupplyChain {
    constructor() SupplyChain(address(0), 0, 0x0) {}

    function _requestOrderDistance(uint256 orderId, string[] memory args, bytes memory, uint32) internal override {
        emit MockOrderRequested(orderId, args[0]);
    }

    function _requestLegDistance(uint256 deliveryId, uint256 legIndex, string[] memory args, bytes memory, uint32) internal override {
        emit MockLegRequested(deliveryId, legIndex, args[0]);
    }

    function handleMockOrderDistance(uint256 orderId, uint256 distance) external {
        _handleOrderDistanceFulfill(orderId, distance);
    }

    function handleMockLegDistance(uint256 deliveryId, uint256 legIndex, uint256 distance) external {
        _handleLegDistanceFulfill(deliveryId, legIndex, distance);
    }

    event MockOrderRequested(uint256 orderId, string arg0);
    event MockLegRequested(uint256 deliveryId, uint256 legIndex, string arg0);
}
