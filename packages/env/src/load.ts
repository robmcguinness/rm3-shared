import { loadEnv } from './index.ts';

// Preloader entry point: `node --import @rm3/env/load …`.
// Top-level await guarantees process.env is fully populated (including any
// async-fetched vars) before the main entry module graph evaluates.
await loadEnv();
