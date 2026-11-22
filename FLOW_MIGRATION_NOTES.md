# GDevelop Flow-to-TypeScript Migration — Deferred Engineering Notes & Follow-Up Checklist

**Document Version**: 1.0.0  
**Scope**: Actionable caveats, deferred cleanup items, and edge-case reminders to observe during Phases 1–6 of the `newIDE/app` TypeScript migration.  
**Related Documents**:
- [Executive Overview (`FLOW_AUDIT_AND_MIGRATION_STRATEGY.md`)](./FLOW_AUDIT_AND_MIGRATION_STRATEGY.md)
- [Flow Diagnostic Audit Report (`FLOW_AUDIT_REPORT.md`)](./FLOW_AUDIT_REPORT.md)
- [Phased TypeScript Migration Strategy (`TYPESCRIPT_MIGRATION_STRATEGY.md`)](./TYPESCRIPT_MIGRATION_STRATEGY.md)

---

## 1. Migrating `BackgroundSerializer.worker.js` & `BackgroundSerializer.worker.spec.js` (High Priority — Phase 1/2)

### Why This Requires Special Handling
- **Files**:
  - `newIDE/app/src/Utils/BackgroundSerializer.worker.js`
  - `newIDE/app/src/Utils/BackgroundSerializer.worker.spec.js` (lines 6–18)
- **Current Behavior**:
  - `BackgroundSerializer.worker.js` currently uses **Flow comment-only annotations** (`/*: ?Promise<libGDevelop>*/`, `/*: string */`, `/*: MessageEvent */`) specifically so it remains valid raw JavaScript.
  - `BackgroundSerializer.worker.spec.js` reads the file directly from disk with `fs.readFileSync(path.join(__dirname, 'BackgroundSerializer.worker.js'), 'utf8')` and executes it verbatim inside Node's `vm.runInNewContext(workerSource, { self, Uint8Array, importScripts, initializeGDevelopJs })`.
- **Failure Mode Upon Migration**:
  - Once `BackgroundSerializer.worker.js` is renamed to `BackgroundSerializer.worker.ts` and converted to standard TypeScript syntax (`let modulePromise: Promise<libGDevelop> | null = null;`), `BackgroundSerializer.worker.spec.js` will:
    1. Fail with `ENOENT` unless the filename is updated to `BackgroundSerializer.worker.ts`.
    2. Fail with `SyntaxError` in `vm.runInNewContext(...)` unless TypeScript types are stripped before evaluation.

