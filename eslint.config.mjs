import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Project-wide: catch(e: any) and API response patterns are established conventions
      "@typescript-eslint/no-explicit-any": "warn",
      // ThemeProvider uses controlled setState pattern inside effect intentionally
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Electron build artifacts and reference/legacy code:
    "release/**",
    "_reference_repo/**",
    "scripts/**",
    // shadcn auto-generated UI components
    "components/ui/sidebar.tsx",
    // Electron main process and legacy CommonJS utility files
    "main.js",
    "report-cases.js",
    "fix-all-cases.js",
    "fix-cases.js",
  ]),
]);

export default eslintConfig;
