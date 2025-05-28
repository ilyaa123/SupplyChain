import { expect } from "chai";
import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { zeroAddress } from "viem";

describe("WarehousesFactory", () => {
  const loadWarehousesFactoryFixture = async () => {
    const [owner] = await hre.ethers.getSigners();
    const warehouse = await hre.viem.deployContract("Warehouse");
    const sortingCenter = await hre.viem.deployContract("SortingCenter");
    const pickUpPoint = await hre.viem.deployContract("PickUpPoint");

    const warehouseFactory = await hre.viem.deployContract(
      "SupplyChainWarehouseFactory",
      [zeroAddress, zeroAddress]
    );

    await warehouseFactory.write.setImplementation([
      0,
      warehouse.address as `0x${string}`,
    ]);
    await warehouseFactory.write.setImplementation([
      1,
      pickUpPoint.address as `0x${string}`,
    ]);
    await warehouseFactory.write.setImplementation([
      2,
      sortingCenter.address as `0x${string}`,
    ]);

    return {
      owner,
      warehouseFactory,
      warehouseImpl: warehouse,
      pickUpPointImpl: pickUpPoint,
      sortingCenterImpl: sortingCenter,
    };
  };

  it("Should remove an existing implementation", async () => {
    const { warehouseFactory } = await loadFixture(
      loadWarehousesFactoryFixture
    );

    await warehouseFactory.write.removeImplementation([0]);

    await expect(
      warehouseFactory.write.createWarehouse([
        0,
        "Test Warehouse",
        100000n,
        200000n,
      ])
    ).to.be.rejectedWith("Implementation not set");
  });

  it("Should revert when removing non-existent implementation", async () => {
    const { warehouseFactory } = await loadFixture(
      loadWarehousesFactoryFixture
    );

    await warehouseFactory.write.removeImplementation([1]);

    await expect(
      warehouseFactory.write.removeImplementation([1])
    ).to.be.rejectedWith("Implementation not set");
  });

  it("Should create a warehouse clone and emit event", async () => {
    const { warehouseFactory } = await loadFixture(
      loadWarehousesFactoryFixture
    );

    await warehouseFactory.write.createWarehouse([
      0,
      "Warehouse A",
      111111n,
      222222n,
    ]);

    const logs = await warehouseFactory.getEvents.WarehouseCreated();
    expect(logs.length).to.equal(1);

    const cloneAddress = logs[0].args.warehouse;
    expect(cloneAddress).to.match(/^0x[0-9a-fA-F]{40}$/);
  });

  it("Should revert if implementation not set for the type", async () => {
    const { warehouseFactory } = await loadFixture(
      loadWarehousesFactoryFixture
    );

    await warehouseFactory.write.removeImplementation([2]);

    await expect(
      warehouseFactory.write.createWarehouse([2, "Should Fail", 0n, 0n])
    ).to.be.rejectedWith("Implementation not set");
  });
});
