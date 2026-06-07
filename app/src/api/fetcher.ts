import Axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';

function setApiBaseUrl(baseUrl: URL) {
  AXIOS_INSTANCE.defaults.baseURL = baseUrl.toString().replace(/\/+$/, '');
}

const AXIOS_INSTANCE = Axios.create();

AXIOS_INSTANCE.interceptors.request.use(config => {
  const method = (config.method ?? 'GET').toUpperCase();
  const base = config.baseURL ?? '';
  const path = config.url ?? '';
  const fullUrl = `${base}${path}`;
  console.log(`[API][REQ] ${method} ${fullUrl}`);
  return config;
});

AXIOS_INSTANCE.interceptors.response.use(
  response => {
    const method = (response.config.method ?? 'GET').toUpperCase();
    const base = response.config.baseURL ?? '';
    const path = response.config.url ?? '';
    const fullUrl = `${base}${path}`;
    console.log(`[API][RES] ${method} ${fullUrl} -> ${response.status}`);
    return response;
  },
  error => {
    const method = (error.config?.method ?? 'GET').toUpperCase();
    const base = error.config?.baseURL ?? '';
    const path = error.config?.url ?? '';
    const fullUrl = `${base}${path}`;
    const status = error.response?.status ?? 'NETWORK_ERROR';
    console.log(`[API][ERR] ${method} ${fullUrl} -> ${status}`);
    return Promise.reject(error);
  },
);

async function customAxios<TData>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<AxiosResponse<TData>> {
  return AXIOS_INSTANCE<TData>({
    validateStatus: () => true,
    ...config,
    ...options,
  });
}

type ErrorType<Error> = AxiosError<Error>;
type BodyType<BodyData> = BodyData;

export { customAxios, setApiBaseUrl };
export type { ErrorType, BodyType };
