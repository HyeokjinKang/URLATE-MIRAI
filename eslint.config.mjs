import js from "@eslint/js";
import globals from "globals";
import * as mdx from "eslint-plugin-mdx";

export default [
  {
    ignores: [
      "build/**",
      ".docusaurus/**",
      "node_modules/**",
      "static/**",
      "i18n/**/*.json",
    ],
  },
  // Docusaurus config files: CommonJS running in Node.
  {
    ...js.configs.recommended,
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: { sourceType: "module" },
  },
  // Blog posts, announcements and docs.
  {
    ...mdx.flat,
    processor: mdx.createRemarkProcessor({
      lintCodeBlocks: true,
    }),
  },
  // Code blocks embedded in those Markdown files.
  {
    ...mdx.flatCodeBlocks,
    rules: {
      ...mdx.flatCodeBlocks.rules,
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
];
