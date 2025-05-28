import { expect } from "chai";
import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("PickUpPoint", () => {
  const lat = 56054236n;
  const lon = 47282618n;

  const deploySortingCenterFixture = async () => {
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

    const pickUpPointImp = await hre.viem.deployContract("PickUpPoint");

    await warehouseFactory.write.setImplementation([
      1,
      pickUpPointImp.address as `0x${string}`,
    ]);

    const { request: warehouseRequest, result: pickUpPointAddress } =
      await publicClient.simulateContract({
        address: warehouseFactory.address,
        abi: warehouseFactory.abi,
        functionName: "createWarehouse",
        args: [1, "Test PickUp Point", lat, lon],
        account: owner.address as `0x${string}`,
      });

    await walletClient.writeContract(warehouseRequest);

    const pickUpPoint = await hre.viem.getContractAt(
      "PickUpPoint",
      pickUpPointAddress
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

    return { pickUpPoint, productId, owner, productRegistry };
  };

  it("Should get location", async () => {
    const { pickUpPoint } = await loadFixture(deploySortingCenterFixture);

    const [latLocation, lonLocation] = await pickUpPoint.read.location();

    expect(latLocation).to.equal(lat);
    expect(lonLocation).to.equal(lon);
  });
});
