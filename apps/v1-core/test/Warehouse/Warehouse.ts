import { expect } from "chai";
import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("Warehouse", () => {
  const lat = 56054236n;
  const lon = 47282618n;

  const deployWarehouseFixture = async () => {
    const [owner] = await hre.ethers.getSigners();

    const publicClient = await hre.viem.getPublicClient();
    const walletClient = await hre.viem.getWalletClient(
      owner.address as `0x${string}`
    );

    const supplyChain = await hre.viem.deployContract("SupplyChainMock");
    const productRegistry = await hre.viem.deployContract("ProductRegistry");

    const warehouseFactory = await hre.viem.deployContract(
      "SupplyChainWarehouseFactory",
      [supplyChain.address, productRegistry.address]
    );

    const warehouseImp = await hre.viem.deployContract("Warehouse");

    await warehouseFactory.write.setImplementation([
      0,
      warehouseImp.address as `0x${string}`,
    ]);

    const { request: warehouseRequest, result: warehouseAddress } =
      await publicClient.simulateContract({
        address: warehouseFactory.address,
        abi: warehouseFactory.abi,
        functionName: "createWarehouse",
        args: [0, "Test Warehouse", lat, lon],
        account: owner.address as `0x${string}`,
      });

    await walletClient.writeContract(warehouseRequest);

    const warehouse = await hre.viem.getContractAt(
      "Warehouse",
      warehouseAddress
    );

    const { request: productRequest, result: productId } =
      await publicClient.simulateContract({
        address: productRegistry.address,
        abi: productRegistry.abi,
        functionName: "createProduct",
        args: [owner.address as `0x${string}`],
        account: owner.address as `0x${string}`,
      });

    await walletClient.writeContract(productRequest);

    return { warehouse, productId, owner, productRegistry };
  };

  it("Should get location", async () => {
    const { warehouse } = await loadFixture(deployWarehouseFixture);

    const [latLocation, lonLocation] = await warehouse.read.location();

    expect(latLocation).to.equal(lat);
    expect(lonLocation).to.equal(lon);
  });

  it("Should take product correctly", async () => {
    const { warehouse, productId, owner } = await loadFixture(
      deployWarehouseFixture
    );

    await warehouse.write.takeProduct([productId, 1000n, 1000n, 3n]);

    const balance = await warehouse.read.balanceOf([
      owner.address as `0x${string}`,
      productId,
    ]);

    expect(balance).to.equal(3n);
  });

  it("Should didnt not take product", async () => {
    const { warehouse } = await loadFixture(deployWarehouseFixture);

    await expect(
      warehouse.write.takeProduct([2n, 1000n, 1000n, 3n])
    ).to.be.rejectedWith("Product not found");
  });

  it("Should refund product correctly", async () => {
    const { warehouse, productId, owner } = await loadFixture(
      deployWarehouseFixture
    );

    const weight = 1000n;
    const volume = 1000n;

    await warehouse.write.takeProduct([productId, weight, volume, 3n]);

    const balanceBefore = await warehouse.read.balanceOf([
      owner.address as `0x${string}`,
      productId,
    ]);

    expect(balanceBefore).to.equal(3n);

    await warehouse.write.refundProduct([productId, 2n]);

    const balanceAfter = await warehouse.read.balanceOf([
      owner.address as `0x${string}`,
      productId,
    ]);

    const productBefore = await warehouse.read.products([productId]);

    expect(balanceAfter).to.equal(1n);
    expect(productBefore.weightGram).to.equal(weight);
    expect(productBefore.volumeCm3).to.equal(volume);

    await warehouse.write.refundProduct([productId, 1n]);

    const productAfter = await warehouse.read.products([productId]);

    expect(productAfter.weightGram).to.equal(0n);
    expect(productAfter.volumeCm3).to.equal(0n);
    expect(
      await warehouse.read.balanceOf([
        owner.address as `0x${string}`,
        productId,
      ])
    ).to.equal(0n);
  });
});
