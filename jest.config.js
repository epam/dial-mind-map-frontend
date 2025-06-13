// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    'lodash-es/(.*)': 'lodash/$1',
  },
  collectCoverage: true,
  transformIgnorePatterns: ['/node_modules/(?!lodash-es)'],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text-summary'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/index.ts', '!src/**/*.d.ts', '!src/**/__tests__/**'],
};

module.exports = createJestConfig(customJestConfig);
