// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

interface IShop {
    function initialize(address _productRegistry, address _newOwner, string memory _name, string memory _symbol) external;

    function productPrices(uint256 productId) external view returns (uint256 price);

    function warehouseId() external view returns (uint256);
}