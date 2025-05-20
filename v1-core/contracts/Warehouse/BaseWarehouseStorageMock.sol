// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "./BaseWarehouseStorage.sol";

contract BaseWarehouseStorageMock is BaseWarehouseStorage {
    function initialize(string memory uri) public initializer {
        initializeWarehouseStorage(uri);
    }
}