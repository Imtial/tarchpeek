module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['src/api/generated/**'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ExportNamedDeclaration[declaration!=null]',
        message: 'Declare first, export at bottom.',
      },
    ],
  },
};
