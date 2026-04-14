import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scratch utility scripts — not production code
    "scratch/**",
    // Claude CLI worktrees — managed externally
    ".claude/**",
    // HTML email templates require inline CSS for Gmail/Outlook compatibility
    "src/lib/mail/templates/**",
  ]),
]);

export default eslintConfig;
