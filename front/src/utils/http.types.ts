export type HttpMethods = 'POST' | 'GET' | 'PUT' | 'DELETE';
export type HttpResponseType = 'json' | 'text' | 'raw';
export type HttpScalar = string | boolean | number | null | undefined;
export type HttpJsonData = {
  [key: string]: HttpScalar | HttpJsonData | HttpScalar[] | HttpJsonData[];
};
export type HttpData = FormData | object;

export interface ServiceType {
  url: string;
  method: HttpMethods;
}

export interface ModuleType {
  [key: string]: ServiceType;
}

export interface HttpRequestErrorParams<TPayload = unknown> {
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
