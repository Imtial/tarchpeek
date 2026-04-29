module.exports = {
  tubearchivist: {
    input: {
      target: './tubearchivist_api.yaml',
    },
    output: {
      client: 'fetch',
      mode: 'split',
      target: 'src/api/generated/endpoints/tubearchivist.ts',
      schemas: 'src/api/generated/models',
      clean: true,
    },
  },
};
