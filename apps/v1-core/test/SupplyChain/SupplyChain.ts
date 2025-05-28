import { expect } from "chai";
import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("SupplyChain", () => {
  const deployAllFixture = async () => {
    const [
      owner,
      shopOwner,
      warehouseOwner,
      pickUpPointOwner,
      sortingCenterOwner,
      buyer,
      courier1,
      courier2,
    ] = await hre.ethers.getSigners();

    const publicClient = await hre.viem.getPublicClient();

    const walletShopClient = await hre.viem.getWalletClient(
      shopOwner.address as `0x${string}`
    );
    const walletWarehouseClient = await hre.viem.getWalletClient(
      warehouseOwner.address as `0x${string}`
    );
    const walletPickUpPointClient = await hre.viem.getWalletClient(
      pickUpPointOwner.address as `0x${string}`
    );
    const walletSortingCenterClient = await hre.viem.getWalletClient(
      sortingCenterOwner.address as `0x${string}`
    );

    const supplyChain = await hre.viem.deployContract("SupplyChainMock");
    const productRegistry = await hre.viem.deployContract("ProductRegistry");

    const pickUpPointImp = await hre.viem.deployContract("PickUpPoint");
    const warehouseImp = await hre.viem.deployContract("Warehouse");
    const sortingCenterImp = await hre.viem.deployContract("SortingCenter");

    const shopImpl = await hre.viem.deployContract("Shop");

    const shopFactory = await hre.viem.deployContract("ShopFactory", [
      shopImpl.address,
      productRegistry.address,
    ]);

    const warehouseFactory = await hre.viem.deployContract(
      "SupplyChainWarehouseFactory",
      [supplyChain.address, productRegistry.address]
    );

    await warehouseFactory.write.setImplementation([0, warehouseImp.address]);
    await warehouseFactory.write.setImplementation([1, pickUpPointImp.address]);
    await warehouseFactory.write.setImplementation([
      2,
      sortingCenterImp.address,
    ]);

    const { request: shopRequest, result: shopAddress } =
      await publicClient.simulateContract({
        address: shopFactory.address,
        abi: shopFactory.abi,
        functionName: "createShop",
        args: ["shopName", "shopSymbol"],
        account: shopOwner.address as `0x${string}`,
      });

    await walletShopClient.writeContract(shopRequest);

    const shop = await hre.viem.getContractAt("Shop", shopAddress);

    const { request: warehouseRequest, result: warehouseAddress } =
      await publicClient.simulateContract({
        address: warehouseFactory.address,
        abi: warehouseFactory.abi,
        functionName: "createWarehouse",
        args: [0, "Test Warehouse", 56054236n, 47282618n],
        account: warehouseOwner.address as `0x${string}`,
      });

    await walletWarehouseClient.writeContract(warehouseRequest);

    const warehouse = await hre.viem.getContractAt(
      "Warehouse",
      warehouseAddress
    );

    const { request: pickUpRequest, result: pickUpPointAddress } =
      await publicClient.simulateContract({
        address: warehouseFactory.address,
        abi: warehouseFactory.abi,
        functionName: "createWarehouse",
        args: [1, "Test PickUp Point", 56054236n, 47282618n],
        account: pickUpPointOwner.address as `0x${string}`,
      });

    await walletPickUpPointClient.writeContract(pickUpRequest);

    const pickUpPoint = await hre.viem.getContractAt(
      "PickUpPoint",
      pickUpPointAddress
    );

    const { request: sortingCenterRequest, result: sortingCenterAddress } =
      await publicClient.simulateContract({
        address: warehouseFactory.address,
        abi: warehouseFactory.abi,
        functionName: "createWarehouse",
        args: [2, "Test Sorting Center", 56054236n, 47282618n],
        account: sortingCenterOwner.address as `0x${string}`,
      });

    await walletSortingCenterClient.writeContract(sortingCenterRequest);

    const sortingCenter = await hre.viem.getContractAt(
      "SortingCenter",
      sortingCenterAddress
    );

    await supplyChain.write.setWarehouse([
      await warehouse.read.warehouseId(),
      warehouse.address,
    ]);
    await supplyChain.write.setWarehouse([
      await pickUpPoint.read.warehouseId(),
      pickUpPoint.address,
    ]);
    await supplyChain.write.setWarehouse([
      await sortingCenter.read.warehouseId(),
      sortingCenter.address,
    ]);

    return {
      owner,
      shopOwner,
      warehouseOwner,
      pickUpPointOwner,
      sortingCenterOwner,
      supplyChain,
      productRegistry,
      warehouseFactory,
      shop,
      warehouse,
      pickUpPoint,
      sortingCenter,
      buyer,
      courier1,
      courier2,
    };
  };

  it("Should create products and set to warehouse", async () => {
    const ctx = await loadFixture(deployAllFixture);

    await ctx.shop.write.setWarehouse(
      [await ctx.warehouse.read.warehouseId()],
      {
        account: ctx.shopOwner.address as `0x${string}`,
      }
    );

    const productPrice = 5000n;
    const productId = 1n;
    const weight = 1000n;
    const volume = 1000n;

    await ctx.shop.write.createProduct([productPrice, "ipfs://test-token"], {
      account: ctx.shopOwner.address as `0x${string}`,
    });

    ctx.warehouse.write.takeProduct([productId, weight, volume, 5n], {
      account: ctx.warehouseOwner.address as `0x${string}`,
    });

    const price = await ctx.shop.read.productPrices([productId]);
    const balanceInWarehouse = await ctx.warehouse.read.balanceOf([
      ctx.shop.address,
      productId,
    ]);

    expect(price).to.equal(productPrice);

    expect(balanceInWarehouse).to.equal(5n);

    const orderId = 1n;
    const deliveryId = 1n;
    const orderDistance = 1300n;

    await ctx.supplyChain.write.createDeliverRequest(
      [productId, ctx.shop.address, await ctx.pickUpPoint.read.warehouseId()],
      {
        account: ctx.buyer.address as `0x${string}`,
      }
    );

    const deliveryCost = await ctx.supplyChain.read.calculateDelivery([
      orderDistance,
      weight,
      volume,
    ]);

    await ctx.supplyChain.write.handleMockOrderDistance([
      orderId,
      orderDistance,
    ]);

    const order = await ctx.supplyChain.read.orders([orderId]);

    expect(order[0]).to.equal(ctx.shop.address);
    expect(order[1]).to.equal(ctx.buyer.address);
    expect(order[2]).to.equal(productPrice);
    expect(order[3]).to.equal(deliveryCost);
    expect(order[4]).to.equal(await ctx.shop.read.warehouseId());
    expect(order[5]).to.equal(await ctx.pickUpPoint.read.warehouseId());
    expect(order[6]).to.equal(false);

    const delivery = await ctx.supplyChain.read.deliveryProducts([deliveryId]);

    expect(delivery[0]).to.equal(orderId);
    expect(delivery[1]).to.equal(productId);
    expect(delivery[2]).to.equal(await ctx.pickUpPoint.read.warehouseId());
    expect(delivery[3]).to.equal(false);
    expect(delivery[4]).to.equal(false);

    expect(
      await ctx.warehouse.read.balanceOf([ctx.shop.address, productId])
    ).to.equal(balanceInWarehouse - 1n);

    await ctx.supplyChain.write.payDelivery([orderId], {
      value: productPrice + deliveryCost,
      account: ctx.buyer.address as `0x${string}`,
    });

    expect((await ctx.supplyChain.read.orders([orderId]))[6]).to.equal(true);

    await ctx.warehouse.write.sendProduct([deliveryId], {
      account: ctx.warehouseOwner.address as `0x${string}`,
    });

    await ctx.sortingCenter.write.takeProduct(
      [deliveryId, ctx.courier1.address as `0x${string}`, weight, volume],
      {
        account: ctx.sortingCenterOwner.address as `0x${string}`,
      }
    );

    await ctx.supplyChain.write.handleMockLegDistance([deliveryId, 0n, 500n]);

    const balanceInSortingCenter = await ctx.sortingCenter.read.balanceOf([
      ctx.shop.address,
      productId,
    ]);

    expect(balanceInSortingCenter).to.equal(1n);

    const deliveryLeg = await ctx.supplyChain.read.deliveryLegs([
      deliveryId,
      0n,
    ]);

    expect(deliveryLeg[0]).to.equal(ctx.courier1.address);
    expect(deliveryLeg[1]).to.equal(await ctx.shop.read.warehouseId());
    expect(deliveryLeg[2]).to.equal(await ctx.sortingCenter.read.warehouseId());
    expect(deliveryLeg[3]).to.equal(500n);

    await ctx.sortingCenter.write.sendProduct([deliveryId], {
      account: ctx.sortingCenterOwner.address as `0x${string}`,
    });

    await ctx.pickUpPoint.write.receptionProduct(
      [deliveryId, ctx.courier2.address as `0x${string}`, weight, volume],
      {
        account: ctx.pickUpPointOwner.address as `0x${string}`,
      }
    );

    await ctx.supplyChain.write.handleMockLegDistance([deliveryId, 1n, 500n]);

    const balanceInPickUpPoint = await ctx.pickUpPoint.read.balanceOf([
      ctx.shop.address,
      productId,
    ]);

    expect(balanceInPickUpPoint).to.equal(1n);

    const deliveryLastLeg = await ctx.supplyChain.read.deliveryLegs([
      deliveryId,
      1n,
    ]);

    expect(deliveryLastLeg[0]).to.equal(ctx.courier2.address);
    expect(deliveryLastLeg[1]).to.equal(
      await ctx.sortingCenter.read.warehouseId()
    );
    expect(deliveryLastLeg[2]).to.equal(
      await ctx.pickUpPoint.read.warehouseId()
    );
    expect(deliveryLastLeg[3]).to.equal(500n);

    await ctx.pickUpPoint.write.completeProduct(
      [deliveryId, ctx.buyer.address as `0x${string}`],
      {
        account: ctx.pickUpPointOwner.address as `0x${string}`,
      }
    );

    const balanceInPickUpPointAfter = await ctx.pickUpPoint.read.balanceOf([
      ctx.shop.address,
      productId,
    ]);

    expect(balanceInPickUpPointAfter).to.equal(0n);

    const deliveryProduct = await ctx.supplyChain.read.deliveryProducts([
      deliveryId,
    ]);

    expect(deliveryProduct[3]).to.equal(true);

    await ctx.supplyChain.write.completeDeliveryOrder([deliveryId], {
      account: ctx.owner.address as `0x${string}`,
    });

    const deliveryProductAfter = await ctx.supplyChain.read.deliveryProducts([
      deliveryId,
    ]);

    expect(deliveryProductAfter[4]).to.equal(true);
  });
});
