import pinoPretty from 'pino-pretty';
import { pino, type DestinationStream, type Logger, type LoggerOptions } from 'pino';

export type { DestinationStream, Logger, LoggerOptions };

/**
 * Paths that must never be written to logs.
 *
 * Exported so a consumer can ratchet on it: a test that asserts a path is
 * redacted has one list to check.
 */
export const REDACT_PATHS: readonly string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  'headers.authorization',
  'headers.cookie',
  '*.password',
  '*.token',
  '*.access_token',
  '*.accessToken',
  '*.secret',
];

/**
 * The baseline plus the caller's extras, deduplicated.
 *
 * Returns a mutable array because pino's `redact.paths` wants `string[]`.
 * Note that pino's `*` wildcard matches exactly one level, so `*.token` does
 * not cover a top-level `token`; an app that logs one names it here.
 */
export function resolveRedactPaths(extras: readonly string[] = []): string[] {
  return [...new Set([...REDACT_PATHS, ...extras])];
}

export interface CreateLoggerOptions extends LoggerOptions {
  /** Pretty-print logs (development); structured JSON otherwise. Defaults to `true`. */
  pretty?: boolean;
  /**
   * Extra redact paths, merged with {@link REDACT_PATHS}. To replace the
   * baseline instead, pass pino's own `redact` option.
   */
  redactPaths?: readonly string[];
  /** Value of the `service` base field on every line. Omit for no base fields. */
  service?: string;
}

/**
 * Creates a configured Pino logger.
 *
 * Configuration is supplied by the caller — this package never reads
 * `process.env`. Apps own environment validation (see `@rm3/env`) and pass the
 * resolved values in. Sensitive fields ({@link REDACT_PATHS}) are redacted in
 * every environment.
 *
 * @example
 * ```ts
 * import { createLogger } from '@rm3/logger';
 * import { $env } from '#env';
 * const log = createLogger({
 *   level: $env.LOG_LEVEL,
 *   pretty: $env.ENVIRONMENT !== 'production',
 * });
 * log.info({ userId: '123' }, 'signed in');
 * ```
 *
 * @param options - Logger configuration.
 * @param destination - Optional stream that receives the log lines. Use it to
 * capture output in tests; when omitted, Pino writes to stdout.
 */
export function createLogger(
  options: CreateLoggerOptions = {},
  destination?: DestinationStream,
): Logger {
  const { level = 'info', pretty = true, redactPaths, service, ...rest } = options;

  const base: LoggerOptions = {
    base: service ? { service } : {},
    level,
    // Union, not replacement: an app adds its own secrets and never loses the
    // baseline by doing so.
    redact: { censor: '[redacted]', paths: resolveRedactPaths(redactPaths) },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...rest,
  };

  if (pretty) {
    // Run pino-pretty synchronously in the main thread rather than as a
    // worker transport. Node's --watch mode sends internal IPC messages on
    // worker channels that thread-stream mistakes for protocol messages,
    // causing spurious "this should not happen" errors on startup.
    const prettyStream = pinoPretty({
      colorize: true,
      ignore: 'pid,hostname',
      sync: true,
      translateTime: 'SYS:standard',
    });
    return pino(base, prettyStream);
  }

  return destination ? pino(base, destination) : pino(base);
}
