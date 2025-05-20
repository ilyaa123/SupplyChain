// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "../../SupplyChain/ISupplyChain.sol";
import "../../ProductRegistry/IProductRegistry.sol";

import "../BaseWarehouseStorage.sol";

import "./WarehouseReserve.sol";
import "./IWarehouse.sol";

contract Warehouse is IWarehouse, BaseWarehouseStorage, WarehouseReserve, OwnableUpgradeable {
    ISupplyChain private supplyChain;
    IProductRegistry private productRegistry;

    WarehouseType public warehouseType;
    string public name;

    uint256 public warehouseId;

    int256 public lat;
    int256 public lon;

    event WarehouseAdded(string name, int256 lat, int256 lon);
    event WarehouseUpdated(uint256 indexed id, string name, int256 lat, int256 lon);

    function initialize(uint256 _id, address _supplyChain, address _productRegistry, address _newOwner, string memory _name, string memory url, int256 _lat, int256 _lon) external initializer {
        __Ownable_init(_newOwner);
        initializeWarehouseStorage(url);

        warehouseType = WarehouseType.Warehouse;

        warehouseId = _id;
        supplyChain = ISupplyChain(_supplyChain);
        productRegistry = IProductRegistry(_productRegistry);

        name = _name;
        lat = _lat;
        lon = _lon;

        emit WarehouseAdded(name, lat, lon);
    }

    function location() public view returns (int256, int256) {
        return (lat, lon);
    }

    function takeProduct(uint256 _productId, uint256 _weightGram, uint256 _volumeCm3, uint256 _amount) external onlyOwner {
        address registeredOwner = productRegistry.products(_productId);

        require(registeredOwner != address(0), "Product not found");

        storeProduct(_productId, registeredOwner, _weightGram, _volumeCm3, _amount);
    }

    function refundProducts(uint256 _productId, uint256 _amount) external onlyOwner {
        address registeredOwner = productRegistry.products(_productId);

        require(registeredOwner != address(0), "Product not found");

        deleteProduct(_productId, registeredOwner, _amount);
    }

    function sendProduct(uint256 _deliveryId) external onlyOwner {
        _deleteReserveProduct(_deliveryId);
    }

    function reserveForDelivery(uint256 _deliveryId, uint256 _productId, uint256 _orderId) public {
        require(msg.sender == address(supplyChain));

        address registeredOwner = productRegistry.products(_productId);

        require(registeredOwner != address(0), "Product not found");
        require(balanceOf(registeredOwner, _productId) >= 1, "Not enough in stock");

        _storeReserveProduct(_deliveryId, _productId, _orderId);

        _burn(registeredOwner, _productId, 1);
    }
}
