# @rm3/typescript-config

Shared TypeScript compiler presets. Every TS package in this workspace, and in `machdown` and
`openmint`, extends one of them instead of repeating compiler options.

## Which preset

| Preset            | Use it for                                                                            | Emits                         |
| ----------------- | ------------------------------------------------------------------------------------- | ----------------------------- |
| `node-app.json`   | Node services, CLIs, tests, and packages that Node runs from source by type stripping | no (`noEmit`)                 |
| `node-lib.json`   | Packages that `tsc -b` builds into `dist/` with `.d.ts` files                         | yes (`declaration`, `outDir`) |
| `react-vite.json` | React apps that Vite bundles                                                          | no                            |
| `vite-node.json`  | The Node-side files of a Vite app: `vite.config.ts`, build scripts                    | no                            |

`node-app.json` is also the default export, so `"extends": "@rm3/typescript-config"` gets it.

## How to extend

```jsonc
// packages/example/tsconfig.json
{
    "extends": "@rm3/typescript-config/node-app.json",
    "references": [{ "path": "../other-package" }],
}
```

Keep the consumer file small. Every path in the presets uses `${configDir}`, which TypeScript
resolves against the _extending_ config, not this package. Set only:

- `include` — when the sources are not in `src/`
- `references` — for project references
- `types` — to add to the preset list (this replaces it; repeat `"node"` if you still need it)

Do not repeat `target`, `lib`, `module`, `strict`, `outDir`, or `rootDir`. If a preset is wrong for
a package, change the preset here.

`vite-node.json` has no `include` on purpose: the consumer lists its own files, usually
`["vite.config.ts"]`.

## Legacy aliases

`node24-apps.json`, `node24-libs.json`, and `react.json` are one-line aliases that forward to the
new names. They exist only until `openmint` migrates in Phase C. Do not extend them in new code.
