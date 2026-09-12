import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import Fastify from 'fastify';

import {
  createFastifyLogger,
  createRequestSerializer,
  DEFAULT_REQUEST_HEADERS,
  type DestinationStream,
  type RequestLike,
} from './index.ts';

import type { IncomingHttpHeaders } from 'node:http';

/**
 * The fields these tests read back off a written line. Only what the
 * assertions look at, so the contract stays small.
 */
interface LogLine {
  code?: string;
  err?: { code?: string };
  msg?: string;
  req?: {
    headers?: IncomingHttpHeaders;
    host?: string;
    method?: string;
    remoteAddress?: string;
    remotePort?: number;
    url?: string;
    version?: string;
  };
  res?: { statusCode?: number };
  token?: string;
  user?: { password?: string };
}

interface Capture {
  /** Stream handed to `createFastifyLogger`. */
  stream: DestinationStream;
  /** Every line written so far, parsed from NDJSON. */
  lines: () => LogLine[];
}

/** Parses one NDJSON line pino wrote. */
function parseLine(line: string): LogLine {
  // SAFETY: pino writes exactly one JSON object per line, and `LogLine` claims
  // only optional fields, so every parsed line satisfies it.
  return JSON.parse(line) as LogLine;
}

/** Collects the NDJSON lines a logger writes, without touching stdout. */
function capture(): Capture {
  const chunks: string[] = [];
  return {
    lines: () =>
      chunks
        .join('')
        .split('\n')
        .filter((line) => line.length > 0)
        .map(parseLine),
    stream: {
      write(chunk: string) {
        chunks.push(chunk);
      },
    },
  };
}

const browserRequest = (): RequestLike => ({
  headers: {
    accept: '*/*',
    authorization: 'Bearer secret',
    host: '127.0.0.1:4000',
    origin: 'chrome-extension://abc',
    'sec-ch-ua': '"Chrome";v="147"',
    'sec-fetch-site': 'none',
    'user-agent': 'Mozilla/5.0',
  },
  ip: '127.0.0.1',
  method: 'GET',
  url: '/v1/health',
});

describe('createRequestSerializer', () => {
  test('keeps only the allow-listed headers that are present', () => {
    const serialize = createRequestSerializer();

    const { headers } = serialize(browserRequest());

    assert.equal(headers.origin, 'chrome-extension://abc');
    assert.equal(headers['sec-fetch-site'], 'none');
    assert.equal(headers['user-agent'], 'Mozilla/5.0');
    assert.equal(headers.authorization, 'Bearer secret');
    assert.ok(!('accept' in headers), 'accept is noise');
    assert.ok(!('sec-ch-ua' in headers), 'sec-ch-ua is noise');
    assert.ok(!('host' in headers), 'host is not on the list');
    // An allow-listed name the request did not send is absent, not `undefined`.
    assert.ok(!('content-type' in headers));
  });

  test('reports method, url and remoteAddress and nothing else', () => {
    const serialized = createRequestSerializer()(browserRequest());

    assert.deepEqual(Object.keys(serialized).toSorted(), [
      'headers',
      'method',
      'remoteAddress',
      'url',
    ]);
    assert.equal(serialized.method, 'GET');
    assert.equal(serialized.url, '/v1/health');
    assert.equal(serialized.remoteAddress, '127.0.0.1');
  });

  test('replaces the default list when given one', () => {
    const serialize = createRequestSerializer(['x-only']);

    const { headers } = serialize({
      ...browserRequest(),
      headers: { origin: 'https://a.test', 'x-only': 'yes' },
    });

    assert.deepEqual(headers, { 'x-only': 'yes' });
  });

  test('passes a multi-value header through unchanged', () => {
    const serialize = createRequestSerializer(['x-many']);

    const { headers } = serialize({ ...browserRequest(), headers: { 'x-many': ['a', 'b'] } });

    assert.deepEqual(headers['x-many'], ['a', 'b']);
  });

  test('exports the default list the security hook relies on', () => {
    for (const name of ['origin', 'sec-fetch-site', 'content-type', 'authorization']) {
      assert.ok(DEFAULT_REQUEST_HEADERS.includes(name), `${name} is no longer logged`);
    }
  });
});

describe('createFastifyLogger', () => {
  test('drives Fastify request logging with the allow-listed req and the default res', async () => {
    const sink = capture();
    const app = Fastify({
      loggerInstance: createFastifyLogger({ level: 'info', pretty: false }, sink.stream),
    });
    app.get('/health', async () => ({ ok: true }));

    const response = await app.inject({
      headers: { accept: '*/*', authorization: 'Bearer secret', origin: 'https://a.test' },
      method: 'GET',
      url: '/health',
    });
    assert.equal(response.statusCode, 200);
    await app.close();

    const incoming = sink.lines().find((line) => line.msg === 'incoming request');
    assert.ok(incoming?.req, 'Fastify logged no incoming request');
    // The instance's serializer won over Fastify's default: no host/port/version.
    assert.equal(incoming.req.host, undefined);
    assert.equal(incoming.req.remotePort, undefined);
    assert.equal(incoming.req.version, undefined);
    assert.equal(incoming.req.method, 'GET');
    assert.equal(incoming.req.url, '/health');
    assert.equal(incoming.req.headers?.origin, 'https://a.test');
    assert.ok(!('accept' in (incoming.req.headers ?? {})), 'accept leaked into the log');
    // Present but censored: the line proves a token was sent, never which one.
    assert.equal(incoming.req.headers?.authorization, '[redacted]');
    assert.ok(sink.lines().every((line) => !JSON.stringify(line).includes('secret')));

    const completed = sink.lines().find((line) => line.msg === 'request completed');
    assert.ok(completed, 'Fastify logged no request completed');
    // Fastify's own `res` serializer survived the merge.
    assert.equal(completed.res?.statusCode, 200);
  });

  test('merges extra redact paths with the baseline and leaves err.code alone', () => {
    const sink = capture();
    const log = createFastifyLogger({ pretty: false, redactPaths: ['token', 'code'] }, sink.stream);

    log.info(
      { code: 'PAIR-1234', err: { code: 'E_FAIL' }, token: 't-1', user: { password: 'p' } },
      'pairing',
    );

    const [line] = sink.lines();
    assert.ok(line);
    assert.equal(line.token, '[redacted]');
    assert.equal(line.code, '[redacted]');
    assert.equal(line.user?.password, '[redacted]');
    assert.equal(line.err?.code, 'E_FAIL');
  });

  test('does not censor a top-level token without an extra path', () => {
    // pino's `*` matches one level, so `*.token` misses `{ token }`. Consumers
    // that log one must add `token` themselves.
    const sink = capture();
    const log = createFastifyLogger({ pretty: false }, sink.stream);

    log.info({ token: 't-1' }, 'bare');

    const [line] = sink.lines();
    assert.equal(line?.token, 't-1');
  });
});
