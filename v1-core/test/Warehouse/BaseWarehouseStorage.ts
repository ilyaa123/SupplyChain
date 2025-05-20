import { expect } from "chai";
import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("BaseWarehouseStorage", () => {
  const deployBaseStorageFixture = async () => {
    const [owner] = await hre.ethers.getSigners();

    const baseWarehouseStorage = await hre.viem.deployContract(
      "BaseWarehouseStorageMock"
    );

    await baseWarehouseStorage.write.initialize([
      "https://example.com/{id}.json",
    ]);

    return { baseWarehouseStorage, owner };
  };

  it("Should initialize the warehouse and emit the event", async () => {
    const { baseWarehouseStorage } = await loadFixture(
      deployBaseStorageFixture
    );

    const logs =
      await baseWarehouseStorage.getEvents.WarehouseStorageInitialized();
    expect(logs.length).to.equal(1);
    expect(logs[0].args.uri).to.equal("https://example.com/{id}.json");
  });

  it("Should store a new product and emit the event", async () => {
    const { baseWarehouseStorage, owner } = await loadFixture(
      deployBaseStorageFixture
    );

    const productId = 1n;
    const weight = 1000n;
    const volume = 500n;
    const amount = 3n;

    await baseWarehouseStorage.write.storeProduct([
      productId,
      owner.address as `0x${string}`,
      weight,
      volume,
      amount,
    ]);

    const events = await baseWarehouseStorage.getEvents.ProductStored();
    expect(events.length).to.equal(1);
    expect(events[0].args).to.deep.equal({
      productId,
      owner: owner.address,
      weightGram: weight,
      volumeCm3: volume,
      amount,
    });

    const balance = await baseWarehouseStorage.read.balanceOfProduct([
      owner.address as `0x${string}`,
      productId,
    ]);

    expect(balance).to.equal(amount);

    const product = await baseWarehouseStorage.read.products([productId]);

    expect(product.weightGram).to.equal(weight);
    expect(product.volumeCm3).to.equal(volume);
  });

  it("Should store metadata only once per product per owner", async () => {
    const { baseWarehouseStorage, owner } = await loadFixture(
      deployBaseStorageFixture
    );

    const productId = 100n;
    const weight = 1200n;
    const volume = 300n;

    await baseWarehouseStorage.write.storeProduct([
      productId,
      owner.address as `0x${string}`,
      weight,
      volume,
      1n,
    ]);

    await baseWarehouseStorage.write.storeProduct([
      productId,
      owner.address as `0x${string}`,
      weight,
      volume,
      2n,
    ]);

    const balance = await baseWarehouseStorage.read.balanceOfProduct([
      owner.address as `0x${string}`,
      productId,
    ]);
    expect(balance).to.equal(3n);
  });

  it("Should revert if metadata differs after initial store", async () => {
    const { baseWarehouseStorage, owner } = await loadFixture(
      deployBaseStorageFixture
    );

    const productId = 101n;

    await baseWarehouseStorage.write.storeProduct([
      productId,
      owner.address as `0x${string}`,
      1500n,
      700n,
      1n,
    ]);

    await expect(
      baseWarehouseStorage.write.storeProduct([
        productId,
        owner.address as `0x${string}`,
        1000n,
        700n,
        1n,
      ])
    ).to.be.rejectedWith("Product metadata mismatch");

    await expect(
      baseWarehouseStorage.write.storeProduct([
        productId,
        owner.address as `0x${string}`,
        1500n,
        800n,
        1n,
      ])
    ).to.be.rejectedWith("Product metadata mismatch");
  });

  it("Should delete part of product without removing metadata", async () => {
    const { baseWarehouseStorage, owner } = await loadFixture(
      deployBaseStorageFixture
    );

    const productId = 200n;
    const weight = 1000n;
    const volume = 500n;

    await baseWarehouseStorage.write.storeProduct([
      productId,
      owner.address as `0x${string}`,
      weight,
      volume,
      3n,
    ]);

    await baseWarehouseStorage.write.deleteProduct([
      productId,
      owner.address as `0x${string}`,
      1n,
    ]);

    const balance = await baseWarehouseStorage.read.balanceOfProduct([
      owner.address as `0x${string}`,
      productId,
    ]);
    expect(balance).to.equal(2n);

    const product = await baseWarehouseStorage.read.products([productId]);
    expect(product.weightGram).to.equal(weight);
    expect(product.volumeCm3).to.equal(volume);

    const events = await baseWarehouseStorage.getEvents.ProductDeleted();
    expect(events[0].args.productMetadataDeleted).to.equal(false);
  });

  it("Should delete all product and metadata when balance becomes zero", async () => {
    const { baseWarehouseStorage, owner } = await loadFixture(
      deployBaseStorageFixture
    );

    const productId = 201n;

    await baseWarehouseStorage.write.storeProduct([
      productId,
      owner.address as `0x${string}`,
      1000n,
      1000n,
      2n,
    ]);

    await baseWarehouseStorage.write.deleteProduct([
      productId,
      owner.address as `0x${string}`,
      2n,
    ]);

    const balance = await baseWarehouseStorage.read.balanceOfProduct([
      owner.address as `0x${string}`,
      productId,
    ]);
    expect(balance).to.equal(0n);

    const product = await baseWarehouseStorage.read.products([productId]);
    expect(product.weightGram).to.equal(0n);
    expect(product.volumeCm3).to.equal(0n);

    const events = await baseWarehouseStorage.getEvents.ProductDeleted();
    expect(events[0].args.productMetadataDeleted).to.equal(true);
  });

  it("Should revert if trying to delete more than available", async () => {
    const { baseWarehouseStorage, owner } = await loadFixture(
      deployBaseStorageFixture
    );

    const productId = 202n;

    await baseWarehouseStorage.write.storeProduct([
      productId,
      owner.address as `0x${string}`,
      800n,
      600n,
      1n,
    ]);

    await expect(
      baseWarehouseStorage.write.deleteProduct([
        productId,
        owner.address as `0x${string}`,
        2n,
      ])
    ).to.be.rejectedWith("Not enough in stock");
  });
});
