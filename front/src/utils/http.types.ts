import type { JsonValue } from '@/types/json.types';

export type HttpMethods = 'POST' | 'GET' | 'PUT' | 'DELETE';
export type HttpResponseType = 'json' | 'text' | 'raw';
export type HttpScalar = string | boolean | number | null | undefined;
export type HttpJsonData = {
  [key: string]: HttpScalar | JsonValue[] | HttpJsonData | HttpJsonData[];
};
export type HttpData = FormData | object;

export interface ServiceType {
  url: string;
  method: HttpMethods;
}

export interface ModuleType {
  [key: string]: ServiceType;
}

export interface HttpRequestErrorParams<TPayload = JsonValue> {
  statusCode: number;
  message: string;
  payload?: TPayload | null;
}

export interface HttpRequestProps {
  service: ServiceType;
  data?: HttpData;
  url?: string;
  headers?: Record<string, string>;
  responseType?: HttpResponseType;
  requestInit?: Omit<RequestInit, 'method' | 'headers' | 'body'>;
}
