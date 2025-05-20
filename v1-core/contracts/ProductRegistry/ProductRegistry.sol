// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "./IProductRegistry.sol";

contract ProductRegistry is IProductRegistry {

    uint256 private productIterator;

    mapping (uint256 productId => address owner) public products;

    function createProduct(address _owner) external returns (uint256) {
        productIterator++;
        
        require(_owner != address(0), "Zero owner");

        products[productIterator] = _owner;

        return productIterator;
    }

    function deleteProduct(uint256 _productId) external {
        delete products[_productId];
    }

}