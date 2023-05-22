module.exports = {
  configureYulOptimizer: true,
  solcOptimizerDetails: {
    deduplicate: true,
    cse: true,
    constantOptimizer: true,
    peephole: true,
    jumpdestRemover: true,
    yul: true,
    // inliner: false,
    // orderLiterals: true,
  },
  istanbulReporter: ["html", "lcov"],
  providerOptions: {
    mnemonic: process.env.MNEMONIC,
  },
  skipFiles: ["test", 'core/BaseUtils.sol', 'core/OwnerSettings.sol'],
};
