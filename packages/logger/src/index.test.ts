import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createLogger, REDACT_PATHS, resolveRedactPaths, type DestinationStream } from './index.ts';

/**
 * The fields these tests read back off a written line. A named contract rather
 * than `Record<string, unknown>`: the assertions below only ever look at the
 * base field and the redacted path, so that is the whole contract.
 */
interface LogLine {
  service?: string;
  token?: string;
  user?: { password?: string };
}

interface Capture {
  /** Stream handed to `createLogger`. */
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

describe('createLogger', () => {
  test('stamps every line with the service base field', () => {
    const sink = capture();
    const log = createLogger({ pretty: false, service: 'x' }, sink.stream);

    log.info('first');
    log.warn('second');

    const lines = sink.lines();
    assert.equal(lines.length, 2);
    for (const line of lines) {
      assert.equal(line.service, 'x');
    }
  });

  test('omits the service key when no service is given', () => {
    const sink = capture();
    const log = createLogger({ pretty: false }, sink.stream);

    log.info('no base');

    const [line] = sink.lines();
    assert.ok(line);
    assert.ok(!('service' in line));
  });

  test('censors redacted paths', () => {
    const sink = capture();
    const log = createLogger({ pretty: false }, sink.stream);

    log.info({ user: { password: 'hunter2' } }, 'signed in');

    const [line] = sink.lines();
    assert.ok(line);
    assert.equal(line.user?.password, '[redacted]');
  });

  test('merges extra redact paths with the baseline', () => {
    const sink = capture();
    const log = createLogger({ pretty: false, redactPaths: ['token'] }, sink.stream);

    log.info({ token: 't-1', user: { password: 'hunter2' } }, 'signed in');

    const [line] = sink.lines();
    assert.ok(line);
    // The extra path is censored, and so is the baseline one.
    assert.equal(line.token, '[redacted]');
    assert.equal(line.user?.password, '[redacted]');
  });

  test('lists the baseline first and drops duplicate extras', () => {
    const paths = resolveRedactPaths(['*.token', 'x']);

    assert.deepEqual(paths.slice(0, REDACT_PATHS.length), REDACT_PATHS);
    assert.equal(paths.length, REDACT_PATHS.length + 1);
    assert.equal(paths.at(-1), 'x');
  });
});
