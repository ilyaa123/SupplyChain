// SPDX-License-Identifier: UNLISTENED

pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

import { SourceRegistry } from "./SourceRegistry.sol";

contract DisnanceConsumer is FunctionsClient, SourceRegistry {
    using FunctionsRequest for FunctionsRequest.Request;

    struct LegRequest {
        uint256 legId;
        uint256 legIndex;
    }

    struct OrderRequest {
        uint256 orderId;
    }

    uint64 subscriptionId;
    bytes32 donID;

    mapping(bytes32 reqId => OrderRequest orderId) public pendingOrderRequests;
    mapping(bytes32 reqId => LegRequest legId) public pendingLegRequests;

    constructor(address router, uint64 _subscriptionId, bytes32 _donID) FunctionsClient(router) {
        subscriptionId = _subscriptionId;
        donID = _donID;
    }

    function _sendChainlinkRequest(
        string[] memory args,
        bytes memory encryptedSecretsUrls,
        uint32 callbackGasLimit) private returns (bytes32) {
        string memory source = getSource(sourceId);

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);

        req.setArgs(args);
        req.addSecretsReference(encryptedSecretsUrls);

        return _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            callbackGasLimit,
            donID
        );
    }

    function _requestOrderDistance(uint256 orderId, string[] memory args, bytes memory encryptedSecretsUrls, uint32 callbackGasLimit) internal virtual {
        bytes32 reqId = _sendChainlinkRequest(args, encryptedSecretsUrls, callbackGasLimit);

        pendingOrderRequests[reqId] = OrderRequest({
            orderId: orderId + 1
        });
    }

    function _requestLegDistance(uint256 deliveryId, uint256 legIndex, string[] memory args, bytes memory encryptedSecretsUrls, uint32 callbackGasLimit) internal virtual {
        bytes32 reqId = _sendChainlinkRequest(args, encryptedSecretsUrls, callbackGasLimit);
        
        pendingLegRequests[reqId] = LegRequest({
            legId: deliveryId + 1,
            legIndex: legIndex
        });
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override  {
        if (err.length > 0) return;
        
        uint256 distance = abi.decode(response, (uint256));
        
        OrderRequest memory orderRequest = pendingOrderRequests[requestId];

        if (orderRequest.orderId != 0) {
            delete pendingOrderRequests[requestId];
            _handleOrderDistanceFulfill(orderRequest.orderId - 1, distance);
            return;
        }

        LegRequest memory legRequest = pendingLegRequests[requestId];

        if (legRequest.legId != 0) {
            delete pendingLegRequests[requestId];
            _handleLegDistanceFulfill(legRequest.legId - 1, legRequest.legIndex, distance);
            return;
        }

        revert("Unknown Chainlink requestId");
    }

    function _handleOrderDistanceFulfill(uint256 orderId, uint256 distance) internal virtual {}
    
    function _handleLegDistanceFulfill(uint256 deliveryId, uint256 legIndex, uint256 distance) internal virtual {}
}
