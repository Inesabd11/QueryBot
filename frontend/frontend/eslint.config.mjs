//eslint.config.mjs
// This file is used to configure ESLint for a Next.js project with TypeScript support.
// It extends the recommended ESLint configurations for Next.js and TypeScript.
// The configuration is written in ECMAScript modules format (ESM) and uses the FlatCompat API
// from ESLint to allow for compatibility with the older CommonJS format.
// The configuration is exported as a default export, which can be used by ESLint to lint the project files.
// The configuration includes the following:
// - Extends the recommended ESLint configurations for Next.js and TypeScript.
// - Uses the FlatCompat API to allow for compatibility with the older CommonJS format.
// - The configuration is written in ESM format, which is the modern JavaScript module format.
// - The configuration is exported as a default export, which can be used by ESLint to lint the project files.
// - The configuration is located in the frontend/frontend directory of the project.
// - The configuration is used to lint the project files in the frontend/frontend directory.

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
