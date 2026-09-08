module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  // The MCP suites load the SDK and spawn real server processes. Running every
  // suite at once exhausted worker memory on Windows, so cap the pool and
  // recycle workers that grow past the limit.
  maxWorkers: 2,
  workerIdleMemoryLimit: '512MB',
};
