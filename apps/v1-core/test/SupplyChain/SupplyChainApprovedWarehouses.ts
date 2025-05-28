import { expect } from "chai";
import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("SupplyChainApprovedWarehouses", () => {
  const deployFixture = async () => {
    const [owner, another] = await hre.viem.getWalletClients();

    const supplyChainApprovedWarehouses = await hre.viem.deployContract(
      "SupplyChainApprovedWarehousesMock"
    );

    return { owner, another, supplyChainApprovedWarehouses };
  };

  it("Should create approvedWarehouse", async () => {
    const { supplyChainApprovedWarehouses, another } = await loadFixture(
      deployFixture
    );

    const warehouseAddress = another.account.address;

    await supplyChainApprovedWarehouses.write.setWarehouse([
      1n,
      warehouseAddress,
    ]);

    const result = await supplyChainApprovedWarehouses.read.approvedWarehouses([
      1n,
    ]);
    expect(result.toLowerCase()).to.equal(warehouseAddress.toLowerCase());
  });

  it("Should delete approvedWarehouse", async () => {
    const { supplyChainApprovedWarehouses, another } = await loadFixture(
      deployFixture
    );

    const warehouseAddress = another.account.address;

    await supplyChainApprovedWarehouses.write.setWarehouse([
      2n,
      warehouseAddress,
    ]);

    const setResult =
      await supplyChainApprovedWarehouses.read.approvedWarehouses([2n]);
    expect(setResult.toLowerCase()).to.equal(warehouseAddress.toLowerCase());

    await supplyChainApprovedWarehouses.write.deleteWarehouse([2n]);

    const afterDelete =
      await supplyChainApprovedWarehouses.read.approvedWarehouses([2n]);
    expect(afterDelete).to.equal("0x0000000000000000000000000000000000000000");
  });
});
