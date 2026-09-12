# @rm3/fastify

Request logging for Fastify, built on `@rm3/logger`.

The default Fastify `req` serializer drops headers; a custom one that copies
`request.headers` dumps every browser header on every line. This package keeps an
allow-list (`DEFAULT_REQUEST_HEADERS`) and merges an app's extra redact paths
with the shared baseline.

```ts
import Fastify from 'fastify';
import { createFastifyLogger } from '@rm3/fastify';

const app = Fastify({
    loggerInstance: createFastifyLogger({
        level: 'info',
        pretty: process.stdout.isTTY === true,
        redactPaths: ['code'], // app-specific secrets, on top of the baseline
    }),
});
```

Pass `requestHeaders` to replace the default header list. Pass a destination
stream as the second argument (with `pretty: false`) to capture NDJSON in tests.
