import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

// Default mnemonic used by Hardhat / Anvil for deterministic accounts.
// Lets the in-process simulated network run without a .env. Public
// networks still require a real MNEMONIC.
const DEFAULT_MNEMONIC =
  "test test test test test test test test test test test junk";

const mnemonic = configVariable("MNEMONIC", {
  default: DEFAULT_MNEMONIC,
});

const chainIds = {
  mainnet: 1,
  sepolia: 11155111,
  polygon: 137,
  arbitrum: 42161,
  rootstock: 30,
  rsktestnet: 31,
} as const;

type LiveNetwork = keyof typeof chainIds;

function liveNetwork(
  chain: LiveNetwork,
  alchemyName: string,
) {
  return {
    type: "http" as const,
    chainType: "generic" as const,
    chainId: chainIds[chain],
    url: configVariable("ALCHEMY_API_KEY", {
      format: `https://${alchemyName}.g.alchemy.com/v2/{variable}`,
    }),
    accounts: {
      mnemonic,
      count: 10,
      path: "m/44'/60'/0'/0",
    },
  };
}

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
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
  networks: {
    default: {
      type: "edr-simulated",
      chainId: 31337,
      blockGasLimit: 30_000_000,
      accounts: {
        mnemonic,
      },
    },
    // External Anvil / Hardhat node (e.g. `anvil --port 8545`). Used by
    // the frontend e2e suite to deploy a fresh chain per CI run.
    localhost: {
      type: "http",
      chainId: 31337,
      url: "http://127.0.0.1:8545",
      accounts: {
        mnemonic,
      },
    },
    mainnet: liveNetwork("mainnet", "eth-mainnet"),
    sepolia: liveNetwork("sepolia", "eth-sepolia"),
    polygon: liveNetwork("polygon", "polygon-mainnet"),
    arbitrum: liveNetwork("arbitrum", "arb-mainnet"),
    rootstock: liveNetwork("rootstock", "rootstock"),
    rsktestnet: liveNetwork(
      "rsktestnet",
      "rootstock-testnet",
    ),
  },
  chainDescriptors: {
    11155111: {
      name: "sepolia",
      blockExplorers: {
        etherscan: {
          name: "Etherscan",
          url: "https://sepolia.etherscan.io",
          apiUrl: "https://api-sepolia.etherscan.io/api",
        },
      },
    },
    137: {
      name: "polygon",
      blockExplorers: {
        etherscan: {
          name: "Polygonscan",
          url: "https://polygonscan.com",
          apiUrl: "https://api.polygonscan.com/api",
        },
      },
    },
    42161: {
      name: "arbitrum",
      blockExplorers: {
        etherscan: {
          name: "Arbiscan",
          url: "https://arbiscan.io",
          apiUrl: "https://api.arbiscan.io/api",
        },
      },
    },
  },
  verify: {
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY", {
        default: "",
      }),
    },
  },
  typechain: {
    outDir: "src/types",
  },
  paths: {
    sources: {
      solidity: ["contracts"],
    },
    tests: {
      mocha: "test",
    },
  },
  test: {
    solidity: {
      fuzz: {
        runs: 4,
      },
      invariant: {
        runs: 4,
        depth: 4,
        failOnRevert: true,
      },
    },
  },
});
