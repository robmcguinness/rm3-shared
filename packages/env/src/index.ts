import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// The type-level members come off the `z` namespace on purpose. `ZodRawShape`
// carries zod's own name for the record of field schemas; imported bare it
// would be a local symbol named "shape", which anti-slop rejects, while
// `z.ZodRawShape` is a borrowed member name the rule allows.
import { z } from 'zod';

/**
 * Configuration options for createEnv
 */
export interface EnvConfig<T extends z.ZodRawShape> {
  /** Zod schema defining environment variables */
  schema: T;
}

/**
 * Creates a validated, type-safe environment object from process.env
 *
 * @example
 * ```ts
 * // env.config.ts
 * import { createEnv } from '@rm3/env';
 * import { z } from 'zod';
 *
 * export const $env = createEnv({
 *   schema: {
 *     OM_PORT: z.coerce.number().default(3000),
 *     OM_HOST: z.string().default('localhost'),
 *   },
 * });
 *
 * // Usage via #env subpath
 * import { $env } from '#env';
 * console.log($env.OM_PORT); // fully typed!
 * ```
 */
export function createEnv<T extends z.ZodRawShape>(
  config: EnvConfig<T>,
): Readonly<z.infer<z.ZodObject<T>>> {
  const schema = z.object(config.schema);
  const result = schema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return Object.freeze(result.data);
}

/**
 * Walks up from `start` until it finds the pnpm workspace root (the directory
 * containing `pnpm-workspace.yaml`). Falls back to `start`.
 */
export function findWorkspaceRoot(start: string): string {
  let dir = start;
  for (;;) {
    // oxlint-disable-next-line node/no-sync -- runs once at startup, before anything else is scheduled
    if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return start;
    }
    dir = parent;
  }
}

/**
 * Loads the workspace-root `.env` into `process.env`, regardless of the current
 * working directory or entry point — so the server and `pnpm db:migrate` always
 * read the same file.
 *
 * Variables already present in `process.env` (shell exports, inline `FOO=bar`
 * prefixes) take precedence over the file, matching Node's `--env-file`
 * semantics, so `ENVIRONMENT=test pnpm …` and CI-provided secrets keep winning.
 *
 * Importing `@rm3/env/load` runs this once as a side effect; call it directly
 * to force a (re)load.
 */
export function loadRootEnv(): void {
  const file = path.join(findWorkspaceRoot(process.cwd()), '.env');
  // oxlint-disable-next-line node/no-sync -- runs once at startup, before anything else is scheduled
  if (!existsSync(file)) {
    return;
  }
  const preset = { ...process.env };
  process.loadEnvFile(file);
  // Restore pre-existing values so the environment wins over the file.
  Object.assign(process.env, preset);
}

let loaded = false;

/**
 * Optional async hook for fetching remote/async variables (e.g. secrets from a
 * vault). Returns a flat record merged into `process.env`. No production source
 * is wired in yet — this is the extension point.
 */
export type AsyncEnvSource = () => Promise<Record<string, string | undefined>>;

/**
 * Async, idempotent environment loader for use as a Node `--import` preloader.
 *
 * Because a `--import`ed module's top-level await fully settles before the main
 * entry module graph evaluates, awaiting this in `@rm3/env/load` guarantees
 * `process.env` is populated — including any async-fetched values — before any
 * `createEnv()` reads it.
 *
 * Precedence (lowest → highest): schema defaults < `.env` file < async-fetched
 * < shell/CLI vars. The shell snapshot is taken first and never overwritten, so
 * `ENVIRONMENT=test pnpm …` and CI-provided secrets keep winning; fetched values
 * fill in over the `.env` file.
 */
export async function loadEnv(source?: AsyncEnvSource): Promise<void> {
  if (loaded) {
    return;
  }
  loaded = true;

  const shellPreset = { ...process.env };

  loadRootEnv();

  if (source) {
    const fetched = await source();
    for (const [key, value] of Object.entries(fetched)) {
      // Shell/CLI vars win over fetched values; fetched wins over the .env file.
      if (value !== undefined && !(key in shellPreset)) {
        process.env[key] = value;
      }
    }
  }
}
