import i18n from '../../i18n';
import { API_URL } from './constants';

type HttpMethods = 'POST' | 'GET' | 'PUT' | 'DELETE';

interface ServiceType {
  url: string;
  method: HttpMethods;
}
export interface ModuleType {
  [key: string]: ServiceType;
}

export const HttpService: ModuleType = {};

export const httpRequest = async <ResponseType>({
  service,
  data,
  url: baseURL = API_URL,
}: {
  service: ServiceType;
  data?: {
    [key: string]: string | boolean | number;
  };
  url?: string;
}) => {
  let url = `${baseURL}/${service.url}`;

  // Replacing path params
  if (url.match(/{[A-z]+}/gi)) {
    if (!data || !Object.keys(data).length)
      throw new Error(i18n.t('http.error.emptyData'));

    const pathParams = url
      .split('/')
      .filter((x: string) => x.startsWith('{') && x.endsWith('}'))
      .map((x: string) => x.replace('{', '').replace('}', ''));

    pathParams.forEach((param) => {
      if (!(param in data))
        throw new Error(i18n.t('http.error.paramNotFound', { param, url }));

      const value = data[param] ?? '';

      url = url.replace(`{${param}}`, value.toString());

      // deleting so it wont be included in body anymore
      delete data[param];
    });
  }

  // Converting to query params if method is GET
  if (service.method === 'GET' && data && Object.keys(data).length) {
    url += `?`;
    const queryParams = Object.entries(data).map(([key, value]) => {
      if (value === null || value === undefined || value === '')
        throw new Error(i18n.t('http.error.missingParam', { key }));

      return `${key}=${value}`;
    });
    url += queryParams.join('&');
  }

  const response = await fetch(url, {
    method: service.method,
    headers: {
      'Content-Type': 'application/json',
    },
    ...(typeof data === 'object' &&
      Object.keys(data).length &&
      service.method !== 'GET' && { body: JSON.stringify(data) }),
  });

  const result: ResponseType = await response.json();

  return result;
};
