const fs = require("fs");
const path = require("path");
const { SecretsManager } = require("@chainlink/functions-toolkit");
const { Wallet, providers } = require("ethers");
require("dotenv").config();

(async () => {
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.ETHEREUM_SEPOLIA_RPC_URL;

  console.log("Create signer...");
  const signer = new Wallet(privateKey, new providers.JsonRpcProvider(rpcUrl));

  console.log("Create secrets manager...");
  const secretsManager = new SecretsManager({
    signer,
    functionsRouterAddress: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
    donId: "fun-ethereum-sepolia-1",
  });

  console.log("Initialize secrets manager...");

  await secretsManager.initialize();

  const secrets = { apiKey: process.env.TWO_GIS_API_KEY };

  const rootDir = process.cwd();
  const secretsFilePath = path.resolve(rootDir, "offchain-secrets.json");

  console.log("Encrypt secrets...");
  const encryptedSecrets = await secretsManager.encryptSecrets(secrets);

  try {
    fs.writeFileSync(secretsFilePath, JSON.stringify(encryptedSecrets));
    console.log("Encrypted secrets object written to " + secretsFilePath);
  } catch (error) {
    console.error(error);
  }
})();
