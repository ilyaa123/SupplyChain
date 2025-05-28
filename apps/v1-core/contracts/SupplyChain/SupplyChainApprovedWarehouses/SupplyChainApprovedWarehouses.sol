// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "../../Warehouse/IBaseWarehouse.sol";

contract SupplyChainApprovedWarehouses {

    mapping (uint256 warehouseId => IBaseWarehouse warehouse) public approvedWarehouses;

    function _setWarehouse(uint256 _warehouseId,  IBaseWarehouse _warehouse) internal virtual {
        approvedWarehouses[_warehouseId] = _warehouse;
    }

    function _deleteWarehouse(uint256 _warehouseId) internal virtual {
        delete approvedWarehouses[_warehouseId];
    }
}