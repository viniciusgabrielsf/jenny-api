// import { createDefaultPreset } from 'ts-jest';

// const tsJestTransformCfg = createDefaultPreset().transform;

// /** @type {import("jest").Config} **/
// module.exports = {
//     testEnvironment: 'node',
//     transform: {
//         ...tsJestTransformCfg,
//     },
// };

import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.spec.ts'],
    collectCoverageFrom: ['src/**/*.ts', '!src/__tests__/**', '!src/mocks/**', '!src/**/*.mock.ts'],
    moduleFileExtensions: ['ts', 'js'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
};

export default config;