### Required Action When Migrating `BackgroundSerializer.worker.js`
1. **Update `BackgroundSerializer.worker.spec.js` (or `.spec.ts`)** to read `BackgroundSerializer.worker.ts` and strip TypeScript syntax before passing it to `vm.runInNewContext`:
   ```ts
   import fs from 'fs';
   import path from 'path';
   import vm from 'vm';
   import { transform } from 'sucrase';

   const rawWorkerSource = fs.readFileSync(
     path.join(__dirname, 'BackgroundSerializer.worker.ts'),
     'utf8'
   );
   const { code: workerSource } = transform(rawWorkerSource, {
     transforms: ['typescript'],
     disableESTransforms: true,
   });
   ```
   > **Warning**: Do **not** use `@babel/preset-typescript` alone to strip the classic worker script in tests or dev mode — if `import type` is present, `@babel/preset-typescript` emits a trailing `export {};` which throws `SyntaxError: Unexpected token 'export'` in classic `vm.runInNewContext` / classic `new Worker(...)` contexts. (`newIDE/app/vite.config.mjs` already handles dev-mode `.worker.ts` safely using Vite's `transformWithEsbuild(..., { format: 'iife', supported: { using: false } })`.)
2. **Classic Worker Ambient Globals**:
   - Declare `importScripts` and `initializeGDevelopJs` locally (or via a worker ambient declaration) so `BackgroundSerializer.worker.ts` compiles cleanly under `newIDE/app/tsconfig.json` without emitting runtime `import`/`export` statements.
   - Because `newIDE/app/tsconfig.json` has `"isolatedModules": true`, avoid adding a top-level `export {};` if using `sucrase` directly in `BackgroundSerializer.worker.spec.js` (or strip module syntax via `esbuild.transformSync(..., { loader: 'ts', format: 'iife' })` in the spec as well).

---

## 2. Dual-Prettier Coexistence & VS Code Format-on-Save (Phases 1–6)

- **Current Setup**:
  - `newIDE/app/package.json` uses `"prettier": "3.4.2"` (for migrated `.ts`/`.tsx` files and VS Code's Prettier extension) alongside `"prettier-legacy": "npm:prettier@1.15.3"` (for untouched legacy Flow `.js`/`.jsx` files), routed through `newIDE/app/scripts/run-prettier.js`.
- **Developer Workflow Caveat**:
  - If a developer saves an untouched legacy Flow `.js` file in VS Code with Format-on-Save enabled, VS Code's Prettier extension will format it with `prettier@3.4.2` (which differs from `1.15.3` on arrow parens / ternary wrapping). Running `npm run format` (or committing via `lint-staged`) automatically normalizes `.js` files back via `prettier-legacy@1.15.3`.
- **Phase 6 Cleanup Checklist** (after all `.js` Flow files in `newIDE/app/src` are migrated):
  1. Remove `"prettier-legacy"` from `newIDE/app/package.json`.
  2. Delete `newIDE/app/scripts/run-prettier.js`.
  3. Point `"format"`, `"check-format"`, and `"lint-staged"` directly to `prettier` (`3.4.2`).
  4. Remove the legacy Flow entries (`src/Utils/UseOptimisticState.js`, `src/Utils/Sha256.js`) from `newIDE/app/.prettierignore` once those two files are migrated to `.ts`.

---

## 3. Companion `.d.ts` & `.js.flow` Transitional Stubs Cleanup (Ongoing & Phase 6)

- **Companion `.d.ts` files** (e.g., `src/UI/Responsive/ResponsiveWindowMeasurer.d.ts`, `src/Utils/Analytics/EventSender.d.ts`, `src/Utils/GDevelopServices/Project.d.ts`, `src/Utils/i18n/MessageDescriptor.flow.d.ts`, etc.):
  - Delete each companion `.d.ts` file in the **same PR** that migrates its corresponding `.js` module to `.ts`/`.tsx`.
- **Companion `.js.flow` files**:
  - Keep strict 1:1 parity for all non-spec `.ts`/`.tsx` modules imported by Flow code during Phases 1–5.
  - Delete all `.js.flow` files (and remove `VersionMetadata.js.flow` generation from `scripts/make-version-metadata.js`) in Phase 6 when Flow is decommissioned.
- **`src/types/unmigrated-flow-modules.d.ts`**:
  - Never add double-wildcard (`*/Foo/*`, `TS5061`), relative (`./Foo`, `TS2436`), or `export =` + `export default` (`TS2309`) declarations.
  - Remove each top-level `declare module '*/<Subsystem>'` entry once that subsystem's entrypoint is migrated to TypeScript.

---

## 4. `newIDE/electron-app` Phase 6 Handling (Do Not Rename to `.ts`)

- `newIDE/electron-app` executes raw CommonJS `.js` files directly in Electron's Node main process (`electron app` -> `app/main.js`) with **no TypeScript or Babel build step**.
- Only 3 tracked files contain a legacy `// @flow` pragma (with **zero** Flow type syntax):
  - `newIDE/electron-app/app/LocalFilesystemWatcher.js`
  - `newIDE/electron-app/app/LocalGDJSDevelopmentWatcher.js`
  - `newIDE/electron-app/app/Utils/TimestampedId.js`
- **Action in Phase 6**: Simply remove the unused `// @flow` comment (or replace with `// @ts-check` + JSDoc types). Do **not** rename them to `.ts` unless a dedicated compilation pipeline is introduced for `electron-app`.

---

## 5. Theme & Version Scripts Verification (Phase 2 & Phase 6)

- `newIDE/app/scripts/lib/ReadThemeRegistry.js` and `newIDE/app/scripts/create-new-theme.js` have already been updated to support both `ThemeRegistry.ts` and `ThemeRegistry.js`. When migrating `src/UI/Theme/` in Phase 2, smoke-test `npm run build-theme-resources` (and verify `create-new-theme.js` against `ThemeRegistry.ts`).
- `newIDE/app/scripts/make-version-metadata.js` now outputs `VersionMetadata.ts`, `VersionMetadata.js.flow`, and `VersionMetadata.json` (and cleans up legacy `VersionMetadata.js`). In Phase 6, remove `VersionMetadata.js.flow` generation and its `.gitignore` line.

---

## 6. Clean `npm ci` & Full Test Verification Notes (Windows vs Linux CI)

- **`src/ResourcesLoader/index.spec.js` (Pre-existing Windows-only POSIX path failure)**:
  - Lines 11, 31, and 37 assert POSIX paths (`project.setProjectFile('/home/user/My Project/game.json')` -> `'file:///home/user/My Project/...'`), which on Windows resolve to `'file://D:/home/user/...'`.
  - These 2 assertions are pre-existing Windows-only failures unrelated to the TypeScript migration and should be verified on Linux CI (Semaphore / GitHub Actions).
- **Clean-room `npm ci` & Full `npm test` Run Log (Verified on Windows after all tooling fixes)**:
  - `cd newIDE/app && npm ci --no-audit --no-fund`: **PASSED** (`exit 0`, `added 2693 packages`, zero `ERESOLVE`, zero lockfile drift, full `postinstall` succeeded including `patch-package`, `GDJS`, `make-version-metadata`, `build-theme-resources`, `import-libGD`, `import-GDJS-Runtime`, `import-monaco-editor`, `import-zipped-external-libs`, `make-service-worker`, and `husky`).
  - Verified clean-installed versions: `prettier@3.4.2` (both `node_modules/prettier` and `node_modules/.bin/prettier`), `prettier-legacy@1.15.3`, `@types/react@18.3.31`, `@types/react-dom@18.3.7`, `@types/jest@27.5.2`, `@babel/preset-typescript@7.29.7`, `typescript@5.4.5`.
  - Post-`npm ci` gates: `npm run check-types` (`exit 0`), `npm run check-script-types` (`exit 0`), `npm run check-format` (`exit 0`).
  - Full `npm test -- --watchAll=false`: **247 / 248 suites passed** (**2,405 passed**, 1 skipped, **114 / 114 snapshots passed**); the only 2 failing assertions are the pre-existing Windows-only POSIX path tests in `src/ResourcesLoader/index.spec.js:31,37` (`file://D:/home/user/...` vs `file:///home/user/...`).
