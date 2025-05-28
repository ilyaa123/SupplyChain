import { expect } from "chai";
import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("ShopFactory", () => {
  const deployShopFactoryFixture = async () => {
    const [owner] = await hre.ethers.getSigners();

    const productRegistry = await hre.viem.deployContract("ProductRegistry");
    const shop = await hre.viem.deployContract("Shop");

    const shopFactory = await hre.viem.deployContract("ShopFactory", [
      shop.address,
      productRegistry.address,
    ]);

    return { owner, shopFactory };
  };

  it("Should create a new shop and emit ShopCreated event", async () => {
    const { shopFactory, owner } = await loadFixture(deployShopFactoryFixture);

    const shopName = "Clone Shop";
    const shopSymbol = "CLN";

    const txHash = await shopFactory.write.createShop([shopName, shopSymbol]);

    const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);

    const iface = new hre.ethers.Interface([
      "event ShopCreated(address indexed owner, address shop)",
    ]);

    const decodedLog = receipt?.logs
      .map((log) => {
        try {
          return iface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log) => log !== null);

    expect(decodedLog).to.exist;
    expect(decodedLog!.args.owner.toLowerCase()).to.equal(
      owner.address.toLowerCase()
    );

    const cloneAddress = decodedLog!.args.shop;

    const clone = await hre.viem.getContractAt("Shop", cloneAddress);
    const actualName = await clone.read.name();
    const actualSymbol = await clone.read.symbol();

    expect(actualName).to.equal(shopName);
    expect(actualSymbol).to.equal(shopSymbol);
  });
});
