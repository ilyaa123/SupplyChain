const { SecretsManager } = require("@chainlink/functions-toolkit");
const { Wallet, providers } = require("ethers");
require("dotenv").config();

(async () => {
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.ETHEREUM_SEPOLIA_RPC_URL;

  console.log("Create wallet..");
  const signer = new Wallet(privateKey, new providers.JsonRpcProvider(rpcUrl));

  console.log("Create secrets manager...");
  const secretsManager = new SecretsManager({
    signer,
    functionsRouterAddress: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
    donId: "fun-ethereum-sepolia-1",
  });

  console.log("Initialize secrets manager...");

  await secretsManager.initialize();

  const secretsUrls = [
    "https://coffee-accurate-swallow-899.mypinata.cloud/ipfs/bafkreifrkg74lwyqxr7y2knd6pzvxdqqseisr4tpv3q2n3imaezzb33fme",
  ];

  console.log("Encrypt secrets urls...");
  const encryptedSecrets = await secretsManager.encryptSecretsUrls(secretsUrls);
  console.log("Encrypted secrets urls: " + encryptedSecrets);
})();
