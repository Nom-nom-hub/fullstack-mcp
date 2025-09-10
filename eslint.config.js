const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "indent": ["error", 2],
      // Remove the linebreak-style rule to avoid issues with different OS line endings
      "quotes": ["error", "single"],
      "semi": ["error", "always"],
      // Reduce severity of unused variable warnings
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      // Reduce severity of any type errors
      "@typescript-eslint/no-explicit-any": "warn"
    }
  }
);