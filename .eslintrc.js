module.exports = {
  "parser": "@typescript-eslint/parser",      // typescript-eslint parser to parse TS files.
  "extends": [
    "plugin:@typescript-eslint/recommended",  // Uses the recommended rules from the @typescript-eslint/eslint-plugin.
    "prettier",                               // Uses eslint-config-prettier to disable ESLint rules that would conflict with prettier.
    "prettier/@typescript-eslint",            // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier.
    "plugin:prettier/recommended"             // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  "parserOptions": {                          // See: https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/parser/README.md
    "ecmaVersion": 2018,
    "sourceType": "module",
    "project": "./tsconfig.json",
    "extraFileExtensions": [".vue"]
  },
  "rules": {
    "@typescript-eslint/explicit-member-accessibility": "off",    // "Off" to not to force to use public keyword on class properties.
    "@typescript-eslint/no-explicit-any": "off",                  // "Off" to allow explicit any.
    "@typescript-eslint/no-object-literal-type-assertion": "off"  // "off" to allow `{} as SomeType`.
  }
};
