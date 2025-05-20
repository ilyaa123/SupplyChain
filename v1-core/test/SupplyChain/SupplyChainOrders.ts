import { expect } from "chai";
import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("SupplyChainOrders", () => {
  const deploySupplyChainOrdersFixture = async () => {
    const [owner, buyer] = await hre.ethers.getSigners();
    const publicClient = await hre.viem.getPublicClient();

    const supplyChainOrders = await hre.viem.deployContract(
      "SupplyChainOrdersMock"
    );

    return { owner, buyer, publicClient, supplyChainOrders };
  };

  it("Should create an order and store it correctly", async () => {
    const { owner, buyer, supplyChainOrders, publicClient } = await loadFixture(
      deploySupplyChainOrdersFixture
    );

    const seller = owner.address as `0x${string}`;
    const buyerAddress = buyer.address as `0x${string}`;
    const productIds = [1n, 2n, 3n];
    const prices = [100n, 200n, 300n];
    const fromWarehouseId = 10n;
    const toWarehouseId = 20n;

    const hash = await supplyChainOrders.write.createOrderPublic([
      seller,
      buyerAddress,
      productIds,
      prices,
      fromWarehouseId,
      toWarehouseId,
    ]);
    await publicClient.waitForTransactionReceipt({ hash });

    const orderId = 1n;
    const [
      sellerOut,
      buyerOut,
      totalCost,
      deliveryCost,
      fromWarehouseIdOut,
      toWarehouseIdOut,
      paid,
    ] = await supplyChainOrders.read.orders([orderId]);

    expect(sellerOut.toLowerCase()).to.equal(seller.toLowerCase());
    expect(buyerOut.toLowerCase()).to.equal(buyerAddress.toLowerCase());
    expect(totalCost).to.equal(600n);
    expect(deliveryCost).to.equal(0n);
    expect(fromWarehouseIdOut).to.equal(fromWarehouseId);
    expect(toWarehouseIdOut).to.equal(toWarehouseId);
    expect(paid).to.equal(false);
  });

  it("Should revert on length mismatch", async () => {
    const { supplyChainOrders, owner, buyer } = await loadFixture(
      deploySupplyChainOrdersFixture
    );

    const productIds = [1n, 2n];
    const prices = [100n];

    await expect(
      supplyChainOrders.write.createOrderPublic([
        owner.address as `0x${string}`,
        buyer.address as `0x${string}`,
        productIds,
        prices,
        1n,
        2n,
      ])
    ).to.be.rejectedWith("Length mismatch");
  });
});
