// Reuse Create React App's built-in Jest configuration.
//
// createJestConfig(resolve, rootDir, isEjecting) expects:
//   resolve  – function that resolves relative paths from react-scripts/
//   rootDir  – the project root (so imports resolve from src/)
//   isEjecting – false for non-ejected CRA projects
const createJestConfig = require('react-scripts/scripts/utils/createJestConfig');
const path = require('path');

module.exports = createJestConfig(
  (relativePath) => path.resolve(__dirname, 'node_modules/react-scripts', relativePath),
  __dirname,
  false,
);
