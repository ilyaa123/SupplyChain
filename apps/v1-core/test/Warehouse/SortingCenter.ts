import { expect } from "chai";
import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("SortingCenter", () => {
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

    const sortingCenterImp = await hre.viem.deployContract("SortingCenter");

    await warehouseFactory.write.setImplementation([
      2,
      sortingCenterImp.address as `0x${string}`,
    ]);

    const { request: warehouseRequest, result: sortingCenterAddress } =
      await publicClient.simulateContract({
        address: warehouseFactory.address,
        abi: warehouseFactory.abi,
        functionName: "createWarehouse",
        args: [2, "Test Sorting Center", lat, lon],
        account: owner.address as `0x${string}`,
      });

    await walletClient.writeContract(warehouseRequest);

    const sortingCenter = await hre.viem.getContractAt(
      "SortingCenter",
      sortingCenterAddress
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

    return { sortingCenter, productId, owner, productRegistry };
  };

  it("Should get location", async () => {
    const { sortingCenter } = await loadFixture(deploySortingCenterFixture);

    const [latLocation, lonLocation] = await sortingCenter.read.location();

    expect(latLocation).to.equal(lat);
    expect(lonLocation).to.equal(lon);
  });
});
