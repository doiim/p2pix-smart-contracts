const tseslint = require("typescript-eslint");
const js = require("@eslint/js");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = tseslint.config(
  {
    ignores: [
      ".yarn/",
      "**/.coverage_artifacts",
      "**/.coverage_cache",
      "**/.coverage_contracts",
      "**/artifacts",
      "**/build",
      "**/cache",
      "**/coverage",
      "**/dist",
      "**/node_modules",
      "**/types",
      "deploys/old/",
      "docs/",
      "*.env",
      "*.log",
      ".pnp.*",
      "coverage.json",
      "npm-debug.log*",
      "yarn-debug.log*",
      "yarn-error.log*",
      ".solcover.js",
      "eslint.config.cjs",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": [
        "error",
        { ignoreIIFE: true, ignoreVoid: true },
      ],
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "_", varsIgnorePattern: "_" },
      ],
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
);
