import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";
import "hardhat-contract-sizer";
import { resolve } from "path";
import "solidity-docgen";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const mnemonic: string | undefined = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set your MNEMONIC in a .env file");
}

const alchemyApiKey: string | undefined =
  process.env.ALCHEMY_API_KEY;
if (!alchemyApiKey) {
  throw new Error(
    "Please set your ALCHEMY_API_KEY in a .env file",
  );
}

const chainIds = {
  // "{INSERT_NAME}": {INSERT_ID},
  hardhat: 31337,
  mainnet: 1,
  "eth-sepolia": 11155111,
  "polygon-mumbai": 80001,
  rootstock:30,
  "rootstock-testnet":31,
};

function getChainConfig(
  chain: keyof typeof chainIds,
): NetworkUserConfig {
  let jsonRpcUrl = "https://" + chain + ".g.alchemy.com/v2/" + alchemyApiKey;
  return {
    // Comment out for default hardhat account settings
    accounts: {
      count: 10,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    // gasPrice: 8000000000,
    chainId: chainIds[chain],
    url: jsonRpcUrl,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      rinkeby: process.env.ETHERSCAN_API_KEY || "",
      goerli: process.env.ETHERSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
  gasReporter: {
    enabled: !!(
      process.env.REPORT_GAS &&
      process.env.REPORT_GAS != "false"
    ),
    offline: true,
    showTimeSpent: true,
    showMethodSig: true,
    token: "ETH",
    currency: "USD",
    // gasPriceApi: process.env.GASPRICE_API_ENDPOINT,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    excludeContracts: [],
    src: "./contracts",
  },
  networks: {
    hardhat: {
      blockGasLimit: 30000000,
      accounts: {
        mnemonic,
      },
      chainId: chainIds.hardhat,
    },
    // network: getChainConfig("{INSERT_NAME}"),
    mainnet: getChainConfig("mainnet"),
    sepolia: getChainConfig("eth-sepolia"),
    mumbai: getChainConfig("polygon-mumbai"),
    rootstock: getChainConfig("rootstock"),
    rsktestnet: getChainConfig("rootstock-testnet"),
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.28",
    settings: {
      viaIR: true,
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 20_000,
        details: {
          deduplicate: true,
          cse: true,
          constantOptimizer: true,
          peephole: true,
          jumpdestRemover: true,
          yul: true,
          yulDetails: {
            stackAllocation: true,
          },
        },
      },
    },
  },
  typechain: {
    outDir: "src/types",
    target: "ethers-v6",
  },
  docgen: {
    pages: "files",
  }
};

export default config;
