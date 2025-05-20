import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

const toBytes32 = (text: string): `0x${string}` => {
  const hex = Buffer.from(text, "utf8").toString("hex").padEnd(64, "0");
  return `0x${hex}` as const;
};

describe("SupplyChain", () => {
  const deploySupplyChainFixture = async () => {
    const [owner, other] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const supplyChain = await hre.viem.deployContract("SupplyChainMock");

    return { owner, other, supplyChain, publicClient };
  };

  it("should set active source ID", async () => {
    const { supplyChain, publicClient } = await loadFixture(
      deploySupplyChainFixture
    );

    const id = toBytes32("sourceA");
    const hash = await supplyChain.write.setActiveSource([id]);
    await publicClient.waitForTransactionReceipt({ hash });

    const sourceId = await supplyChain.read.sourceId();
    expect(sourceId).to.equal(id);
  });

  it("should add, update, and remove a source", async () => {
    const { supplyChain, publicClient } = await loadFixture(
      deploySupplyChainFixture
    );

    const id = toBytes32("mySource");
    const code = "console.log('hello')";
    const updatedCode = "console.log('updated')";

    let hash = await supplyChain.write.addSource([id, code]);
    await publicClient.waitForTransactionReceipt({ hash });

    let stored = await supplyChain.read.getSource([id]);
    expect(stored).to.equal(code);

    hash = await supplyChain.write.updateSource([id, updatedCode]);
    await publicClient.waitForTransactionReceipt({ hash });

    stored = await supplyChain.read.getSource([id]);
    expect(stored).to.equal(updatedCode);

    hash = await supplyChain.write.removeSource([id]);
    await publicClient.waitForTransactionReceipt({ hash });

    stored = await supplyChain.read.getSource([id]);
    expect(stored).to.equal("");
  });

  it("should set delivery calculation rates", async () => {
    const { supplyChain, publicClient } = await loadFixture(
      deploySupplyChainFixture
    );

    const baseRate = 1111n;
    const ratePerKm = 2222n;
    const ratePerGram = 3333n;

    const hash = await supplyChain.write.setRates([
      baseRate,
      ratePerKm,
      ratePerGram,
    ]);
    await publicClient.waitForTransactionReceipt({ hash });

    expect(await supplyChain.read.baseRate()).to.equal(baseRate);
    expect(await supplyChain.read.ratePerKm()).to.equal(ratePerKm);
    expect(await supplyChain.read.ratePerGram()).to.equal(ratePerGram);
  });

  it("should set and delete warehouse", async () => {
    const { supplyChain, owner, publicClient } = await loadFixture(
      deploySupplyChainFixture
    );

    const fakeWarehouseAddress = owner.account.address;
    const warehouseId = 777n;

    let hash = await supplyChain.write.setWarehouse([
      warehouseId,
      fakeWarehouseAddress,
    ]);
    await publicClient.waitForTransactionReceipt({ hash });

    const result = await supplyChain.read.approvedWarehouses([warehouseId]);
    expect(result.toLowerCase()).to.equal(fakeWarehouseAddress.toLowerCase());

    hash = await supplyChain.write.deleteWarehouse([warehouseId]);
    await publicClient.waitForTransactionReceipt({ hash });

    const afterDelete = await supplyChain.read.approvedWarehouses([
      warehouseId,
    ]);
    expect(afterDelete).to.equal("0x0000000000000000000000000000000000000000");
  });

  it("should revert if non-owner tries to call admin functions", async () => {
    const { supplyChain, other } = await loadFixture(deploySupplyChainFixture);

    const id = toBytes32("fail");

    await expect(
      supplyChain.write.setActiveSource([id], { account: other.account })
    ).to.be.rejected;
  });
});
