// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

struct ReservedProduct {
    uint256 orderId;
    uint256 productId;
}

contract WarehouseReserve {
    
    mapping(uint256 deliverlyId => ReservedProduct reservedProduct) private _reservedProducts;

    function _storeReserveProduct(uint256 _deliveryId, uint256 _productId, uint256 _orderId) internal {
        _reservedProducts[_deliveryId] = ReservedProduct({
            orderId: _orderId,
            productId: _productId
        });
    }

    function _deleteReserveProduct(uint256 _deliveryId) internal {
        delete _reservedProducts[_deliveryId];
    }
}