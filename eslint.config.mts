import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import json from '@eslint/json';
import markdown from '@eslint/markdown';
import css from '@eslint/css';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
        plugins: { js },
        extends: ['js/recommended'],
        languageOptions: { globals: { ...globals.browser, ...globals.node } },
    },

    // Keep the TypeScript ESLint recommended base (provides core TS rules)
    tseslint.configs.recommended,

    // JSON, Markdown, CSS overrides
    {
        files: ['**/*.json'],
        plugins: { json },
        language: 'json/json',
        extends: ['json/recommended'],
    },
    {
        files: ['**/*.jsonc'],
        plugins: { json },
        language: 'json/jsonc',
        extends: ['json/recommended'],
    },
    {
        files: ['**/*.md'],
        plugins: { markdown },
        language: 'markdown/commonmark',
        extends: ['markdown/recommended'],
    },
    { files: ['**/*.css'], plugins: { css }, language: 'css/css', extends: ['css/recommended'] },

    // TypeScript-specific settings merged from .eslintrc.json
    {
        files: ['**/*.ts', '**/*.mts', '**/*.cts'],
        // use the TypeScript parser
        languageOptions: {
            parser: '@typescript-eslint/parser',
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            globals: { ...globals.node, ...globals.browser },
        },
        plugins: {
            '@typescript-eslint': tseslint, // reference the typescript-eslint package import
        },
        extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
        rules: {
            'no-unused-vars': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
        },
        // env equivalent from .eslintrc.json
        // env: {
        //     node: true,
        //     es2021: true,
        // },
    },
]);
