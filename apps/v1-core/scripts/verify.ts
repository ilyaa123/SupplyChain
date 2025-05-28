import hre from "hardhat";

async function main() {
  const verify = async (name: string, address: string, args: any[] = []) => {
    console.log(`🔍 Verifying ${name} at ${address}...`);
    try {
      await hre.run("verify:verify", {
        address,
        constructorArguments: args,
      });
      console.log(`✅ ${name} verified`);
    } catch (e: any) {
      if (e.message.toLowerCase().includes("already verified")) {
        console.log(`⚠️ ${name} already verified`);
      } else {
        console.error(`❌ Failed to verify ${name}:`, e.message);
      }
    }
  };

  const ProductRegistry = "0x9Cd842C705a1BAb93218Bf94DaE77D62cDDee69A";
  const SupplyChain = "0x6c6437EBdC6fC045B185Eb2d5B993cA98b2908dE";
  const Shop = "0x51DF3905dBcD3D9EEFF44b6D4A28b0aB9e9C511d";
  const ShopFactory = "0xe0afEB550DA385F2c43833f14a5c662a64Abf67D";
  const Warehouse = "0xb5889cfCed2835B970785aC40912F0e9b0ecD46f";
  const PickUpPoint = "0x1DD8491D85e79f646d7f4ed77303da927307aAd6";
  const SortingCenter = "0x665343e2112FB6F5489bb1c77987D095e36Bd2C9";
  const SupplyChainWarehouseFactory =
    "0x99a9bdfBe066A51736b3037A3dAEAf6B56E52D02";

  const router = process.env.SEPOLIA_CHAINLINK_ROUTER!;
  const subId = Number(process.env.SEPOLIA_SUBSCRUPTION_ID!);
  const donId = process.env.SEPOLIA_DON_ID! as `0x${string}`;

  // await verify("ProductRegistry", ProductRegistry);
  // await verify("SupplyChain", SupplyChain, [router, subId, donId]);
  // await verify("Shop", Shop);
  // await verify("ShopFactory", ShopFactory, [
  //   Shop,
  //   SupplyChain,
  //   ProductRegistry,
  // ]);
  await verify("Warehouse", Warehouse);
  await verify("SortingCenter", SortingCenter);
  await verify("PickUpPoint", PickUpPoint);
  await verify("SupplyChainWarehouseFactory", SupplyChainWarehouseFactory, [
    SupplyChain,
    ProductRegistry,
  ]);
}

main().catch((err) => {
  console.error("❌ Error in verify script:", err);
  process.exit(1);
});
