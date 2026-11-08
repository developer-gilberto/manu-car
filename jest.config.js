/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/.expo/', '/dist/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/app/**', '!src/**/*.d.ts'],
};
