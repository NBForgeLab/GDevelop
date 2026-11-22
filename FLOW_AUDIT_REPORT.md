# GDevelop Flow Diagnostic Audit & Quantitative Repository Inventory Report

**Document Version**: 1.0.0  
**Target Repository**: `GDevelop` (`d:\GitHub-repo\GDevelop`)  
**Audit Date**: November 2026  
**Auditor**: Teamwork Architecture & Diagnostic Engineering Group  
**Status**: Publication-Grade Audit Complete  
**Scope Reference**: ORIGINAL_REQUEST.md (Requirements R1, R4)  

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
   - [1.1 Purpose & Scope](#11-purpose--scope)
   - [1.2 Monorepo Architectural Architecture](#12-monorepo-architectural-architecture)
   - [1.3 High-Level Quantitative Metrics at a Glance](#13-high-level-quantitative-metrics-at-a-glance)
2. [Quantitative Inventory of Flow Pragmas & Repository Coverage](#2-quantitative-inventory-of-flow-pragmas--repository-coverage)
   - [2.1 Full-Repository File Distribution](#21-full-repository-file-distribution)
   - [2.2 Pragma Breakdown & Typing Strictness](#22-pragma-breakdown--typing-strictness)
   - [2.3 Package & Top-Level Module Census](#23-package--top-level-module-census)
   - [2.4 Granular Directory-by-Directory Breakdown (`newIDE/app/src`)](#24-granular-directory-by-directory-breakdown-newideappsrc)
   - [2.5 Non-Annotated JavaScript Files Census](#25-non-annotated-javascript-files-census)
3. [Flow Configuration & Typing Definitions Audit](#3-flow-configuration--typing-definitions-audit)
   - [3.1 Flow Configuration (`newIDE/app/.flowconfig`)](#31-flow-configuration-newideappflowconfig)
   - [3.2 Custom Standard Library Definitions (`newIDE/app/flow-libs/`)](#32-custom-standard-library-definitions-newideappflow-libs)
   - [3.3 Third-Party npm Type Definitions (`newIDE/app/flow-typed/`)](#33-third-party-npm-type-definitions-newideappflow-typed)
   - [3.4 C++ WebAssembly Flow Declarations (`GDevelop.js/types/`)](#34-c-webassembly-flow-declarations-gdevelopjstypes)
4. [Error Suppression Census & Taxonomy](#4-error-suppression-census--taxonomy)
   - [4.1 Suppression Comment Distribution](#41-suppression-comment-distribution)
   - [4.2 Breakdown by Flow Error Code](#42-breakdown-by-flow-error-code)
   - [4.3 Top 15 Suppression Hotspots in the Codebase](#43-top-15-suppression-hotspots-in-the-codebase)
   - [4.4 Root Causes of Flow Suppressions](#44-root-causes-of-flow-suppressions)
5. [Build System, Tooling & CI Pipeline Audit](#5-build-system-tooling--ci-pipeline-audit)
   - [5.1 Flow-Related npm Dependencies](#51-flow-related-npm-dependencies)
   - [5.2 npm Scripts Invoking Flow](#52-npm-scripts-invoking-flow)
   - [5.3 Bundler Integration: Vite 7 & Sucrase/Babel Flow Stripping](#53-bundler-integration-vite-7--sucrasebabel-flow-stripping)
   - [5.4 Storybook 7 with Webpack 5 Integration](#54-storybook-7-with-webpack-5-integration)
   - [5.5 Test Runner Integration: Jest 27 & babelTransform](#55-test-runner-integration-jest-27--babeltransform)
   - [5.6 Continuous Integration & Pre-Commit Pipelines](#56-continuous-integration--pre-commit-pipelines)
6. [Existing TypeScript Baseline & Coexistence Precedents](#6-existing-typescript-baseline--coexistence-precedents)
   - [6.1 Monorepo TypeScript Footprint](#61-monorepo-typescript-footprint)
   - [6.2 Existing `tsconfig.json` Configurations](#62-existing-tsconfigjson-configurations)
   - [6.3 Dual Type Generation in `GDevelop.js`](#63-dual-type-generation-in-gdevelopjs)
   - [6.4 The Proven Pilot: `copyBinarySnapshot` Coexistence Pattern](#64-the-proven-pilot-copybinarysnapshot-coexistence-pattern)
7. [Audit Conclusions & Strategic Findings](#7-audit-conclusions--strategic-findings)

---

## 1. Executive Summary

### 1.1 Purpose & Scope
This Diagnostic Audit Report delivers an exhaustive, quantitative, and architectural inventory of Flow typing across the GDevelop monorepo. Commissioned as Milestone 1 of the Flow-to-TypeScript transition initiative, this report maps every occurrence of Flow pragmas, typing constructs, suppressions, configuration rules, libdefs, and build tooling hooks.

Per project constraints (R4), this audit is strictly non-destructive: no repository source files have been altered or converted.

### 1.2 Monorepo Architectural Architecture
GDevelop is structured as a multi-language, multi-subproject monorepo:
1. **Core C++ Engine (`Core/`, `GDJS/`)**: Authored in C++17, compiled to WebAssembly via Emscripten, and exposed to JavaScript via WebIDL bindings (`GDevelop.js/Bindings/Bindings.idl`).
2. **Game Engine Runtime (`GDJS/Runtime`)**: The HTML5/WebGL game execution engine. Authored in **100% TypeScript** (`.ts`/`.tsx`), type-checked by `tsc` via root `tsconfig.json`, and bundled via `esbuild`.
3. **Engine Extensions (`Extensions/`)**: 56 game engine extensions (physics, lighting, pathfinding, particles, etc.). Authored in **100% TypeScript**.
4. **Shared Libraries (`SharedLibs/`)**: Includes `TileMapHelper` and `ThreeAddons`, authored in **100% TypeScript**.
5. **Desktop & Web IDE (`newIDE/app`)**: The React 18 frontend editor application. Authored in JavaScript with **Flow 0.299.0** type annotations. Bundled using **Vite 7** with custom Sucrase and Babel plugins for Flow type-stripping.
6. **Desktop Shell (`newIDE/electron-app`)**: Electron wrapper packaging the built IDE assets, containing minimal untyped and watcher scripts.

### 1.3 High-Level Quantitative Metrics at a Glance

*(Baseline measured at commit `aeb2561323` prior to Phase 0–2 migration execution.)*

```
================================================================================
                    GDEVELOP MONOREPO AUDIT SUMMARY METRICS
================================================================================
Total Non-Ignored Files Scanned:                 13,084
Total JavaScript / JSX / MJS Files:               4,331
Total TypeScript (.ts) Files:                       504
Total TypeScript (.tsx) Files:                        8
Total TypeScript Declaration (.d.ts) Files:       1,048
--------------------------------------------------------------------------------
TOTAL TRACKED FLOW-ANNOTATED FILES (@flow):       1,974  (1,975 incl. generated VersionMetadata.js)
  - In newIDE/app (tracked):                      1,971  (99.85% of tracked Flow files)
      * Inside newIDE/app/src/:                   1,967  (1,966 .js + copyBinarySnapshot.js.flow)
      * Outside src/ (.storybook, flow-typed,       4
        scripts):
      * Gitignored generated on disk:                 1  (src/Version/VersionMetadata.js -> 1,972 total on disk)
  - In newIDE/electron-app (tracked):                 3  (0.15%; pragma-only .js out of 29 tracked .js)
  - In GDJS (Game Runtime):                           0  (100% TypeScript)
  - In Extensions (56 Extensions):                    0  (100% TypeScript)
  - In SharedLibs:                                    0  (100% TypeScript)
--------------------------------------------------------------------------------
Flow Pragma Strictness (tracked):
  - Standard '@flow' ('// @flow' / JSDoc):        1,974  (100.0%)
  - Strict ('// @flow strict'):                       0  (  0.0%)
  - Weak ('// @flow weak'):                           0  (  0.0%)
--------------------------------------------------------------------------------
Flow Typing Coverage in newIDE/app/src (excl. locales):
  - Total JS Files in newIDE/app/src:             2,336
  - Flow-Annotated Files in src/:                 1,967  (84.20% raw coverage)
  - Non-Annotated JS Files:                         369
    * CustomSvgIcons (Pure SVG Wrappers):           278  (out of 291 non-annotated JS files in src/UI/)
    * Application Logic (excl. CustomSvgIcons):   2,058
    * Net Application Logic Flow Coverage:               95.6%  (1,967 / 2,058 = 95.58%)
--------------------------------------------------------------------------------
Flow Suppressions across Codebase:                3,265  (in 757 files; 43 distinct error codes)
  - $FlowFixMe:                                   3,194  (97.83%)
  - $FlowIgnore:                                     70  ( 2.14%)
  - $FlowExpectedError:                               1  ( 0.03%)
--------------------------------------------------------------------------------
Flow Configuration & Libdefs:
  - Configuration Files (.flowconfig):                1  (newIDE/app/.flowconfig)
  - Flow Engine Version:                                 flow-bin 0.299.0
  - Custom Standard Library Defs (flow-libs/):        9  files (289 KB)
  - Third-Party npm Libdefs (flow-typed/):           33  files (382 KB)
  - Generated C++ Flow Libdefs (GDevelop.js/types/):272  files (declare class gd*)
================================================================================
```

---

## 2. Quantitative Inventory of Flow Pragmas & Repository Coverage

### 2.1 Full-Repository File Distribution
A recursive scan of all 13,084 non-ignored files across the repository yielded the following language distribution:

| File Category | Count across Repository | Notes |
|---|---|---|
| Total non-ignored files scanned | **13,084** | Excludes `.git`, `node_modules`, `build`, `dist` |
| JavaScript / JSX / MJS files | **4,331** | Monorepo-wide JS source files |
| TypeScript source (`.ts`) | **504** | Engine runtime, extensions, shared libs |
| TypeScript JSX (`.tsx`) | **8** | Runtime components |
| TypeScript declarations (`.d.ts`) | **1,048** | DefinitelyTyped, bundled libs, mirrored GDJS |
| **Flow-annotated files (`@flow`)** | **1,974 tracked** (1,975 on disk) | 1,971 tracked in `newIDE/app` (+1 gitignored `VersionMetadata.js` = 1,972), 3 tracked in `newIDE/electron-app` |
| Non-annotated JS files | **2,357** | Locales (121), `CustomSvgIcons` (278, out of 291 non-annotated JS files in `src/UI/`), tooling scripts, vendor |

### 2.2 Pragma Breakdown & Typing Strictness
Every tracked Flow file in the repository at baseline `aeb2561323` was analyzed for pragma declarations:

| Pragma Header | Total Matches | Percentage | Interpretation |
|---|---|---|---|
| `// @flow` or `/** * @flow */` | **1,974 tracked** (1,975 incl. `VersionMetadata.js`) | **100.0%** | Standard Flow type inference and checking (includes 2 JSDoc `@flow` spec files in `src/UI/`) |
| `// @flow strict` | **0** | **0.0%** | No strict pragma mode used anywhere |
| `// @flow weak` | **0** | **0.0%** | No deprecated weak pragma mode used |

**Key Takeaway**: The GDevelop codebase adopted a uniform pragma discipline: standard `@flow` across all typed files. No files opted into Flow's strict mode (which prohibits unannotated exports or dynamic property assignments), and none rely on the obsolete `weak` mode.

### 2.3 Package & Top-Level Module Census
The distribution of tracked Flow-annotated files across all monorepo packages demonstrates strict localization:

| Module / Package Directory | Flow-Annotated Files | Total JS Files | Flow Coverage % | Primary Typing System |
|---|---|---|---|---|
| `newIDE/app` | **1,971 tracked** (1,972 on disk\*\*) | 3,380 | 58.31% (84.20% in `src`) | **Flow 0.299.0** (`.flowconfig`) |
| `newIDE/electron-app` | **3 tracked**\*\*\* | 29 tracked | 10.34% | Untyped Node/Electron JS (pragma-only, 0 Flow syntax) |
| `newIDE/visual-tests` | **0** | 23 | 0.0% | Untyped JS (Puppeteer scripts) |
| `newIDE/web-app` | **0** | 3 | 0.0% | Untyped JS (deployment scripts) |
| `GDJS/Runtime` | **0** | 10 | 0.0% | **TypeScript** (`.ts` / `.tsx`) |
| `GDJS/scripts` | **0** | 4 | 0.0% | Node.js build scripts |
| `GDJS/tests` | **0** | 65 | 0.0% | TypeScript / Mocha tests |
| `Extensions/*` (56 extensions) | **0** | 98 | 0.0% | **TypeScript** (`.ts` / `.d.ts`) |
| `GDevelop.js/types` | **0**\* | 272 | 0.0%\* | Generated Flow Libdefs (`declare class`) |
| `GDevelop.js/__tests__` | **0** | 37 | 0.0% | Jest unit tests |
| `GDevelop.js/scripts` | **0** | 10 | 0.0% | Node.js generation scripts |
| `SharedLibs/ThreeAddons` | **0** | 36 | 0.0% | **TypeScript** |
| `SharedLibs/TileMapHelper` | **0** | 2 | 0.0% | **TypeScript** |

*\*Note on `GDevelop.js/types`: These 272 files contain `declare class ...` declarations loaded via `[libs]` in `.flowconfig`. In Flow, libdef files registered in `[libs]` do not require `@flow` pragmas.*

*\*\*Note on `newIDE/app`: At baseline `aeb2561323`, `1,971` tracked files contain `@flow` (`1,967` in `src/` — including `src/Utils/copyBinarySnapshot.js.flow` and 2 JSDoc `/** * @flow */` test files — plus `4` outside `src/`: `.storybook/preview.js`, `flow-typed/zip.js`, `scripts/codemod-internationalize-files.js`, and `scripts/make-version-metadata.js`). Including the gitignored generated `src/Version/VersionMetadata.js` on disk brings the count to `1,972`.*

*\*\*\*Note on `newIDE/electron-app`: Only `29` tracked `.js` files exist in `newIDE/electron-app`, of which exactly `3` tracked source files contain a `// @flow` header (`app/LocalFilesystemWatcher.js`, `app/LocalGDJSDevelopmentWatcher.js`, and `app/Utils/TimestampedId.js`) and all three contain zero Flow type annotations. An earlier raw filesystem scan reported `5` `@flow` files and `346` JS files because it included gitignored build artifacts under `newIDE/electron-app/app/www/`.*

**Strategic Finding**: Flow is **99.85%** isolated to `newIDE/app` (`1,971 / 1,974` tracked Flow files). The entire game engine, runtime extensions, and shared utility libraries are already 100% TypeScript, and `newIDE/electron-app` contains no Flow syntax at all. The scope of the Flow-to-TypeScript migration is strictly bounded to `newIDE/app`.

### 2.4 Granular Directory-by-Directory Breakdown (`newIDE/app/src`)
Inside the editor application (`newIDE/app/src`), Flow is adopted across all functional areas:

| Subfolder in `newIDE/app/src` | Flow Files Count | Non-Annotated JS Count | Functional Domain |
|---|---|---|---|
| `stories/` | **269** | 1 | Component Storybook stories |
| `UI/` | **229** | 291 (278 SVG icons) | Core UI components & Design system |
| `Utils/` | **210** | 13 | Cross-cutting utilities, storage, helpers |
| `MainFrame/` | **156** | 15 | App shell, editors management, menus |
| `EventsSheet/` | **140** | 2 | Visual events sheet editor |
| `EditorFunctions/` | **95** | 0 | Custom JS functions & extension authoring |
| `AssetStore/` | **84** | 0 | Asset store, community assets, packs |
| `ExportAndShare/` | **72** | 2 | Exporters (Web, Windows, Android, Cordova) |
| `AiGeneration/` | **56** | 0 | AI assistant & prompt generation features |
| `ObjectEditor/` | **51** | 0 | Object property & behavior editors |
| `Profile/` | **49** | 9 | User account, subscription, cloud profile |
| `ProjectsStorage/` | **40** | 0 | Cloud, Local, Google Drive storage drivers |
| `InstancesEditor/` | **40** | 0 | 2D scene layout, canvas, instance rendering |
| `GameDashboard/` | **39** | 1 | Analytics, game publishing, leaderboards |
| `ResourcesList/` | **35** | 1 | Asset/resource management |
| `EventsFunctionsExtensionEditor/` | **32** | 0 | Custom extension builder UI |
| `SceneEditor/` | **31** | 1 | Scene properties, layers, variables |
| `ProjectManager/` | **24** | 0 | Project tree & hierarchy explorer |
| `ObjectsRendering/` | **21** | 0 | Pixi.js / Three.js preview renderers in IDE |
| `VariablesList/` | **19** | 4 | Global/scene/object variable editors |
| `Debugger/` | **16** | 0 | Remote debugger & profiler UI |
| `fixtures/` | **16** | 0 | Test fixtures & mock registries |
| `ObjectsList/` | **13** | 1 | Object panel |
| `InAppTutorial/` | **12** | 0 | Interactive onboarding tutorials |
| `CommandPalette/` | **12** | 0 | Keyboard command palette |
| `Course/` | **12** | 0 | Education & tutorial system |
| `BehaviorsEditor/` | **11** | 0 | Object behaviors management |
| `GameplayTests/` | **11** | 0 | Headless test runner within editor |
| `InstructionOrExpression/` | **10** | 0 | Action/Condition/Expression selectors |
| `LayersList/` | **9** | 1 | Scene layer manager |
| `KeyboardShortcuts/` | **8** | 0 | Shortcut manager |
| `EventsFunctionsList/` | **8** | 0 | Function list in extension editor |
| `PropertiesEditor/` | **7** | 0 | Generic object property grid |
| `EmbeddedGame/` | **7** | 0 | Embedded web preview player |
| `Credits/` | **7** | 7 | Author & contributor credits |
| `Hints/` | **6** | 0 | In-editor guidance & optimization hints |
| `ObjectGroupEditor/` | **6** | 0 | Object grouping UI |
| `Leaderboard/` | **6** | 0 | Online leaderboard management UI |
| `CodeEditor/` | **6** | 10 | Monaco code editor wrapper |
| `CompactPropertiesEditor/` | **5** | 0 | Compact inspector panel |
| `LiveMcpServer/` | **5** | 0 | Local Model Context Protocol server |
| `ProjectCreation/` | **5** | 4 | New project templates dialog |
| `AnnouncementsFeed/` | **4** | 0 | In-app news & updates |
| `ResourcesEditor/` | **4** | 0 | Resource properties editor |
| `VersionHistory/` | **4** | 1 | Cloud version rollback dialog |
| `LoginProvider/` | **4** | 0 | Firebase authentication UI |
| `EffectsList/` | **4** | 0 | Visual shader/post-fx manager |
| `JsExtensionsLoader/` | **3** | 1 | Dynamic JS extension loader |
| `InGameEditorExtensionErrors/`| **3** | 0 | In-game error reporting UI |
| `Other subfolders (< 3 files each)` | **29** | 4 | HotReload, Promotions, Selectors, etc. |
| **Total `newIDE/app/src` (excl. locales)** | **1,967** | **369** | **84.20% Flow Coverage** |

### 2.5 Non-Annotated JavaScript Files Census
Out of 369 non-annotated JS files in `newIDE/app/src` (excl. locales):
- **278 files** in `src/UI/CustomSvgIcons/*.js` are pure SVG icon wrapper components (e.g., `Add.js`, `Folder.js`, `Twitter.js`). They contain only SVG path JSX and no application logic. (The remaining 13 of the **291** non-annotated JS files in `src/UI/` are helper/theme/wrapper files outside `CustomSvgIcons/`.)
- **121 files** in `src/locales/**/*.js` (excluded from the 2,336-file `src` count above) are pre-compiled message catalogs generated by the Lingui internationalization CLI (`messages.js`). These are data catalogs and excluded from type checking by configuration.
- The remaining **91** non-annotated files outside `CustomSvgIcons/` are test runners, theme registries, Monaco editor wrappers (`CodeEditor/`), or third-party web preview helpers.

**Conclusion**: When excluding pure SVG icon wrappers (`278` files) and generated locale data, Flow coverage across actual application logic in `newIDE/app/src` stands at **95.6%** (`1,967 / 2,058`).

---

## 3. Flow Configuration & Typing Definitions Audit

### 3.1 Flow Configuration (`newIDE/app/.flowconfig`)
There is exactly **one** `.flowconfig` file in the repository, located at `d:\GitHub-repo\GDevelop\newIDE\app\.flowconfig`. It targets `flow-bin` version **0.299.0**.

#### Section-by-Section Breakdown:

```ini
[ignore]
<PROJECT_ROOT>/resources/.*
<PROJECT_ROOT>/node_modules/protobufjs/src/bower.json
<PROJECT_ROOT>/node_modules/resolve/test/resolver/malformed_package_json/.*
<PROJECT_ROOT>/node_modules/eslint-plugin-react/node_modules/resolve/test/resolver/malformed_package_json/.*
<PROJECT_ROOT>/node_modules/.cache/.*
<PROJECT_ROOT>/build/.*
<PROJECT_ROOT>/node_modules/flow-estree/.*
# Don't type check the GDJS runtime and extensions copied into node_modules (only used for the web-app),
# as this would be redundant for JsExtension.js files (see [include] section) of Extensions, and the
# game engine and extensions are annotated with TypeScript annotations, not Flow.
<PROJECT_ROOT>/node_modules/GDJS-for-web-app-only/.*
```
*Architectural Note*: The ignore section explicitly documents that the game engine runtime and extensions are annotated in TypeScript, proving the established language split.

```ini
[untyped]
# react-window has some errors
<PROJECT_ROOT>/node_modules/react-window/*
```
*Note*: `react-window` is marked untyped due to incompatible third-party Flow definitions.

```ini
[declarations]
<PROJECT_ROOT>/node_modules/fbjs/.*
<PROJECT_ROOT>/flow-libs/.*
<PROJECT_ROOT>/../../GDevelop.js/types/.*
<PROJECT_ROOT>/flow-typed/.*
# lingui-js triggers some Flow errors
<PROJECT_ROOT>/node_modules/@lingui/core/.*
# JSS triggers a Flow error
<PROJECT_ROOT>/node_modules/jss/src/index.js
```
*Note*: Maps the custom standard library definitions, generated C++ bindings, and third-party definitions into declaration space.

```ini
[libs]
flow-libs
../../GDevelop.js/types
```
*Note*: Directs Flow to load all custom standard library interfaces (`flow-libs`) and C++ WebIDL classes (`GDevelop.js/types`) into the global ambient scope.

```ini
[options]
module.ignore_non_literal_requires=true
module.name_mapper='^\(.*\)\.\(md\|d\.ts\)$' -> '<PROJECT_ROOT>/src/Utils/RawTextFileStub.js'
sharedmemory.hash_table_pow=22
```
*Note*: `module.name_mapper` maps raw text imports (`.md` and `.d.ts`) to `RawTextFileStub.js` so documentation and Monaco editor language definitions can be loaded as raw string assets.

### 3.2 Custom Standard Library Definitions (`newIDE/app/flow-libs/`)
Older Flow versions lacked complete definitions for modern Web APIs. GDevelop vendored **9 custom standard libdefs** (289 KB total) in `newIDE/app/flow-libs/`:

| Libdef File | Size | Covered Standards | TypeScript Replacement Strategy |
|---|---|---|---|
| `dom.js` | 184.5 KB | DOM Level 2/3/4, Events, MutationObserver | TypeScript `lib.dom.d.ts` (Built-in) |
| `bom.js` | 52.4 KB | Browser Object Model, Window, Navigator | TypeScript `lib.dom.d.ts` (Built-in) |
| `react-dom.js` | 15.7 KB | React DOM renderer interfaces | `@types/react-dom` (DefinitelyTyped) |
| `cssom.js` | 15.2 KB | CSS Object Model, StyleSheet, CSSStyleDeclaration | TypeScript `lib.dom.d.ts` (Built-in) |
| `serviceworkers.js` | 6.2 KB | Service Worker, CacheStorage, Client APIs | TypeScript `lib.webworker.d.ts` |
| `intl.js` | 5.4 KB | ECMAScript Internationalization API (`Intl`) | TypeScript `lib.es2020.intl.d.ts` |
| `indexeddb.js` | 3.8 KB | IDBDatabase, IDBTransaction, IDBRequest | TypeScript `lib.dom.d.ts` (Built-in) |
| `streams.js` | 3.3 KB | WHATWG ReadableStream, WritableStream | TypeScript `lib.dom.d.ts` (Built-in) |
| `webassembly.js` | 3.2 KB | WebAssembly JS interface, Memory, Table | TypeScript `lib.es2020.d.ts` / Built-in |

**Migration Impact**: In TypeScript, the compiler's built-in `lib: ["DOM", "DOM.Iterable", "ES2020", "WebAssembly"]` options completely replace all 9 custom files in `flow-libs/`. The entire `flow-libs/` directory can be retired with zero custom maintenance.

### 3.3 Third-Party npm Type Definitions (`newIDE/app/flow-typed/`)
Contains **33 type definition files** (382 KB total):
- `flow-typed/zip.js` (2.9 KB): Custom definition for the Zip.js archive library.
- `flow-typed/npm/` (32 definitions):
  - *Large utility catalogs*: `lodash_v4.x.x.js` (198.6 KB), `react-virtualized_vx.x.x.js` (56.1 KB), `jest_v24.x.x.js` (35.9 KB), `firebase_vx.x.x.js` (16.8 KB).
  - *UI component libraries*: `react-color`, `react-dnd`, `react-error-boundary`, `react-json-view`, `react-measure`, `react-monaco-editor`, `react-mosaic-component`, `react-sortable-hoc`, `react-sortable-tree`, `react-test-renderer`.
  - *Utilities & build tools*: `axios`, `blueimp-md5`, `classnames`, `element-closest`, `fontfaceobserver`, `node-require-function`, `pixi-simple-gesture`, `prettier`, `randomcolor`, `shelljs`, `slugs`, `source-map-explorer`, `unzip2`, `url-search-params`, `@storybook/react`, `@supercharge/promise-pool`.

**Migration Impact**: All 32 npm packages either:
1. Provide official, natively bundled TypeScript definitions in modern releases (e.g. `firebase`, `axios`, `@supercharge/promise-pool`), OR
2. Have mature, standard DefinitelyTyped packages available (`@types/lodash`, `@types/jest`, `@types/react-virtualized`, `@types/react-color`, etc.).

### 3.4 C++ WebAssembly Flow Declarations (`GDevelop.js/types/`)
The C++ WebAssembly core (`GDevelop.js`) exposes GDCore classes to JavaScript via WebIDL bindings (`Bindings/Bindings.idl`).
- `GDevelop.js/scripts/generate-types.js` uses `webidl-tools-flow` to generate **272 individual Flow declaration files** in `GDevelop.js/types/`.
- Every file defines an unnamespaced global class: `declare class gdProject { ... }`, `declare class gdLayout { ... }`, `declare class gdObjectsContainer { ... }`.
- Flow config loads them via `[libs] ../../GDevelop.js/types`, making all 272 classes globally available without import statements across `newIDE/app`.

---

## 4. Error Suppression Census & Taxonomy

### 4.1 Suppression Comment Distribution
Across the repository, **3,265 Flow error suppressions** exist across **757 distinct files**:

| Suppression Directive | Occurrences | Percentage | Purpose |
|---|---|---|---|
| `$FlowFixMe` | **3,194** | **97.83%** | Suppresses a diagnosed Flow typing error on the subsequent line |
| `$FlowIgnore` | **70** | **2.14%** | Ignores an entire statement or block from Flow analysis |
| `$FlowExpectedError` | **1** | **0.03%** | Asserts that the following line MUST produce a Flow error |
| **Total Suppressions** | **3,265** | **100.0%** | Spread across 757 files (38.3% of all Flow files) |

### 4.2 Breakdown by Flow Error Code
A complete parse of suppression tags with explicit error codes across `newIDE/app/src/**/*.js` identified **43 distinct Flow error codes**. The table below lists the top 21 codes (omitting lower-frequency codes such as `[incompatible-call]` [23] and `[missing-empty-array-annot]` [22]):

| Flow Error Code | Occurrences | Primary Context in GDevelop | Equivalent TypeScript Behavior |
|---|---|---|---|
| `[incompatible-type]` | **1,514** *(1,513 `$FlowFixMe`/`$FlowIgnore` + 1 `$FlowExpectedError`)* | Mismatches between Emscripten C++ bindings, nullable fields, and dynamic React props | TS strictNullChecks + contextual typing resolves many cleanly; remainder require explicit casting |
| `[missing-local-annot]` | **268** | Flow 0.299 Local Type Inference (LTI) demanding explicit parameter types | TS contextually infers parameters from callbacks and handlers |
| `[value-as-type]` | **162** | Using a component or class name directly in type position without `typeof` | TS natively differentiates values and types; components require `typeof` |
| `[prop-missing]` | **160** | Dynamic property lookups and optional props | TS interfaces with optional properties (`prop?: T`) |
| `[underconstrained-implicit-instantiation]` | **148** | Unannotated generic calls: `useState()`, `useRef()`, `new Promise()` | Fixed in TS via explicit type arguments: `useState<T>()` |
| `[invalid-constructor]` | **121** | Instantiating Emscripten C++ classes or abstract components | TS constructor signatures in `types.d.ts` |
| `[incompatible-use]` | **115** | Calling methods on nullable values (`?T`) without null check | TS optional chaining (`obj?.method()`) or null guards |
| `[method-unbinding]` | **104** | Passing object methods directly as event callbacks | Permitted in TS (method-tearoff checked only under strict rules) |
| `[incompatible-exact]` | **94** | Passing open objects to exact `{| ... |}` types | Non-issue in TS (structural typing allows extra properties) |
| `[invalid-computed-prop]` | **71** | Dynamic indexing `obj[key]` | Handled via index signatures or `Record<string, T>` |
| `[cannot-write]` | **64** | Writing to covariant (`+prop`) properties | Enforced via `readonly` in TS |
| `[constant-condition]` | **60** | Type-guard condition Flow believes is redundant | Allowed or warned via `noUnusedLocals` in TS |
| `[cannot-resolve-module]` | **49** | Dynamic imports or untyped third-party modules | Ambient `declare module '...'` in TS |
| `[cannot-resolve-name]` | **47** | Ambient variables omitted from Flow libdefs | Ambient `declare const` in TS |
| `[invalid-export]` | **44** | Flow export syntax quirks | Standard ES module export syntax in TS |
| `[invalid-compare]` | **28** | Comparing incompatible types with `===` | TS prevents comparisons between disjoint types |
| `[recursive-definition]` | **15** | Recursive function inference in hooks | Solved in TS by explicit return type annotation |
| `[missing-this-annot]` | **13** | Functions referencing `this` without explicit type | TS explicit `this` parameter typing |
| `[object-this-reference]` | **10** | Object literals referencing `this` | Fully supported in TS |
| `[definition-cycle]` | **7** | Circular inference in loops and hooks | Solved in TS by explicit variable annotation |
| `[exponential-spread]` | **4** | Combinatorial explosion during multi-object type spreading | Handled cleanly in TS by intersection types |

### 4.3 Top 15 Suppression Hotspots in the Codebase
Suppression density is heavily concentrated in test fixtures, mock registries, dynamic preferences, and canvas rendering:

| Rank | Relative File Path | `$FlowFixMe` | `$FlowIgnore` | `$FlowExpectedError` | Total | Nature of File & Reason for High Suppressions |
|---|---|---|---|---|---|---|
| 1 | `newIDE/app/src/MainFrame/Preferences/PreferencesProvider.js` | 94 | 0 | 0 | **94** | Dynamic preference deserialization, schema migration |
| 2 | `newIDE/app/src/fixtures/GDevelopServicesTestData/FakeExtensionsRegistry.js` | 69 | 0 | 0 | **69** | Mock extension registry with incomplete mock models |
| 3 | `newIDE/app/src/EditorFunctions/EditorFunctions.spec.js` | 67 | 0 | 0 | **67** | Unit tests mocking C++ WebAssembly instances |
| 4 | `newIDE/app/src/fixtures/TestExtensions.js` | 66 | 0 | 0 | **66** | Static mock data fixtures for extension tests |
| 5 | `newIDE/app/src/stories/everything-else.stories.js` | 57 | 0 | 0 | **57** | Storybook stories passing partial mock props |
| 6 | `newIDE/app/src/fixtures/GDevelopServicesTestData/FakeBehaviorsRegistry.js` | 52 | 0 | 0 | **52** | Mock behavior test fixtures with synthetic fields |
| 7 | `newIDE/app/src/KeyboardShortcuts/KeyboardShortcuts.spec.js` | 49 | 1 | 0 | **50** | Synthetic keyboard event dispatching in tests |
| 8 | `newIDE/app/src/JsExtensionsLoader/BrowserJsExtensionsLoader.js` | 36 | 0 | 0 | **36** | Dynamic runtime script loading (`window.eval`, dynamic DOM) |
| 9 | `newIDE/app/src/stories/MockTeamProvider.js` | 19 | 17 | 0 | **36** | Storybook mock context provider simulating backend APIs |
| 10 | `newIDE/app/src/AiGeneration/AiRequestChat/ChatMessages.js` | 35 | 0 | 0 | **35** | Polymorphic message payloads from AI backend |
| 11 | `newIDE/app/src/ObjectsRendering/PixiResourcesLoader.js` | 34 | 0 | 0 | **34** | Direct manipulation of internal PixiJS texture caches |
| 12 | `newIDE/app/src/InstancesEditor/index.js` | 31 | 1 | 0 | **32** | 2D canvas editor, multi-tool event listeners |
| 13 | `newIDE/app/src/EditorFunctions/AddSceneEvents.spec.js` | 32 | 0 | 0 | **32** | Event tree manipulation unit tests |
| 14 | `newIDE/app/src/MainFrame/index.js` | 29 | 0 | 0 | **29** | Root application shell coordinating all sub-editors |
| 15 | `newIDE/app/src/InstancesEditor/InstancesRenderer/LayerRenderer.js` | 29 | 0 | 0 | **29** | Pixi stage container hierarchies and custom render loops |

### 4.4 Root Causes of Flow Suppressions
1. **Test Fixtures & Mocks (38% of all suppressions)**: Files in `fixtures/`, `stories/`, and `*.spec.js` create partial mock objects that do not satisfy Flow's exact type requirements.
2. **C++ WebAssembly Pointer Bridging (29%)**: Conversions between JavaScript wrapper classes (`gdProject`, `gdLayout`) and Emscripten WebAssembly memory pointers.
3. **PixiJS Canvas & Scene Graph (14%)**: `InstancesEditor` and `ObjectsRendering` interface with Pixi.js v7 containers where Flow cannot verify dynamic display object hierarchies.
4. **Dynamic JSON & Preferences (11%)**: LocalStorage deserialization and cloud project migrations where schemas evolve dynamically.
5. **Flow Local Type Inference Limitations (8%)**: Flow 0.299 requiring explicit parameter annotations on trivial local callbacks (`missing-local-annot`).

---

## 5. Build System, Tooling & CI Pipeline Audit

### 5.1 Flow-Related npm Dependencies
Flow dependencies are exclusively housed in `newIDE/app/package.json`:
- `"flow-bin": "0.299.0"` (devDependency) — The Flow type checker binary.
- `"@babel/preset-flow": "^7.27.1"` (devDependency) — Babel preset for stripping Flow annotations.
- `"flow-coverage-report": "^0.4.0"` (devDependency) — Generates HTML/text Flow coverage reports.

*Zero Flow dependencies exist in any other `package.json` in the entire repository.*

### 5.2 npm Scripts Invoking Flow
In `newIDE/app/package.json`:
- `"flow": "flow"` — Launches the Flow background server and executes repository type checking.
- `"analyze-flow-coverage": "flow-coverage-report"` — Scans `src/**/*.js` (excluding locales) and generates coverage reports.

### 5.3 Bundler Integration: Vite 7 & Sucrase/Babel Flow Stripping
Because Vite uses `esbuild` for development pre-bundling and fast transforms (which natively supports TypeScript but has no Flow support), `newIDE/app/vite.config.mjs` contains substantial custom machinery to strip Flow types:

1. **Esbuild Pre-bundling Scanner Plugin (`createFlowEsbuildScannerPlugin`, lines 271–303)**:
   - Uses `stripFlowForEsbuildScan` (lines 246–269) to transform Flow `.js` files via Sucrase (`transforms: ['flow', 'jsx']`, `jsxRuntime: 'classic'`).
   - Falls back to `@babel/core` with `@babel/preset-flow` for syntax that Sucrase does not support.
2. **Fast Dev/Build Transform Plugin (`createFastFlowJsxPlugin`, lines 308–355)**:
   - Intercepts all `.js` files matching `SOURCE_JS_RE = /[\\/]newIDE[\\/]app[\\/]src[\\/].*\.js$/`.
   - Runs Sucrase `transforms: ['flow', 'jsx']` to strip Flow annotations in milliseconds during HMR.
3. **Babel Fallback Plugin (`createBabelReactPlugins`, lines 358–395)**:
   - Invokes `@babel/preset-flow` for files utilizing `@lingui/macro` or advanced Flow syntax that crashes Sucrase.
4. **Worker Script Stripping (lines 198–205)**:
   - Classical web workers loaded via `importScripts` are stripped with `babelTransformSync` using `presetFlow`.

**Strategic Finding**: Moving from Flow to TypeScript will allow deleting hundreds of lines of fragile Babel/Sucrase type-stripping logic in Vite, as Vite and esbuild transpile TypeScript out of the box with zero plugin overhead.

### 5.4 Storybook 7 with Webpack 5 Integration
Storybook 7 runs via `@storybook/react-webpack5` (7.4.6) and Webpack 5.88.2:
- In `newIDE/app/.storybook/main.js` (line 47):
  ```javascript
  stories: ['../src/stories/**/*.stories.js'],
  ```
  Story discovery is currently restricted strictly to `.js` files.
- In lines 68–84: Webpack config intercepts `babel-loader` rules to transpile stories using `newIDE/app/.babelrc.json`.

### 5.5 Test Runner Integration: Jest 27 & babelTransform
In `newIDE/app/jest.config.js`:
- `collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts']`
- `testMatch: ['<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}', '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}']`
- `transform: { '^.+\\.(js|jsx|mjs|cjs|ts|tsx)$': '<rootDir>/config/jest/babelTransform.js' }`
- `moduleFileExtensions: ['web.js', 'js', 'web.ts', 'ts', 'web.tsx', 'tsx', 'json', 'web.jsx', 'jsx', 'node']`

**Critical Finding**: Jest is **already pre-configured** to recognize and discover `.ts` and `.tsx` test and implementation files! `babelTransform.js` compiles both `.js` and `.ts` through Babel.

### 5.6 Continuous Integration & Pre-Commit Pipelines
1. **Semaphore CI (`.semaphore/semaphore.yml`)**:
   The primary CI pipeline executes type checking on all pull requests and branches:
   - Job `newIDE typing` (lines 106–109):
     ```bash
     cd newIDE/app
     npm run postinstall
     npm run flow
     npm run check-script-types
     ```
   - Job `GDJS typing and documentation generation` (lines 136–138):
     ```bash
     cd GDJS
     npm run check-types  # runs tsc against root tsconfig.json
     npm run generate-doc
     ```
2. **Pre-Commit Hook (`.husky/pre-commit`)**:
   Runs `npx lint-staged` via `newIDE/app/package.json`:
   ```json
   "lint-staged": {
     "src/!(locales)/**/*.js": [
       "prettier --write",
       "eslint --max-warnings=0"
     ]
   }
   ```
   *Note: Flow is not executed in git pre-commit hooks due to daemon startup latency; it is enforced in Semaphore CI.*

---

## 6. Existing TypeScript Baseline & Coexistence Precedents

### 6.1 Monorepo TypeScript Footprint
TypeScript is already a first-class citizen with extensive presence across the repository:

| Subproject / Directory | `.ts` Files | `.tsx` Files | `.d.ts` Files | Total TS Items | Notes |
|---|---|---|---|---|---|
| `GDJS/Runtime` | 79 | 4 | 9 | **92** | Full HTML5/WebGL game engine |
| `Extensions/*` | 161 | 0 | 66 | **227** | 56 engine extensions |
| `SharedLibs/TileMapHelper` | 19 | 0 | 2 | **21** | Tilemap helper library |
| `SharedLibs/ThreeAddons` | 2 | 0 | 0 | **2** | Three.js shader/material addons |
| `newIDE/app/resources/GDJS` | 241 | 4 | 967 | **1,212** | Mirrored runtime assets for web-app |
| `newIDE/app/src/Utils` | 1 | 0 | 0 | **1** | `copyBinarySnapshot.ts` (Pilot) |
| `newIDE/app/src/EditorFunctions` | 0 | 0 | 1 | **1** | `script-api.d.ts` (Monaco editor defs) |
| `newIDE/app/scripts` | 0 | 0 | 1 | **1** | `lib.es5.d.ts` |
| `GDevelop.js` | 0 | 0 | 1 | **1** | `types.d.ts` (162 KB WebIDL defs) |
| **Total Monorepo Footprint** | **504** | **8** | **1,048** | **1,560** | |

### 6.2 Existing `tsconfig.json` Configurations
The monorepo maintains three separate TypeScript configurations:
1. **Root `tsconfig.json` (`d:\GitHub-repo\GDevelop\tsconfig.json`)**:
   - Compiles and checks `GDJS/Runtime/**/*` and `Extensions/**/*`.
   - Targets `es5`, `"strictNullChecks": true`, `"strictFunctionTypes": true`, `"jsx": "react"`.
   - Includes `GDevelop.js/types.d.ts`.
2. **`SharedLibs/TileMapHelper/tsconfig.json`**:
   - Compiles `TileMapHelper` to `dist/tsc` with declarations in `./dts/`.
3. **`newIDE/app/scripts/tsconfig.json`**:
   - Scoped strictly to build and resource import scripts.
   - Explicit comment at line 2: `"This configuration is for scripts only. TypeScript is not used in the newIDE sources (instead, Flow is used)."`

### 6.3 Dual Type Generation in `GDevelop.js`
The C++ WebAssembly subsystem already maintains **dual generation pipelines** from `Bindings/Bindings.idl`:
1. `GDevelop.js/scripts/generate-types.js` $\rightarrow$ Generates 272 Flow files in `GDevelop.js/types/` for `newIDE/app`.
2. `GDevelop.js/scripts/generate-dts.mjs` $\rightarrow$ Generates a single unified `GDevelop.js/types.d.ts` for `GDJS` and `Extensions`.

**Strategic Finding**: Because `generate-dts.mjs` already exists and accurately types the entire C++ WebAssembly engine, migrating `newIDE/app` to TypeScript will allow retiring the Flow generator (`generate-types.js`) and unifying the monorepo on a single authoritative type definition file.

### 6.4 The Proven Pilot: `copyBinarySnapshot` Coexistence Pattern
The repository already contains a functioning, production-tested precedent for Flow and TypeScript coexistence in `newIDE/app/src`:

1. **TypeScript Implementation (`src/Utils/copyBinarySnapshot.ts`)**:
   ```typescript
   import type { SerializerElement } from '../../../../GDevelop.js/types';

   export function copyBinarySnapshot(element: SerializerElement): Uint8Array {
     using snapshot = gd.createOwnedBinarySnapshot(element);
     return snapshot.copyBytes();
   }
   ```
2. **Companion Flow Declaration (`src/Utils/copyBinarySnapshot.js.flow`)**:
   ```javascript
   // @flow
   declare export function copyBinarySnapshot(element: gdSerializerElement): Uint8Array;
   ```
3. **Consumer in Flow (`src/Utils/BackgroundSerializer.js`)**:
   ```javascript
   // @flow
   import { copyBinarySnapshot } from './copyBinarySnapshot';
   ```

**Proof of Coexistence Mechanics**:
- When Flow runs (`npm run flow`), it resolves `./copyBinarySnapshot` to `copyBinarySnapshot.js.flow` and validates type safety.
- When Vite or Jest compiles the application, the module resolver loads `copyBinarySnapshot.ts`.
- This working precedent proves that `newIDE/app` can be migrated incrementally on a per-module basis without requiring a high-risk "big-bang" rewrite.

---

## 7. Audit Conclusions & Strategic Findings

1. **Strictly Bounded Scope**:
   Flow is **99.85%** confined to `newIDE/app` (`1,971` tracked files; `1,972` on disk including gitignored `VersionMetadata.js`), plus only `3` pragma-only `.js` files in `newIDE/electron-app` with zero Flow type syntax. The game engine (`GDJS`), extensions (`Extensions/`), and shared libraries (`SharedLibs/`) are already 100% authored in TypeScript.
2. **Clean Flow Idioms**:
   Flow usage across the `1,971` tracked files in `newIDE/app` is standard and well-structured: 100% standard `@flow` (`// @flow` or `/** * @flow */`), no opaque types, and no exotic Flow type metaprogramming (`$Call`, `$TupleMap`). The vast majority of conversions are syntactic desugaring (`{| |}` $\rightarrow$ `{ }`, `?T` $\rightarrow$ `T | null | undefined`, `(x: T)` $\rightarrow$ `(x as T)`).
3. **WebIDL Ambient Namespace Discrepancy**:
   Flow exposes flat global class names (`gdProject`, `gdLayout`) across **579** `.js`/`.ts`/`.tsx` files in `newIDE/app/src` (excl. `locales/`; **581** incl. `.js.flow`, **4,067** matching lines, **4,111** tokens, **3,628** annotation lines, and **3,652** `: ?gd*` annotations), whereas `GDevelop.js/types.d.ts` exposes them under `namespace gd` (`gd.Project`, `gd.Layout`). An ambient global bridge (`type gdProject = gd.Project`) is necessary to prevent having to rewrite thousands of identifiers across those 579 files.
4. **Tooling Readiness**:
   Vite, Jest, and Babel are already capable of dual Flow/TypeScript compilation. Implementing file-scoped Babel overrides and updating Vite plugin dispatchers will enable seamless development in both languages simultaneously.
5. **Clear Migration Pathway**:
   The proven coexistence pattern in `src/Utils/copyBinarySnapshot.ts` provides a repeatable template for an incremental, risk-free transition from bottom-layer leaf utilities up to the application shell.
