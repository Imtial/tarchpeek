/** @type {import('@hey-api/openapi-ts').UserConfig} */
module.exports = {
  input: './tubearchivist_api.yaml',
  output: {
    entryFile: false,
    path: './src/api/generated',
  },
  plugins: ['@hey-api/typescript'],
};
