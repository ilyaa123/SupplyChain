// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract SupplyChainV1ERC20 is ERC20("SupplyChain V1", "SC-1"), ERC20Permit("SupplyChain V1") {}