import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";
import "hardhat-contract-sizer";
import { resolve } from "path";
import "solidity-docgen";

dotenvConfig({ path: resolve(__dirname, "./.env") });

// Default mnemonic used by Hardhat / Anvil for deterministic accounts.
// Lets `--network localhost` (and the default in-process `hardhat` net)
// run without a .env. Public networks still require a real MNEMONIC.
const DEFAULT_MNEMONIC =
  "test test test test test test test test test test test junk";

const mnemonic: string =
  process.env.MNEMONIC ?? DEFAULT_MNEMONIC;
const alchemyApiKey: string | undefined =
  process.env.ALCHEMY_API_KEY;
const privateKey: string | undefined =
  process.env.PRIVATE_KEY;

const chainIds = {
  // "{INSERT_NAME}": {INSERT_ID},
  hardhat: 31337,
  localhost: 31337,
  mainnet: 1,
  "eth-sepolia": 11155111,
  "polygon-mainnet": 137,
  "arb-mainnet": 42161,
  rootstock: 30,
  "rootstock-testnet": 31,
};

function getChainConfig(
  chain: keyof typeof chainIds,
): NetworkUserConfig {
  if (!alchemyApiKey) {
    throw new Error(
      `Please set ALCHEMY_API_KEY in a .env file before targeting ${chain}`,
    );
  }
  const jsonRpcUrl =
    "https://" + chain + ".g.alchemy.com/v2/" + alchemyApiKey;
  return {
    accounts: privateKey
      ? [privateKey]
      : {
          count: 10,
          mnemonic,
          path: "m/44'/60'/0'/0",
        },
    chainId: chainIds[chain],
    url: jsonRpcUrl,
  };
}

const liveNetworks: Record<string, NetworkUserConfig> =
  alchemyApiKey
    ? {
        mainnet: getChainConfig("mainnet"),
        sepolia: getChainConfig("eth-sepolia"),
        polygon: getChainConfig("polygon-mainnet"),
        arbitrum: getChainConfig("arb-mainnet"),
        rootstock: getChainConfig("rootstock"),
        rsktestnet: getChainConfig("rootstock-testnet"),
      }
    : {};

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
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
    // External Anvil / Hardhat node (e.g. `anvil --port 8545`). Used by
    // the frontend e2e suite to deploy a fresh chain per CI run.
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: chainIds.localhost,
      accounts: {
        mnemonic,
      },
    },
    ...liveNetworks,
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
  },
};

export default config;
