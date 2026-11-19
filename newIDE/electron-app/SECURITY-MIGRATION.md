# Phase 1 desktop security implementation notes

This supplements `docs/technical-debt-assessment.md` for TD-SEC-01, TD-SEC-02
and the critical-dependency portion of TD-DEP-01. It records boundaries and
remaining compatibility work; enabling Electron flags alone is not a sandbox.

## Desktop boundary

- Editor, preview and external-editor windows use context isolation, sandboxing,
  web security and disabled Node integration. Preloads expose named operations,
  not `require`, `ipcRenderer`, Electron events or arbitrary channel invocation.
- `DesktopService` is the renderer adapter. The web build has no desktop API;
  browser fallbacks remain usable. Node fallbacks support build scripts and Jest.
- Editor IPC checks the sender against the registered editor windows, its main
  frame and the exact editor origin. A preview or iframe cannot invoke editor IPC.
- `FileAccessPolicy` distinguishes file grants from recursive directory grants,
  and read access from write access. Canonical paths prevent traversal and junction
  escapes; recursive copies and archives validate their trees. Unapproved UNC
  paths are rejected before filesystem resolution.
- Initial editor grants cover application/runtime files for reading and a dedicated
  temporary directory and the default `Documents/GDevelop projects` workspace for writing.
  Open pickers grant read access. Save pickers grant write access to the selected file.
  `pickProjectLocation` (`desktop-pick-project-location`) handles project file
  (`.json`) and project folder selection in one native picker, granting recursive
  write access to the chosen project directory (or parent directory of the chosen `.json`
  project file). Opening a project outside a granted root explicitly requests access to
  its directory; choosing an unrelated JSON file via generic file pickers does not
  implicitly grant its parent directory.
- Unauthenticated public catalog endpoints needed by the packaged `gdide://app` editor
  use `readPublicCatalog` (`desktop-read-public-catalog`), which maps a fixed catalog key
  in the main process to a hardcoded production URL and fetches JSON via `net.fetch`
  with `credentials: 'omit'` and `redirect: 'error'` (never accepting renderer-supplied
  URLs or credentials). Browser and dev-server builds use direct HTTP requests.
- Grants are retained in `userData/file-access-grants.json` so recent projects and
  saved destinations work after restart. Legacy unversioned grants need fresh approval. Removing that file while the application
  is closed revokes remembered grants. Renderer path notifications do not grant
  access. User-supplied positional CLI project paths authorize their project folder;
  native CLI input/result arguments grant just the corresponding files.
- Manually entered destinations and paths outside granted roots require native
  confirmation. Running an npm script requires a separate native confirmation,
  because permission to save a project is not permission to execute its scripts.
- `gdevelop-file://local` checks the same policy before serving a file and again
  after resolving its real path. An omitted policy defaults to no allowed roots.

## Preview isolation and compatibility

The first preview uses the existing persistent `gdevelop-preview` partition.
Concurrent previews use separate numbered partitions and protocol handlers.
Closing a window revokes its handler before the partition can be reused.
External editors have a dedicated partition and load from `gdide://external`.
Local preview entry points and network sharing use generated directories beneath
the editor's private temporary directory. Each open project has a separate
export directory that stays stable for hot reloads.

Each preview can read its exported game directory and read/write `PreviewUserData`.
FileSystem events targeting other locations require a native, per-preview grant.
Credential directories and editor profile files remain blocked. Preview browser
storage starts in the isolated session; editor authentication must never be copied
into game storage. Legacy editor storage is retained on disk.

Steam previews use a main-process adapter with explicit method allowlists. Native
lobby handles stay in the main process; the renderer gets IDs and wrapper methods.
Workshop paths are checked against preview file permissions. Exported Electron
games retain their existing native Steam adapter; this change does not modify
the security model of exported games.

## Storage upgrade

Production editor origin changes from `file://` to `gdide://app`. Before loading
the editor, a hidden, sandboxed window reads legacy storage with page JavaScript
disabled. It copies localStorage, the cloud-project autosave database and Firebase
authentication storage into the same session's new origin. The migration runs in
each editor partition independently.

Existing destination records win on retries. The completion marker is written
only after the IndexedDB transactions finish. Legacy data is not removed. A failed
migration reports an error and leaves the previous data available for a retry,
instead of opening an apparently empty editor profile.

## Remaining synchronous interfaces

This is not a completed conversion of every desktop operation to asynchronous
renderer calls. Bootstrap data, legacy Emscripten exporter filesystem callbacks,
game expressions and native synchronous menu/dialog operations retain synchronous
contracts. The editor filesystem handler uses asynchronous Node I/O even when
answering a synchronous renderer request, so large copies do not perform blocking
disk I/O in the main event loop. The requesting renderer still waits.

