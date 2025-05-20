import "dotenv/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@tenderly/hardhat-tenderly";

import type { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  gasReporter: {
    enabled: true,
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      chainId: Number(process.env.SEPOLIA_CHAIN_ID),
      accounts: [process.env.PRIVATE_KEY!],
    },
    virtual_sepolia: {
      url: process.env.TENDERLY_RPC_URL,
      chainId: Number(process.env.TENDERLY_CHAIN_ID!),
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY!,
    },
  },
  tenderly: {
    project: process.env.TENDERLY_PROJECT!,
    username: process.env.TENDERLY_USERNAME!,
    privateVerification: Boolean(process.env.TENDERLY_PRIVATE_VERIFICATION),
  },
};

export default config;
