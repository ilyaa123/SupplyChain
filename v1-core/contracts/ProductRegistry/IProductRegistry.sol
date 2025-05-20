// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

interface IProductRegistry {

    function products(uint256 _productId) external view returns (address owner);

    function createProduct(address _owner) external returns (uint256 productId) ;

    function deleteProduct(uint256 _productId) external;
}