const nextJest = require('next/jest');

// Lock the test runner's local timezone so date-comparison logic (which mixes
// Asia/Phnom_Penh Intl formatting with local Date#getDate/#setDate) is
// deterministic regardless of the host machine's configured timezone.
process.env.TZ = 'UTC';

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
};

module.exports = createJestConfig(customJestConfig);
