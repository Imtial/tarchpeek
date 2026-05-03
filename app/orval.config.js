module.exports = {
  tubearchivist: {
    input: {
      target: './tubearchivist_api.yaml',
    },
    output: {
      client: 'axios-functions',
      mode: 'split',
      target: 'src/api/generated/endpoints/tubearchivist.ts',
      schemas: 'src/api/generated/models',
      clean: true,
      override: {
        mutator: {
          path: './src/api/fetcher.ts',
          name: 'customAxios',
        },
      },
    },
  },
};
