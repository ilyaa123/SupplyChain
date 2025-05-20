// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/proxy/Clones.sol";

interface IShop {
    function initialize(address _supplyChain, address _productRegistry, address _newOwner, string memory _name, string memory _symbol) external;
}

contract ShopFactory {
    using Clones for address;

    address private supplyChain;
    address private productRegistry;

    address public immutable implementation;

    event ShopCreated(address indexed owner, address shop);

    constructor(address _implementation, address _supplyChain, address _productRegistry) {
        implementation = _implementation;
        supplyChain = _supplyChain;
        productRegistry = _productRegistry;
    }

    function createShop(string memory _name, string memory _symbol) external returns (address) {
        address clone = implementation.clone();

        IShop(clone).initialize(supplyChain, productRegistry, msg.sender, _name, _symbol);

        emit ShopCreated(msg.sender, clone);
        return clone;
    }
}
