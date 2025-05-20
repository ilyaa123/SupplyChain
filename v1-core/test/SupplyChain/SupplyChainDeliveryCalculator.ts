import { expect } from "chai";
import hre from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { parseEther } from "viem";

describe("SupplyChainDeliveryCalculator", () => {
  const deployDeliveryCalculatorFixture = async () => {
    const [owner] = await hre.ethers.getSigners();

    const deliveryCalculator = await hre.viem.deployContract(
      "SupplyChainDeliveryCalculatorMock"
    );

    return { deliveryCalculator, owner };
  };

  describe("calculateDelivery", () => {
    it("Should calculate delivery cost with actual weight greater than volumetric weight", async () => {
      const { deliveryCalculator } = await loadFixture(
        deployDeliveryCalculatorFixture
      );

      const distanceM = BigInt(100000);
      const weightGram = BigInt(10000);
      const volumeCm3 = BigInt(20000);

      // chargeableWeight = 10 кг
      // baseRate = 1e15 (0.001 ETH)
      // ratePerKm = 1e14 (0.0001 ETH) * 100 = 0.01 ETH
      // ratePerKg = 5e13 (0.00005 ETH) * 10 = 0.0005 ETH
      // total = 0.001 + 0.01 + 0.0005 = 0.0115 ETH = 11500000000000000 wei

      const totalCost = await deliveryCalculator.read.calculateDelivery([
        distanceM,
        weightGram,
        volumeCm3,
      ]);

      expect(totalCost).to.equal(parseEther("0.0115")); // 0.0115 ETH
    });

    it("Should calculate delivery cost with volumetric weight greater than actual weight", async () => {
      const { deliveryCalculator } = await loadFixture(
        deployDeliveryCalculatorFixture
      );

      const distanceM = BigInt(75000);
      const weightGram = BigInt(5000);
      const volumeCm3 = BigInt(35000);

      // chargeableWeight = 7 kg
      // baseRate = 1e15 (0.001 ETH)
      // ratePerKm = 1e14 (0.0001 ETH) * 75 = 0.0075 ETH
      // ratePerKg = 5e13 (0.00005 ETH) * 7 = 0.00035 ETH
      // total = 0.001 + 0.0075 + 0.00035 = 0.00885 ETH = 8850000000000000 wei

      const totalCost = await deliveryCalculator.read.calculateDelivery([
        distanceM,
        weightGram,
        volumeCm3,
      ]);

      expect(totalCost).to.equal(parseEther("0.00885")); // 0.00885 ETH
    });
  });

  describe("setRates", () => {
    it("Should update the rates correctly", async () => {
      const { deliveryCalculator } = await loadFixture(
        deployDeliveryCalculatorFixture
      );

      const newBaseRate = parseEther("0.002");
      const newRatePerKm = parseEther("0.0002");
      const newRatePerGram = parseEther("0.0001");

      await deliveryCalculator.write.setRates([
        newBaseRate,
        newRatePerKm,
        newRatePerGram,
      ]);

      expect(await deliveryCalculator.read.baseRate()).to.equal(newBaseRate);
      expect(await deliveryCalculator.read.ratePerKm()).to.equal(newRatePerKm);
      expect(await deliveryCalculator.read.ratePerGram()).to.equal(
        newRatePerGram
      );
    });
  });
});
