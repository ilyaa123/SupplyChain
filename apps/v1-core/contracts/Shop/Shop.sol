// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";

import "../SupplyChain/ISupplyChain.sol";
import "../ProductRegistry/IProductRegistry.sol";

import "./IShop.sol";

contract Shop is IShop, Initializable, OwnableUpgradeable, ERC1155HolderUpgradeable {
    IProductRegistry private productRegistry;

    string public name;
    string public symbol;

    uint256 public warehouseId;

    mapping(uint256 productId => string url) public products;
    mapping(uint256 productId => uint256 price) public productPrices;

    receive() external payable {
        (bool success, ) = payable(owner()).call{value: msg.value}("");
        require(success, "Forward to owner failed");
    }

    function initialize(address _productRegistry, address _newOwner, string memory _name, string memory _symbol) external initializer {
        name = _name;
        symbol = _symbol;
        __Ownable_init(_newOwner);
        __ERC1155Holder_init();

        productRegistry = IProductRegistry(_productRegistry);
    }

    function setWarehouse(uint256 _warehouseId) external onlyOwner {
        warehouseId = _warehouseId;
    }

    function deleteProduct(uint256 _productId) external onlyOwner {
        address owner = productRegistry.products(_productId);

        require(owner == address(this), "Product not registered to this shop");
        require(productPrices[_productId] > 0, "Product price not found in shop");

        delete products[_productId];
        delete productPrices[_productId];
    }

    function createProduct(uint256 _pricePerUnit, string calldata _tokenUri) external onlyOwner {
        uint256 _productId = productRegistry.createProduct(address(this));

        products[_productId] = _tokenUri;
        productPrices[_productId] = _pricePerUnit;
    }
}
