module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['src/api/generated/**'],
  plugins: ['deprecation'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ExportNamedDeclaration[declaration!=null]',
        message: 'Declare first, export at bottom.',
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      rules: {
        'deprecation/deprecation': 'warn',
      },
    },
  ],
};
