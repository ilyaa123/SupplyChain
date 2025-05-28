import { expect } from "chai";
import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("ProductRegistry", () => {
  const deployProductRegistryFixture = async () => {
    const [owner] = await hre.ethers.getSigners();

    const productRegistry = await hre.viem.deployContract("ProductRegistry");

    return { owner, productRegistry };
  };

  it("Should create a product and assign it to the owner", async () => {
    const { owner, productRegistry } = await loadFixture(
      deployProductRegistryFixture
    );

    const publicClient = await hre.viem.getPublicClient();
    const walletClient = await hre.viem.getWalletClient(
      owner.address as `0x${string}`
    );

    const { request, result: productId } = await publicClient.simulateContract({
      address: productRegistry.address,
      abi: productRegistry.abi,
      functionName: "createProduct",
      args: [owner.address as `0x${string}`],
      account: owner.address as `0x${string}`,
    });

    await walletClient.writeContract(request);

    const registeredOwner = await productRegistry.read.products([productId]);
    expect(registeredOwner).to.equal(owner.address);
  });

  it("Should increment productId with each creation", async () => {
    const { owner, productRegistry } = await loadFixture(
      deployProductRegistryFixture
    );

    const publicClient = await hre.viem.getPublicClient();
    const walletClient = await hre.viem.getWalletClient(
      owner.address as `0x${string}`
    );

    const { request: request1, result: id1 } =
      await publicClient.simulateContract({
        address: productRegistry.address,
        abi: productRegistry.abi,
        functionName: "createProduct",
        args: [owner.address as `0x${string}`],
        account: owner.address as `0x${string}`,
      });

    await walletClient.writeContract(request1);

    const { request: request2, result: id2 } =
      await publicClient.simulateContract({
        address: productRegistry.address,
        abi: productRegistry.abi,
        functionName: "createProduct",
        args: [owner.address as `0x${string}`],
        account: owner.address as `0x${string}`,
      });

    await walletClient.writeContract(request2);

    expect(id1 < id2).to.be.true;
  });

  it("Should revert if trying to create a product with zero address", async () => {
    const { productRegistry } = await loadFixture(deployProductRegistryFixture);

    await expect(
      productRegistry.write.createProduct([
        `0x0000000000000000000000000000000000000000`,
      ])
    ).to.be.rejected;
  });

  it("Should delete a product", async () => {
    const { owner, productRegistry } = await loadFixture(
      deployProductRegistryFixture
    );

    const publicClient = await hre.viem.getPublicClient();
    const walletClient = await hre.viem.getWalletClient(
      owner.address as `0x${string}`
    );

    const { request, result: productId } = await publicClient.simulateContract({
      address: productRegistry.address,
      abi: productRegistry.abi,
      functionName: "createProduct",
      args: [owner.address as `0x${string}`],
      account: owner.address as `0x${string}`,
    });

    await walletClient.writeContract(request);

    await productRegistry.write.deleteProduct([productId]);

    const registeredOwner = await productRegistry.read.products([productId]);
    expect(registeredOwner).to.equal(
      "0x0000000000000000000000000000000000000000"
    );
  });
});
