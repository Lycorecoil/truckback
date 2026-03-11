import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '<rootDir>/tests/**/*.spec.ts',
    '<rootDir>/tests/**/*.test.ts',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
  ],
  coverageReporters: ['lcov', 'text'],
};

export default config;
