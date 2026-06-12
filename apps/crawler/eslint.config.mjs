import baseConfig from "@catch-coffee/eslint-config";

export default [
  ...baseConfig,
  {
    ignores: ["dist/**", "node_modules/**", "eslint.config.mjs"],
  },
];
