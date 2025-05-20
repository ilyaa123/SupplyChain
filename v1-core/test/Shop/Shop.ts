import { expect } from "chai";
import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("Shop", () => {
  const deployShopFixture = async () => {
    const [owner] = await hre.ethers.getSigners();

    const publicClient = await hre.viem.getPublicClient();

    const shop = await hre.viem.deployContract("Shop");

    const productRegistry = await hre.viem.deployContract("ProductRegistry");

    const tx = await shop.write.initialize([
      hre.ethers.ZeroAddress as `0x${string}`,
      productRegistry.address,
      owner.address as `0x${string}`,
    ]);

    await publicClient.waitForTransactionReceipt({ hash: tx });

    return { owner, shop, productRegistry, publicClient };
  };

  it("Should create a product with price and URI", async () => {
    const { shop, publicClient } = await loadFixture(deployShopFixture);

    const tx = await shop.write.createProduct([5000n, "ipfs://test-token"]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    const price = await shop.read.productPrices([1n]);
    expect(price).to.equal(5000n);
  });

  it("Should delete a product correctly", async () => {
    const { shop, productRegistry, publicClient } = await loadFixture(
      deployShopFixture
    );

    let tx = await shop.write.createProduct([1000n, "ipfs://delete-me"]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    const productId = 1n;

    const registryOwner = await productRegistry.read.products([productId]);
    const shopAddress = shop.address;
    expect(registryOwner.toLowerCase()).to.equal(shopAddress.toLowerCase());

    tx = await shop.write.deleteProduct([productId]);
    await publicClient.waitForTransactionReceipt({ hash: tx });

    const priceAfter = await shop.read.productPrices([productId]);
    expect(priceAfter).to.equal(0n);
  });
});
