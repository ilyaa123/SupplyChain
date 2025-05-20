// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

struct WarehouseProduct {
    uint256 weightGram;
    uint256 volumeCm3;
}

interface IBaseWarehouseStorage {

    function products(uint256 id) external view returns (WarehouseProduct memory product);

    function balanceOfProduct(address _owner, uint256 _productId) external view returns (uint256);
}