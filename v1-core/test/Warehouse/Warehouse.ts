import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe.only("Warehouse", () => {
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
        args: [
          0,
          "Test Warehouse",
          "https://example.com/logo.png",
          56054236n,
          47282618n,
        ],
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

  it("should store product correctly", async () => {
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
});
