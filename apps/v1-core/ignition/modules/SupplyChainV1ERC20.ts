import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SupplyChainTokenModule = buildModule("SupplyChainTokenModule", (m) => {
  const token = m.contract("SupplyChainV1ERC20");

  return { token };
});

export default SupplyChainTokenModule;
