import * as dotenv from "dotenv";

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

dotenv.config();

const SupplyChainModule = buildModule("SupplyChainModule", (m) => {
  const router = process.env.SEPOLIA_CHAINLINK_ROUTER!;
  const subscriptionId = Number(process.env.SEPOLIA_SUBSCRUPTION_ID!);
  const donId = process.env.SEPOLIA_DON_ID! as `0x${string}`;

  // const productRegistry = m.contract("ProductRegistry");
  const productRegistry = m.contractAt(
    "ProductRegistry",
    "0x9Cd842C705a1BAb93218Bf94DaE77D62cDDee69A"
  );
  const supplyChain = m.contractAt(
    "SupplyChain",
    "0x6c6437EBdC6fC045B185Eb2d5B993cA98b2908dE"
  );

  // const supplyChain = m.contract("SupplyChain", [
  //   router,
  //   subscriptionId,
  //   donId,
  // ]);

  // const Shop = m.contract("Shop");
  // const ShopFactory = m.contract("ShopFactory", [
  //   Shop,
  //   supplyChain,
  //   productRegistry,
  // ]);

  const Warehouse = m.contract("Warehouse");
  const SortingCenter = m.contract("SortingCenter");
  const PickUpPoint = m.contract("PickUpPoint");

  const SupplyChainWarehouseFactory = m.contract(
    "SupplyChainWarehouseFactory",
    [supplyChain, productRegistry]
  );

  return {
    // productRegistry,
    // supplyChain,
    // Shop,
    // ShopFactory,
    Warehouse,
    SortingCenter,
    PickUpPoint,
    SupplyChainWarehouseFactory,
  };
});

export default SupplyChainModule;

// const SupplyChainModule = buildModule("SupplyChainModule", (m) => {
//   const productRegistry = m.contractAt(
//     "ProductRegistry",
//     "0x4c650b89d9fe7af6e2c5f44ef6175f6a30b06215"
//   );
//   const supplyChain = m.contractAt(
//     "SupplyChain",
//     "0x312c0d0097b46c9f4b1638b1d1a51d8f79648100"
//   );

//   const Shop = m.contract("Shop");
//   const ShopFactory = m.contract("ShopFactory", [
//     Shop,
//     supplyChain,
//     productRegistry,
//   ]);

//   return {
//     Shop,
//     ShopFactory,
//   };
// });

// export default SupplyChainModule;
