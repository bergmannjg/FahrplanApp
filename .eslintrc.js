module.exports = {
  root: true,
  parser: `@typescript-eslint/parser`,
  parserOptions: {
    project: `./tsconfig.json`
  },
  settings: {
    react: {
      version: '16.11.0',
    },
  },
  "plugins": ["@typescript-eslint"],
  "extends": [
    "@react-native",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  rules: {
    "react/prop-types": 0,
    "react/display-name": 0
  }
};