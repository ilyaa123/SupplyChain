// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract DisnanceConsumerMock {
    uint256 public lastOrderId;
    string[] public lastOrderArgs;

    uint256 public lastDeliveryId;
    uint256 public lastLegIndex;
    string[] public lastLegArgs;

    function _requestOrderDistance(uint256 orderId, string[] memory args, bytes memory, uint32) internal virtual {
        lastOrderId = orderId;
        lastOrderArgs = args;
    }

    function _requestLegDistance(uint256 deliveryId, uint256 legIndex, string[] memory args, bytes memory, uint32) internal virtual {
        lastDeliveryId = deliveryId;
        lastLegIndex = legIndex;
        lastLegArgs = args;
    }

    function _handleOrderDistanceFulfill(uint256, uint256) internal virtual {}
    function _handleLegDistanceFulfill(uint256, uint256, uint256) internal virtual {}
}
