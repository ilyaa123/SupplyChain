// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

import "./IBaseWarehouseStorage.sol";

contract BaseWarehouseStorage is IBaseWarehouseStorage, ERC1155Upgradeable {
    
    mapping(uint256 id => WarehouseProduct product) private _products;
    
    event WarehouseStorageInitialized(string uri);

    event ProductStored(
        uint256 indexed productId,
        address indexed owner,
        uint256 weightGram,
        uint256 volumeCm3,
        uint256 amount
    );

    event ProductDeleted(
        uint256 indexed productId,
        address indexed owner,
        uint256 amount,
        bool productMetadataDeleted
    );

    function initializeWarehouseStorage(string memory uri) public {
        __ERC1155_init(uri);

        emit WarehouseStorageInitialized(uri);
    }

    function products(uint256 id) external view returns (WarehouseProduct memory product) {
        return _products[id];
    }

    function balanceOfProduct(address _owner, uint256 _productId) external view returns (uint256) {
        return balanceOf(_owner, _productId);
    }

    function storeProduct(uint256 _productId, address _owner, uint256 _weightGram, uint256 _volumeCm3, uint256 _amount) public virtual {
        require(_weightGram > 0 && _volumeCm3 > 0, "Invalid product dimensions");

        WarehouseProduct storage product = _products[_productId];

        if (balanceOf(_owner, _productId) == 0) {
            product.weightGram = _weightGram;
            product.volumeCm3 = _volumeCm3;
        } else {
            require(product.weightGram == _weightGram && product.volumeCm3 == _volumeCm3, "Product metadata mismatch");
        }

        _mint(_owner, _productId, _amount, "");

        emit ProductStored(_productId, _owner, _weightGram, _volumeCm3, _amount);
    }

    function deleteProduct(uint256 _productId, address _owner, uint256 _amount) public virtual {
        require(balanceOf(_owner, _productId) >= _amount, "Not enough in stock");
        
        _burn(_owner, _productId, _amount);

        bool metadataDeleted = false;
        if (balanceOf(_owner, _productId) == 0) {
            delete _products[_productId];
            metadataDeleted = true;
        }

        emit ProductDeleted(_productId, _owner, _amount, metadataDeleted);
    }
}