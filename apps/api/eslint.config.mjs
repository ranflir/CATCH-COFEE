import nestConfig from "@catch-coffee/eslint-config/nest.js";

export default [
  ...nestConfig,
  {
    ignores: ["dist/**", "node_modules/**", "eslint.config.mjs"],
  },
];
