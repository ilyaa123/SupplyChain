// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "../../SupplyChain/ISupplyChain.sol";
import "../../ProductRegistry/IProductRegistry.sol";

import "../IBaseWarehouse.sol";
import "../BaseWarehouseStorage.sol";


contract PickUpPoint is IBaseWarehouse, BaseWarehouseStorage, OwnableUpgradeable {
    ISupplyChain private supplyChain;
    IProductRegistry private productRegistry;

    WarehouseType public warehouseType;
    string public name;

    uint256 public warehouseId;

    int256 public lat;
    int256 public lon;

    event PickUpPointAdded(string name, int256 lat, int256 lon);

    function initialize(uint256 _id, address _supplyChain, address _productRegistry, address _newOwner, string memory _name, int256 _lat, int256 _lon) external initializer {
        __Ownable_init(_newOwner);

        warehouseType = WarehouseType.PickUpPoint;

        warehouseId = _id;
        supplyChain = ISupplyChain(_supplyChain);
        productRegistry = IProductRegistry(_productRegistry);

        name = _name;
        lat = _lat;
        lon = _lon;

        emit PickUpPointAdded(name, lat, lon);
    }

    function location() public view returns (int256, int256) {
        return (lat, lon);
    }

    function receptionProduct(uint256 _deliveryId, address _courier, uint256 _weightGram, uint256 _volumeCm3) external onlyOwner {
        uint256 productId = supplyChain.getProductIdByDelivery(_deliveryId);

        address registeredOwner = productRegistry.products(productId);

        require(registeredOwner != address(0), "Product not found");

        storeProduct(productId, registeredOwner, _weightGram, _volumeCm3, 1);
        
        supplyChain.trackMovement(_deliveryId, _courier);
    }

    function completeProduct(uint256 _deliveryId, address buyer) external onlyOwner {
        uint256 productId = supplyChain.getProductIdByDelivery(_deliveryId);

        address registeredOwner = productRegistry.products(productId);
        
        require(registeredOwner != address(0), "Product not found");

        deleteProduct(productId, registeredOwner, 1);

        supplyChain.confirmDelivery(_deliveryId, buyer);
    }
}
