# GDevelop Flow Diagnostic Audit & Phased TypeScript Migration Strategy

This document provides a top-level executive overview and navigation index for the comprehensive Flow Audit and TypeScript Migration Strategy prepared for the GDevelop repository.

The full, publication-grade documentation deliverables are located in `docs/FlowMigration/`:
1. [**Flow Diagnostic Audit Report (`docs/FlowMigration/FLOW_AUDIT_REPORT.md`)**](./docs/FlowMigration/FLOW_AUDIT_REPORT.md)
   - Exhaustive repository-wide census of 13,084 files.
   - Exact breakdown of 1,977 Flow files (1,972 in `newIDE/app`, 5 in `newIDE/electron-app`, 0 in `GDJS` / `Extensions` / `SharedLibs`).
   - Pragma strictness analysis (100% `// @flow`, 0 strict, 0 weak).
   - Granular directory-by-directory inventory across `newIDE/app/src/`.
   - Taxonomy of 3,265 suppressions across 757 files (3,194 `$FlowFixMe`, 70 `$FlowIgnore`, 1 `$FlowExpectedError`) broken down by Flow error codes (`incompatible-type`, `missing-local-annot`, `value-as-type`, `prop-missing`, etc.).
   - Audit of `.flowconfig`, 9 standard libdefs in `flow-libs/`, 33 third-party libdefs in `flow-typed/`, and 272 C++ WebAssembly Flow declarations in `GDevelop.js/types/`.
   - Audit of Vite 7, Sucrase, Babel, Jest, Storybook, and Semaphore CI pipelines.
   - Existing TypeScript baseline (504 `.ts`, 8 `.tsx`, 1,048 `.d.ts`) and proven coexistence precedent in `src/Utils/copyBinarySnapshot.ts`.

2. [**Phased TypeScript Migration Strategy (`docs/FlowMigration/TYPESCRIPT_MIGRATION_STRATEGY.md`)**](./docs/FlowMigration/TYPESCRIPT_MIGRATION_STRATEGY.md)
   - Comprehensive technical incompatibility analysis and syntax comparison table:
     - Exact object types `{| |}` (3,677) vs TypeScript structural types `{ }`.
     - Flow type casts `(x: T)` (3,653) vs TypeScript `(x as T)`.
     - Flow maybe types `?T` (2,958) vs `T | null | undefined`.
     - Type spreading `{ ...Props }` (866) vs intersection `Props & { ... }`.
     - Critical Hazard: Inverted generic parameter order in `React.forwardRef<Props, Ref>` (157) vs `React.forwardRef<Ref, Props>`.
     - Critical Hazard: Unnamed function parameter types `(boolean) => void` (87) vs `(arg: boolean) => void`.
     - React Typing Mappings (`React.Node` $\rightarrow$ `React.ReactNode`, `React.RefSetter<T>` $\rightarrow$ `React.Ref<T>`).
     - Utility types and property variance (`+prop` $\rightarrow$ `readonly prop`).
   - WebIDL / Emscripten C++ Bindings Ambient Bridge (`src/types/gd-globals.d.ts`):
     - Resolves 1,386 C++ type references (`gdProject`, `gdLayout`) without code refactoring.
   - Tooling & Build System Coexistence Architecture:
     - Vite 7 Sucrase and Babel extension routing recipes.
     - Scoped Babel overrides in `.babelrc.json`.
     - Jest dual-compilation execution.
     - Storybook 7 Webpack 5 loader extension.
     - Upgraded ESLint & Prettier configs (`typescript >= 5.4.5`).
     - Dual-check Semaphore CI workflow (`npm run flow` + `npm run check-types`).
   - Module boundary interoperability patterns (`.d.ts` and `.js.flow` stubs).
   - Automated codemod pipeline evaluation and custom AST post-processor specifications.
   - Actionable 6-Phase Topological Migration Roadmap (Phases 0–6) with validation gates, risk matrices, and rollback runbooks.

---

## Executive Summary of Core Findings

| Dimension | Finding | Strategic Implication |
|---|---|---|
| **Repository Scope** | Flow is 99.75% confined to `newIDE/app` (1,972 files). | The game engine (`GDJS`), extensions (`Extensions/`), and shared libraries are already 100% TypeScript. No migration is required outside `newIDE`. |
| **Pragma Uniformity** | 100% of files use standard `// @flow` (no `strict` or `weak`). | Uniform type checking baseline across the entire application codebase. |
| **Suppression Profile** | 3,265 suppressions across 757 files, heavily concentrated in test fixtures, mocks, and dynamic UI boundaries. | Transition to TypeScript's contextual typing will resolve many `$FlowFixMe[incompatible-type]` issues. |
| **C++ WebIDL Bindings** | Discrepancy between unnamespaced `gd*` (Flow) and `gd.*` (`types.d.ts`). | Solved via ambient bridge `src/types/gd-globals.d.ts`, avoiding mass refactoring across 1,386 files. |
| **Critical Hazards** | `React.forwardRef` generic inversion (157) and unnamed function parameters (87). | Solved via custom AST post-processor in the automated codemod pipeline. |
| **Coexistence Feasibility** | Proven in production by `copyBinarySnapshot.ts` paired with `copyBinarySnapshot.js.flow`. | Vite, Babel, and Jest can run Flow and TypeScript simultaneously, enabling safe incremental migration. |
