// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "./SupplyChainApprovedWarehouses.sol";

contract SupplyChainApprovedWarehousesMock is SupplyChainApprovedWarehouses {
    function setWarehouse(uint256 _warehouseId,  IBaseWarehouse _warehouse) external {
        _setWarehouse(_warehouseId, _warehouse);
    }

    function deleteWarehouse(uint256 _warehouseId) external {
        _deleteWarehouse(_warehouseId);
    }
}