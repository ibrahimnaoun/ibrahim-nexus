import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  js.configs.recommended,
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Custom rules configuration
      "@typescript-eslint/no-explicit-any": "warn", // Make it a warning instead of error
      "react/no-unescaped-entities": ["error", {
        "forbid": [">", "}", "\""] // Only enforce for these characters
      }]
    }
  },
  {
    // Apply specific rules to TypeScript files
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error" // Make it error for TS files
    }
  },
  {
    ignores: [
      "node_modules/",
      ".next/",
      "out/",
      "dist/"
    ]
  }
];