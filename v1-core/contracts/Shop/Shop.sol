// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";


import "../SupplyChain/ISupplyChain.sol";
import "../ProductRegistry/IProductRegistry.sol";

contract Shop is Initializable, OwnableUpgradeable, ERC721URIStorageUpgradeable, ERC1155HolderUpgradeable {
    ISupplyChain public supplyChain;
    IProductRegistry private productRegistry;

    uint256 private warehouseId;

    mapping(uint256 => uint256) public productPrices;

    receive() external payable {
        (bool success, ) = payable(owner()).call{value: msg.value}("");
        require(success, "Forward to owner failed");
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155HolderUpgradeable, ERC721URIStorageUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function initialize(address _supplyChain, address _productRegistry, address _newOwner, string memory _name, string memory _symbol) external initializer {
        __ERC721_init(_name, _symbol);
        __Ownable_init(_newOwner);
        __ERC1155Holder_init();

        supplyChain = ISupplyChain(_supplyChain);
        productRegistry = IProductRegistry(_productRegistry);
    }

    function setWarehouse(uint256 _warehouseId) external onlyOwner {
        warehouseId = _warehouseId;
    }

    function deleteProduct(uint256 _productId) external onlyOwner {
        address owner = productRegistry.products(_productId);

        require(owner == address(this), "Product not registered to this shop");
        require(ownerOf(_productId) == address(this), "Product not held by owner");

        _burn(_productId);
        delete productPrices[_productId];
    }

    function createProduct(uint256 _pricePerUnit, string calldata _tokenUri) external onlyOwner {
        uint256 tokenId = productRegistry.createProduct(address(this));

        _mint(address(this), tokenId);
        _setTokenURI(tokenId, _tokenUri);
        productPrices[tokenId] = _pricePerUnit;
    }

    function createOrder(uint256 productId, uint256 toWarehouseId) external {
        supplyChain.createDeliverRequest(productId, productPrices[productId], warehouseId, toWarehouseId, msg.sender);
    }
}
