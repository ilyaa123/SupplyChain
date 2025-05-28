import { expect } from "chai";
import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("SupplyChainDeliveries", () => {
  const deploySupplyChainDeliveriesFixture = async () => {
    const [owner] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const supplyChainDeliveries = await hre.viem.deployContract(
      "SupplyChainDeliveriesMock"
    );

    return { owner, supplyChainDeliveries, publicClient };
  };

  it("Should create a single delivery", async () => {
    const { supplyChainDeliveries, publicClient } = await loadFixture(
      deploySupplyChainDeliveriesFixture
    );

    const orderId = 1n;
    const productId = 10n;
    const toWarehouseId = 99n;

    const hash = await supplyChainDeliveries.write.createDelivery([
      orderId,
      productId,
      toWarehouseId,
    ]);
    await publicClient.waitForTransactionReceipt({ hash });

    const deliveryProduct = await supplyChainDeliveries.read.getDeliveryProduct(
      [1n]
    );

    expect(deliveryProduct.orderId).to.equal(orderId);
    expect(deliveryProduct.productId).to.equal(productId);
    expect(deliveryProduct.toWarehouseId).to.equal(toWarehouseId);
    expect(deliveryProduct.delivered).to.equal(false);
  });

  it("Should create multiple deliveries", async () => {
    const { supplyChainDeliveries, publicClient } = await loadFixture(
      deploySupplyChainDeliveriesFixture
    );

    const orderId = 2n;
    const productIds = [101n, 102n, 103n];
    const toWarehouseId = 11n;

    const hash = await supplyChainDeliveries.write.createDeliveries([
      orderId,
      productIds,
      toWarehouseId,
    ]);
    await publicClient.waitForTransactionReceipt({ hash });

    for (let i = 0; i < productIds.length; i++) {
      const deliveryId = BigInt(i + 1);
      const deliveryProduct =
        await supplyChainDeliveries.read.getDeliveryProduct([deliveryId]);

      expect(deliveryProduct.orderId).to.equal(orderId);
      expect(deliveryProduct.productId).to.equal(productIds[i]);
      expect(deliveryProduct.toWarehouseId).to.equal(toWarehouseId);
      expect(deliveryProduct.delivered).to.equal(false);
    }
  });

  it("Should create a delivery leg", async () => {
    const { supplyChainDeliveries, owner, publicClient } = await loadFixture(
      deploySupplyChainDeliveriesFixture
    );

    const orderId = 3n;
    const productId = 777n;
    const toWarehouseId = 88n;
    const hash1 = await supplyChainDeliveries.write.createDelivery([
      orderId,
      productId,
      toWarehouseId,
    ]);
    await publicClient.waitForTransactionReceipt({ hash: hash1 });

    const deliveryId = 1n;
    const fromWarehouseId = 5n;
    const hash2 = await supplyChainDeliveries.write.createLeg([
      deliveryId,
      owner.account.address,
      fromWarehouseId,
      toWarehouseId,
    ]);
    await publicClient.waitForTransactionReceipt({ hash: hash2 });

    const legs = await supplyChainDeliveries.read.getDeliveryLegs([deliveryId]);
    expect(legs.length).to.equal(1);
    expect(legs[0].courier.toLowerCase()).to.equal(
      owner.account.address.toLowerCase()
    );
    expect(legs[0].fromWarehouseId).to.equal(fromWarehouseId);
    expect(legs[0].toWarehouseId).to.equal(toWarehouseId);
    expect(legs[0].distance).to.equal(0n);
  });
});
