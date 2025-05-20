// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "../SupplyChain/SupplyChain.sol";

import "./IBaseWarehouse.sol";

contract SupplyChainWarehouseFactory is Ownable {
    using Clones for address;
    
    address private supplyChain;
    address private productRegistry;
    
    mapping (WarehouseType warehouseType => address implementation) implementations;

    uint256 public warehouseCounter;

    event WarehouseCreated(address indexed owner, address warehouse);

    constructor (address _supplyChain, address _productRegistry) Ownable(msg.sender) {
        supplyChain = _supplyChain;
        productRegistry = _productRegistry;
    }

    function setImplementation(WarehouseType _warehouseType, address _implementation) external onlyOwner {
        require(_implementation != address(0), "Invalid implementation address");
        implementations[_warehouseType] = _implementation;
    }

    function removeImplementation(WarehouseType _warehouseType) external onlyOwner {
        require(implementations[_warehouseType] != address(0), "Implementation not set");
        delete implementations[_warehouseType];
    }

    function createWarehouse(WarehouseType _warehouseType, string memory _name, string memory url, int256 _lat, int256 _lon) external returns (address) {
        require(implementations[_warehouseType] != address(0), "Implementation not set");
        
        address clone = implementations[_warehouseType].clone();
        
        IBaseWarehouse(clone).initialize(++warehouseCounter, supplyChain, productRegistry, msg.sender, _name, url, _lat, _lon);

        emit WarehouseCreated(msg.sender, clone);

        return clone;
    }
}