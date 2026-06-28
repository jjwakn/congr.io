import type { JsonObject, JsonValue } from '@/types/json.types';
import i18n from '../../i18n';
import { API_URL } from './constants';
import { HttpRequestErrorParams, HttpRequestProps, ModuleType } from './http.types';
import { getSelectedCongregationId } from './storage';

export type { ModuleType } from './http.types';

export const HttpService: ModuleType = {};

export class HttpRequestError<TPayload = JsonValue> extends Error {
  statusCode: number;
  payload: TPayload | null;

  constructor({ statusCode, message, payload = null }: HttpRequestErrorParams<TPayload>) {
    super(message);
    this.name = 'HttpRequestError';
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

const getLegacyAuthToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
};

const parseResponseBody = async (response: Response): Promise<JsonValue | null> => {
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  try {
    if (contentType.includes('application/json')) return (await response.json()) as JsonValue;
    return await response.text();
  } catch {
    return null;
  }
};

const isJsonObject = (payload: JsonValue | null): payload is JsonObject =>
  Boolean(payload) && typeof payload === 'object' && !Array.isArray(payload);

const parseErrorMessage = (payload: JsonValue | null, fallback: string): string => {
  if (isJsonObject(payload) && 'message' in payload) {
    const message = payload.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim()) return message;
  }

  if (typeof payload === 'string' && payload.trim()) return payload;

  return fallback || i18n.t('http.error.requestFailed');
};

export const httpRequest = async <ResponseType>({
  service,
  data,
  url: baseURL = API_URL,
  headers,
  responseType = 'json',
  requestInit,
}: HttpRequestProps) => {
  const isAbsoluteUrl = /^https?:\/\//i.test(service.url);
  const cleanBaseURL = baseURL.replace(/\/+$/, '');
  const cleanServiceURL = service.url.replace(/^\/+/, '');

  let url = isAbsoluteUrl ? service.url : cleanServiceURL ? `${cleanBaseURL}/${cleanServiceURL}` : cleanBaseURL;

  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const jsonData = data && !isFormData ? ({ ...data } as JsonObject) : undefined;

  // Replacing path params
  if (url.match(/{[A-z]+}/gi)) {
    if (!jsonData || !Object.keys(jsonData).length) throw new Error(i18n.t('http.error.emptyData'));

    const pathParams = url
      .split('/')
      .filter((x: string) => x.startsWith('{') && x.endsWith('}'))
      .map((x: string) => x.replace('{', '').replace('}', ''));

    pathParams.forEach((param) => {
      if (!(param in jsonData)) throw new Error(i18n.t('http.error.paramNotFound', { param, url }));

      const value = jsonData[param] ?? '';

      url = url.replace(`{${param}}`, value.toString());

      // deleting so it wont be included in body anymore
      delete jsonData[param];
    });
  }

  // Converting to query params if method is GET
  if (service.method === 'GET' && jsonData && Object.keys(jsonData).length) {
    const queryParams = Object.entries(jsonData).map(([key, value]) => {
      if (value === null || value === undefined || value === '')
        throw new Error(i18n.t('http.error.missingParam', { key }));
      if (typeof value === 'object') throw new Error(i18n.t('http.error.missingParam', { key }));

      return `${encodeURIComponent(key)}=${encodeURIComponent(value.toString())}`;
    });

    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}${queryParams.join('&')}`;
  }

  const requestHeaders: Record<string, string> = {
    'Accept-Language': i18n.language || 'en',
    ...headers,
  };
  const legacyAuthToken = getLegacyAuthToken();
  if (legacyAuthToken && !requestHeaders.Authorization) requestHeaders.Authorization = `Bearer ${legacyAuthToken}`;
  const congregationId = getSelectedCongregationId();
  if (congregationId && !requestHeaders['X-Congregation-Id']) requestHeaders['X-Congregation-Id'] = congregationId;

  if (!isFormData && service.method !== 'GET')
    requestHeaders['Content-Type'] = requestHeaders['Content-Type']
      ? requestHeaders['Content-Type']
      : 'application/json';

  let requestBody: BodyInit | undefined;
  if (service.method !== 'GET') {
    if (isFormData) requestBody = data as FormData;
    else if (jsonData && Object.keys(jsonData).length) requestBody = JSON.stringify(jsonData);
  }

  const response = await fetch(url, {
    ...requestInit,
    method: service.method,
    headers: requestHeaders,
    credentials: requestInit?.credentials ?? 'include',
    ...(requestBody ? { body: requestBody } : {}),
  });

  if (!response.ok) {
    const payload = await parseResponseBody(response);
    throw new HttpRequestError({
      statusCode: response.status,
      message: parseErrorMessage(payload, response.statusText),
      payload,
    });
  }

  if (responseType === 'raw') return response as ResponseType;

  const parsed = await parseResponseBody(response);
  if (responseType === 'text') return (parsed ?? '') as ResponseType;

  return parsed as ResponseType;
};
