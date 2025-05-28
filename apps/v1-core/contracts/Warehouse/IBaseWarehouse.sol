// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "./IBaseWarehouseStorage.sol";

enum WarehouseType {
    Warehouse,
    PickUpPoint,
    SortingCenter
}

interface IBaseWarehouse is IBaseWarehouseStorage {

    function initialize(uint256 _id, address _supplyChain, address _productRegistry, address _newOwner, string memory _name, int256 _lat, int256 _lon) external;

    function warehouseId() external view returns (uint256);

    function warehouseType() external view returns (WarehouseType);

    function name() external view returns (string memory);

    function lat() external view returns (int256);

    function lon() external view returns (int256);

    function location() external view returns (int256, int256);
}