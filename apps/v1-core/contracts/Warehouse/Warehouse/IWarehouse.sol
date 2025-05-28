// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "../IBaseWarehouse.sol";

interface IWarehouse is IBaseWarehouse {
    function reserveForDelivery(uint256 _deliveryId, uint256 _productId, uint256 _orderId) external;
}