import {
  createLogger,
  type CreateLoggerOptions,
  type DestinationStream,
  type Logger,
} from '@rm3/logger';

import type { IncomingHttpHeaders } from 'node:http';

export { REDACT_PATHS, resolveRedactPaths } from '@rm3/logger';
export type { DestinationStream, Logger };

/**
 * Lower-case header names kept on `req.headers`.
 *
 * `origin`, `sec-fetch-site` and `sec-fetch-mode` are what a browser-facing
 * security hook decides on; `content-type` and `content-length` describe the
 * payload; `user-agent` names the client. `authorization` is kept so the line
 * shows the token was sent, and redaction censors its value.
 */
export const DEFAULT_REQUEST_HEADERS: readonly string[] = [
  'origin',
  'sec-fetch-site',
  'sec-fetch-mode',
  'content-type',
  'content-length',
  'user-agent',
  'authorization',
];

/**
 * The slice of a Fastify request the serializer reads.
 *
 * Structural rather than `FastifyRequest`: this package ships TypeScript
 * source over a `link:`, so a consumer's `fastify` copy and this repo's would
 * otherwise be compared at the boundary.
 */
export interface RequestLike {
  headers: IncomingHttpHeaders;
  ip: string;
  method: string;
  url: string;
}

export interface SerializedRequest {
  headers: IncomingHttpHeaders;
  method: string;
  remoteAddress: string;
  url: string;
}

export interface CreateFastifyLoggerOptions extends CreateLoggerOptions {
  /** Replaces {@link DEFAULT_REQUEST_HEADERS}. Names are matched lower-case. */
  requestHeaders?: readonly string[];
}

/**
 * Builds a pino `req` serializer that copies only the allow-listed headers
 * that are present. A multi-value header passes through unchanged.
 */
export function createRequestSerializer(
  names: readonly string[] = DEFAULT_REQUEST_HEADERS,
): (request: RequestLike) => SerializedRequest {
  return (request) => {
    const headers: IncomingHttpHeaders = {};
    for (const name of names) {
      const value = request.headers[name];
      if (value !== undefined) {
        headers[name] = value;
      }
    }
    return { headers, method: request.method, remoteAddress: request.ip, url: request.url };
  };
}

/**
 * A pino logger for Fastify's `loggerInstance` option.
 *
 * The `req` serializer set here survives Fastify's child logger: Fastify merges
 * its own defaults under the instance's serializers, so `res` and `err` keep
 * Fastify's shape while `req` is the allow-listed one.
 *
 * @example
 * ```ts
 * const app = Fastify({
 *   loggerInstance: createFastifyLogger({ level: 'info', redactPaths: ['code'] }),
 * });
 * ```
 */
export function createFastifyLogger(
  options: CreateFastifyLoggerOptions = {},
  destination?: DestinationStream,
): Logger {
  const { requestHeaders = DEFAULT_REQUEST_HEADERS, serializers, ...rest } = options;
  return createLogger(
    { ...rest, serializers: { req: createRequestSerializer(requestHeaders), ...serializers } },
    destination,
  );
}
