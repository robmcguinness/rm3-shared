# Worker Threads

> Stream pipelines (pipeline(), async generators as transforms, backpressure, Readable.from, stream consumers) are covered by the `node-best-practices` skill.

---

## Worker Threads with parentPort/workerData

```typescript
// worker.ts
import { parentPort, workerData } from 'node:worker_threads';
const result = (workerData as number[]).reduce((sum, n) => sum + n, 0);
parentPort?.postMessage(result);

// main.ts
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';

const worker = new Worker(
  fileURLToPath(new URL('./worker.ts', import.meta.url)),
  { workerData: [1, 2, 3, 4, 5] }
);
worker.on('message', (result) => console.log('Sum:', result));
worker.on('error', console.error);
```