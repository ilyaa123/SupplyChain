// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/proxy/Clones.sol";

import "./IShop.sol";

contract ShopFactory {
    using Clones for address;

    address private productRegistry;

    address public immutable implementation;

    event ShopCreated(address indexed owner, address shop);

    constructor(address _implementation, address _productRegistry) {
        implementation = _implementation;
        productRegistry = _productRegistry;
    }

    function createShop(string memory _name, string memory _symbol) external returns (address) {
        address clone = implementation.clone();

        IShop(clone).initialize(productRegistry, msg.sender, _name, _symbol);

        emit ShopCreated(msg.sender, clone);
        return clone;
    }
}
