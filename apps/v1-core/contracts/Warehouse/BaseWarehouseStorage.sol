// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./IBaseWarehouseStorage.sol";

contract BaseWarehouseStorage is IBaseWarehouseStorage {

    mapping(uint256 id => WarehouseProduct product) private _products;
    mapping(address owner => mapping(uint256 id => uint256 amount)) private _balances;

    event WarehouseStorageInitialized();

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
        uint256 amount
    );

    function initializeWarehouseStorage() public {
        emit WarehouseStorageInitialized();
    }

    function products(uint256 id) external view returns (WarehouseProduct memory product) {
        return _products[id];
    }

    function balanceOf(address _owner, uint256 _productId) public view returns (uint256) {
        return _balances[_owner][_productId];
    }

    function storeProduct(
        uint256 _productId,
        address _owner,
        uint256 _weightGram,
        uint256 _volumeCm3,
        uint256 _amount
    ) public virtual {
        require(_weightGram > 0 && _volumeCm3 > 0, "Invalid product dimensions");
        require(_amount > 0, "Amount must be positive");

        WarehouseProduct storage product = _products[_productId];

        if (_balances[_owner][_productId] == 0) {
            product.weightGram = _weightGram;
            product.volumeCm3 = _volumeCm3;
        } else {
            require(
                product.weightGram == _weightGram &&
                product.volumeCm3 == _volumeCm3,
                "Product metadata mismatch"
            );
        }

        _balances[_owner][_productId] += _amount;

        emit ProductStored(_productId, _owner, _weightGram, _volumeCm3, _amount);
    }

    function deleteProduct(
        uint256 _productId,
        address _owner,
        uint256 _amount
    ) public virtual {
        require(_balances[_owner][_productId] >= _amount, "Not enough in stock");

        _balances[_owner][_productId] -= _amount;

        if (_balances[_owner][_productId] == 0) {
            delete _products[_productId];
        }

        emit ProductDeleted(_productId, _owner, _amount);
    }
}
