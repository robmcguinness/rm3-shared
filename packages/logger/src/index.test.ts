import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createLogger, type DestinationStream } from './index.ts';

/**
 * The fields these tests read back off a written line. A named contract rather
 * than `Record<string, unknown>`: the assertions below only ever look at the
 * base field and the redacted path, so that is the whole contract.
 */
interface LogLine {
  service?: string;
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
  it('stamps every line with the service base field', () => {
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

  it('omits the service key when no service is given', () => {
    const sink = capture();
    const log = createLogger({ pretty: false }, sink.stream);

    log.info('no base');

    const [line] = sink.lines();
    assert.ok(line);
    assert.ok(!('service' in line));
  });

  it('censors redacted paths', () => {
    const sink = capture();
    const log = createLogger({ pretty: false }, sink.stream);

    log.info({ user: { password: 'hunter2' } }, 'signed in');

    const [line] = sink.lines();
    assert.ok(line);
    assert.equal(line.user?.password, '[redacted]');
  });
});
