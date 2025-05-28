import { expect } from "chai";
import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("Shop", () => {
  const deployShopFixture = async () => {
    const [owner, other] = await hre.ethers.getSigners();

    const shop = await hre.viem.deployContract("Shop");

    const productRegistry = await hre.viem.deployContract("ProductRegistry");

    await shop.write.initialize([
      productRegistry.address as `0x${string}`,
      owner.address as `0x${string}`,
      "Test Shop",
      "TS",
    ]);

    return { owner, other, shop, productRegistry };
  };

  it("Should not allow re-initialization", async () => {
    const { shop, owner, productRegistry } = await loadFixture(
      deployShopFixture
    );

    expect(
      shop.write.initialize([
        productRegistry.address as `0x${string}`,
        owner.address as `0x${string}`,
        "Duplicate Shop",
        "DUP",
      ])
    ).to.be.rejected;
  });

  it("Should set warehouse", async () => {
    const { shop } = await loadFixture(deployShopFixture);

    await shop.write.setWarehouse([1n]);

    const warehouseId = await shop.read.warehouseId();

    expect(warehouseId).to.equal(1n);
  });

  it("Should not set warehouse", async () => {
    const { shop, other } = await loadFixture(deployShopFixture);

    expect(
      shop.write.setWarehouse([1n], {
        account: other.address as `0x${string}`,
      })
    ).to.be.rejected;
  });

  it("Should create a product with price and URI", async () => {
    const { shop } = await loadFixture(deployShopFixture);

    await shop.write.createProduct([5000n, "ipfs://test-token"]);

    const price = await shop.read.productPrices([1n]);

    expect(price).to.equal(5000n);
  });

  it("Should not create a product without owner", async () => {
    const { shop, other } = await loadFixture(deployShopFixture);

    expect(
      shop.write.createProduct([5000n, "ipfs://test-token"], {
        account: other.address as `0x${string}`,
      })
    ).to.be.rejected;
  });

  it("Should delete a product correctly", async () => {
    const { shop, productRegistry } = await loadFixture(deployShopFixture);

    await shop.write.createProduct([1000n, "ipfs://delete-me"]);

    const productId = 1n;

    const registryOwner = await productRegistry.read.products([productId]);

    expect(registryOwner.toLowerCase()).to.equal(shop.address.toLowerCase());

    await shop.write.deleteProduct([productId]);

    const priceAfter = await shop.read.productPrices([productId]);

    expect(priceAfter).to.equal(0n);
  });

  it("Should not delete a product without owner", async () => {
    const { shop, other } = await loadFixture(deployShopFixture);

    const productId = 1n;

    await shop.write.createProduct([1000n, "ipfs://delete-me"]);

    expect(
      shop.write.deleteProduct([productId], {
        account: other.address as `0x${string}`,
      })
    ).to.be.rejected;
  });

  it("Should revert if product is not registered to this shop", async () => {
    const { shop } = await loadFixture(deployShopFixture);

    expect(shop.write.deleteProduct([1n])).to.be.rejectedWith(
      "Product not registered to this shop"
    );
  });

  it("Should revert if product price is not found in shop", async () => {
    const { shop, productRegistry } = await loadFixture(deployShopFixture);

    await shop.write.createProduct([1000n, "ipfs://test"]);

    await shop.write.deleteProduct([1n]); // это удалит и price, и uri

    await expect(shop.write.deleteProduct([1n])).to.be.rejectedWith(
      "Product price not found in shop"
    );
  });
});