Filesystem results cross the context bridge as data envelopes. `DesktopService`
reconstructs errors in the renderer, preserving `code`, `path` and `syscall`;
throwing custom Error properties directly through contextBridge loses them.

Removing the remaining synchronous contracts requires changing the Emscripten
export callbacks and synchronous game-expression APIs. These are follow-up work,
not grounds for re-enabling Node integration or exposing generic IPC.

## Remaining optionalRequire inventory

Production renderer call sites are centralized in `Utils/DesktopService.js`:
`electron`, `fs`, `fs-extra`, `path`, `os`, `process`, and lazy `archiver`/`glob`.
They are Node/Jest fallbacks; sandboxed desktop code uses the preload first.

The other source call sites are:

| File | Use |
| --- | --- |
| `GameEngineFinder/LocalGDJSFinder.js` | Node fallback for `fs`, `path`, `process`; Electron uses its dedicated bridge branch. |
| `JsExtensionsLoader/LocalJsExtensionsFinder.js` | `path` and `fs` in the Node-only extension discovery utility. |
| `JsExtensionsLoader/LocalJsExtensionsLoader.js` | Dynamic Node loading of extension modules for scripts/tests. Both LocalApp and BrowserApp use BrowserJsExtensionsLoader. |
| `Utils/OptionalLazyRequire.js` | Generic lazy Node loader helper. |
| `Utils/__mocks__/OptionalRequire.js` and specs | Jest compatibility mocks; the remote mock is not a shipped remote dependency. |

There are no `@electron/remote` imports in the production IDE sources or Electron
package dependencies. Runtime extensions may retain their exported-game native
fallbacks; desktop previews use `gdevelopPreview` instead.

Reproduce the inventory with:

```sh
rg -n 'optionalRequire|optionalLazyRequire|@electron/remote' newIDE/app/src newIDE/electron-app
rg -n 'contextIsolation: false|nodeIntegration: true|webSecurity: false' newIDE/electron-app/app
```

## Dependencies and verification

The remaining critical dependency chains in GDevelop.js, web-app and visual-tests
were updated. The webidl-tools overrides are scoped to that package. Full Flow
binding generation produced the same 271 files before and after the upgrades;
this validates the generator used by GDevelop, not every unused upstream CLI.
Other high/moderate advisories remain and require a separate compatibility review.

Validation on 2026-11-17:

| Check | Result |
| --- | --- |
| GDevelop.js Jest, including build integrity and binding patch tests | 36 suites, 1242 tests and 91 snapshots passed; 2 tests skipped. |
| Editor Jest | 201 suites, 2192 tests and 114 snapshots passed; 1 test skipped. The two suites affected by subsequent type corrections also passed (14 tests). |
| Editor Flow | 0 errors across the full project. |
| GDJS TypeScript and runtime build | Passed. |
| Vite production build and output completeness | Passed; existing large-chunk warnings remain. |
| Electron security tests | Passed, including unauthorized writes, canonical paths, preview protocol isolation and CLI grants. |
| Real Electron integration | Storage retries, preserved preferences/autosave, sandbox filesystem error metadata and Steam BigInt transport passed. |
| Puppeteer upgrade | Headless browser launch and page interaction passed. The full visual suite was not run. |
| npm audit | 0 Critical in all eight lockfile roots: GDevelop.js, GDJS, GDJS/tests, newIDE/app, newIDE/electron-app, newIDE/electron-app/app, newIDE/web-app and newIDE/visual-tests. Other severities remain. |

These checks do not constitute a signed installer/release test on all operating
systems. Native Steam account integration remains a manual validation item.

After the file-grant and preview isolation fixes, the editor suite passed
202 suites (2193 tests passed, one skipped), Flow reported zero errors, and the
full production build passed. The bridge suite checks simultaneous previews with
different roots, read-only picker grants, input validation for shared folders,
and forwarding of range requests. Piskel, Jfxr and Yarn each sent their ready
event in real sandboxed Windows renderers with both development assets and the
fresh production build. This check exercises startup, not interactive editing.

Verification commands:

```sh
cd GDevelop.js && npm test -- --runInBand
cd newIDE/app && npm test -- --runInBand
cd GDJS && npm run check-types
cd newIDE/app && node scripts/import-GDJS-Runtime.js --skip-clean --skip-sources
cd newIDE/app && npx vite build && node scripts/check-build-output.js
cd newIDE/app && npx flow check --max-workers 4
cd newIDE/electron-app && node scripts/test-file-access-policy.js
cd newIDE/electron-app && node scripts/test-preview-steam.js
cd newIDE/electron-app && node scripts/test-security-bridge.js
cd newIDE/electron-app && npm run test:storage-migration
```

The last test uses a disposable profile and actual sandboxed Electron windows,
including a retried storage migration and delayed synchronous filesystem IPC.
Native Steam integration still needs a smoke test with a running Steam client and
an authorized AppID. Automated adapter tests do not replace that test.
