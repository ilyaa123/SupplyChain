// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "@supplychain/chainlink-functions/contracts/DisnanceConsumer.sol";

import "./ISupplyChain.sol";

import "../Shop/IShop.sol";
import "../Warehouse/IBaseWarehouse.sol";
import "../Warehouse/Warehouse/IWarehouse.sol";

import "./SupplyChainDeliveryCalculator/SupplyChainDeliveryCalculator.sol";
import "./SupplyChainOrders/SupplyChainOrders.sol";
import "./SupplyChainDeliveries/SupplyChainDeliveries.sol";
import "./SupplyChainApprovedWarehouses/SupplyChainApprovedWarehouses.sol";

contract SupplyChain is Ownable, ISupplyChain, SupplyChainOrders, SupplyChainDeliveries, SupplyChainDeliveryCalculator, SupplyChainApprovedWarehouses, DisnanceConsumer {
    bytes private encryptedSecretsUrls;

    constructor(address router, uint64 _subscriptionId, bytes32 _donID) Ownable(msg.sender) DisnanceConsumer(router, _subscriptionId, _donID) {}

    function setencryptedSecretsUrls(bytes memory _encryptedSecretsUrls) external onlyOwner {
        encryptedSecretsUrls = _encryptedSecretsUrls;
    }

    function setActiveSource(bytes32 _sourceId) external onlyOwner {
        _setActiveSource(_sourceId);
    }

    function addSource(bytes32 _id, string calldata _sourceCode) external onlyOwner {
        _addSource(_id, _sourceCode);
    }

    function updateSource(bytes32 _id, string calldata _sourceCode) external onlyOwner {
        _updateSource(_id, _sourceCode);
    }

    function removeSource(bytes32 _id) external onlyOwner {
        _removeSource(_id);
    }

    function setRates(uint _baseRate, uint _ratePerKm, uint _ratePerKg) external  onlyOwner {
        _setRates(_baseRate, _ratePerKm, _ratePerKg);
    }

    function setWarehouse(uint256 _warehouseId,  IBaseWarehouse _warehouse) external onlyOwner {
        _setWarehouse(_warehouseId, _warehouse);
    }

    function deleteWarehouse(uint256 _warehouseId) external onlyOwner {
        _deleteWarehouse(_warehouseId);
    }

    function _payForSeller(address seller, uint256 _cost) private returns (bool) {
        (bool sent, ) = payable(seller).call{value: _cost}("");
    
        return sent;
    }

    function _payForCouriers(DeliveryLeg[] memory legs, uint256 deliveryCost) private returns (bool) {
        uint256 totalDistance = 0;

        for (uint256 i = 0; i < legs.length; i++) {
            totalDistance += legs[i].distance;
        }

        require(totalDistance > 0, "Zero total distance");

        for (uint256 i = 0; i < legs.length; i++) {
            uint256 amount = (deliveryCost * legs[i].distance) / totalDistance;

            (bool success, ) = payable(legs[i].courier).call{value: amount}("");
            if (!success) {
                return false;
            }
        }

        return true;
    }

    function getProductIdByDelivery(uint256 _deliveryId) external view returns (uint256 productId) {
        return deliveryProducts[_deliveryId].productId;
    }

    function completeDeliveryOrder(uint256 _deliveryId) external {
        DeliveryProduct storage deliveryProduct = deliveryProducts[_deliveryId];
        DeliveryLeg[] memory legs = deliveryLegs[_deliveryId];
        Order memory order = orders[deliveryProduct.orderId];

        require(!deliveryProduct.completed, "Already completed");
        
        DeliveryLeg memory lastLeg = legs[legs.length - 1];

        require(lastLeg.toWarehouseId == deliveryProduct.toWarehouseId, "Not destination warehouse");
        require(order.paid, "Not payed order");
        require(deliveryProduct.delivered, "Delivery not confirmed"); 
        
        deliveryProduct.completed = true;

        require(_payForSeller(order.seller, order.totalCost), "Seller payment failed");
        require(_payForCouriers(legs, order.deliveryCost), "Courier payments failed");
    }

    function confirmDelivery(uint256 _deliveryId, address buyer) external {
        uint256 warehouseId = IBaseWarehouse(msg.sender).warehouseId();
        require(approvedWarehouses[warehouseId].warehouseType() == WarehouseType.PickUpPoint);

        DeliveryLeg[] memory legs = deliveryLegs[_deliveryId];
        DeliveryProduct storage deliveryProduct = deliveryProducts[_deliveryId];
        Order memory order = orders[deliveryProduct.orderId];

        DeliveryLeg memory lastLeg = legs[legs.length - 1];

        require(lastLeg.toWarehouseId == deliveryProduct.toWarehouseId, "Not destination warehouse");

        require(order.paid, "Not payed order");

        require(order.buyer == buyer, "You are not a buyer");

        deliveryProduct.delivered = true;
    }

    function _handleLegDistanceFulfill(uint256 _deliveryId, uint256 _legIndex, uint256 _distance) internal override {
        deliveryLegs[_deliveryId][_legIndex].distance = _distance;
    }

    function trackMovement(uint256 _deliveryId, address _courier) external {
        uint256 warehouseId = IBaseWarehouse(msg.sender).warehouseId();
        uint256 orderId = deliveryProducts[_deliveryId].orderId;

        DeliveryLeg[] memory legs = deliveryLegs[_deliveryId];
        Order memory order = orders[orderId];
        
        uint256 lastWarehouseId;

        if (legs.length == 0) {
            lastWarehouseId = order.fromWarehouseId;
        } else {
            DeliveryLeg memory lastLeg = legs[legs.length - 1];
            lastWarehouseId = lastLeg.toWarehouseId;
        }

        require(lastWarehouseId != order.toWarehouseId, "Product has been delivered");
        require(address(approvedWarehouses[warehouseId]) == msg.sender, "Invalid Unauthorized warehouserehouse");

        uint256 lastIndexLeg = _createLeg(_deliveryId, _courier, lastWarehouseId, warehouseId);

        (int256 latTo, int256 lonTo) = approvedWarehouses[lastWarehouseId].location();
        (int256 latFrom, int256 lonFrom) = IBaseWarehouse(msg.sender).location();

        string[] memory args = createLocArgs(latTo, lonTo, latFrom, lonFrom);

        _requestLegDistance(_deliveryId, lastIndexLeg, args, encryptedSecretsUrls, 200000);
    }

    function _handleOrderDistanceFulfill(uint256 _orderId, uint256 _distance) internal override {
        uint256 deliveryCost = 0;

        uint256 fromWarehouseId = orders[_orderId].fromWarehouseId;
        uint256[] memory productIds = orders[_orderId].productIds;

        for (uint256 i = 0; i < productIds.length; i++) {
            uint256 itemId = productIds[i];

            WarehouseProduct memory product = approvedWarehouses[fromWarehouseId].products(itemId);

            deliveryCost += calculateDelivery(_distance, product.weightGram, product.volumeCm3);
        }
                
        orders[_orderId].deliveryCost = deliveryCost;
    }

    function createDeliverRequest(uint256 _productId, address _shop, uint256 _toWarehouseId) external {
        uint256 price = IShop(_shop).productPrices(_productId);
        uint256 fromWarehouseId = IShop(_shop).warehouseId();
        (int256 latFrom, int256 lonFrom) = approvedWarehouses[fromWarehouseId].location();
        (int256 latTo, int256 lonTo) = approvedWarehouses[_toWarehouseId].location();

        uint256 count = approvedWarehouses[fromWarehouseId].balanceOf(_shop, _productId);
    
        require(price > 0, "Not found product");
        require(approvedWarehouses[fromWarehouseId].warehouseType() == WarehouseType.Warehouse, "Not a Warehouse");
        require(approvedWarehouses[_toWarehouseId].warehouseType() == WarehouseType.PickUpPoint, "Not a PickUpPoint");

        if (count <= 0) revert("Products not found in warehouse");

        uint256[] memory productIds = new uint256[](1);
        productIds[0] = _productId;
        uint256[] memory prices = new uint256[](1);
        prices[0] = price;

        string[] memory args = createLocArgs(latFrom, lonFrom, latTo, lonTo);

        uint256 orderId = _createOrder(_shop, msg.sender, productIds, prices, fromWarehouseId, _toWarehouseId);

        uint256 deliveryId = _createDelivery(orderId, _productId, _toWarehouseId);

        IWarehouse(address(approvedWarehouses[fromWarehouseId])).reserveForDelivery(deliveryId, _productId, _toWarehouseId);

        _requestOrderDistance(orderId, args, encryptedSecretsUrls, 200000);
    }

    function payDelivery(uint256 _orderId) external payable {
        Order storage order = orders[_orderId];
    
        require(!order.paid, "Order already paid");
        require(msg.value == order.totalCost + order.deliveryCost);

        order.paid = true;
    }

    function createLocArgs(int256 latFrom, int256 lonFrom, int256 latTo, int256 lonTo) private pure returns (string[] memory) {
        string[] memory args = new string[](2);

        args[0] = string(
            abi.encodePacked(
                "[{",
                    "\"lat\":", intToString(latFrom), ",",
                    "\"lon\":", intToString(lonFrom),
                "},{",
                    "\"lat\":", intToString(latTo), ",",
                    "\"lon\":", intToString(lonTo),
                "}]"
            )
        );

        args[1] = string(abi.encodePacked("[0]"));
        return args;
    }

    function intToString(int256 value) private pure returns (string memory) {
        if (value >= 0) {
            return Strings.toString(uint256(value));
        } else {
            return string(abi.encodePacked("-", Strings.toString(uint256(-value))));
        }
    }

}
