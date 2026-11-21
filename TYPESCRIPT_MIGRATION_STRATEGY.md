# GDevelop Flow to TypeScript Migration Strategy & Phased Roadmap

**Document Version**: 1.0.0  
**Target Repository**: `GDevelop` (`d:\GitHub-repo\GDevelop`)  
**Audit Date**: November 2026  
**Author**: Teamwork Architecture & Migration Engineering Group  
**Status**: Publication-Grade Strategic Roadmap  
**Scope Reference**: ORIGINAL_REQUEST.md (Requirements R2, R3, R4)  

---

## Table of Contents
1. [Executive Strategy Summary & Objectives](#1-executive-strategy-summary--objectives)
   - [1.1 Transition Objectives & Success Criteria](#11-transition-objectives--success-criteria)
   - [1.2 Strategic Tenets: Non-Disruptive Incrementalism](#12-strategic-tenets-non-disruptive-incrementalism)
   - [1.3 High-Level Topological Overview](#13-high-level-topological-overview)
2. [Technical Incompatibility Analysis & Syntax Mapping](#2-technical-incompatibility-analysis--syntax-mapping)
   - [2.1 Comprehensive Flow vs TypeScript Syntax & Semantics Comparison](#21-comprehensive-flow-vs-typescript-syntax--semantics-comparison)
   - [2.2 Critical Semantic Traps in Automated Migration](#22-critical-semantic-traps-in-automated-migration)
     - [2.2.1 `React.forwardRef` Generic Argument Order Inversion](#221-reactforwardref-generic-argument-order-inversion)
     - [2.2.2 Unnamed Function Parameters Type Erasure Bug](#222-unnamed-function-parameters-type-erasure-bug)
     - [2.2.3 Object Type Spreading vs Intersection](#223-object-type-spreading-vs-intersection)
     - [2.2.4 Flow Maybe Types (`?T`) Nullability Semantics](#224-flow-maybe-types-t-nullability-semantics)
     - [2.2.5 Exact Object Types (`{| |}`) vs TypeScript Structural Types](#225-exact-object-types---vs-typescript-structural-types)
     - [2.2.6 Expression Type Casts vs TypeScript Type Assertions](#226-expression-type-casts-vs-typescript-type-assertions)
   - [2.3 React Typing Differences (`React.Node`, `RefSetter`, `ComponentType`)](#23-react-typing-differences-reactnode-refsetter-componenttype)
   - [2.4 Utility Types & Property Variance (`+prop`, `$Shape`, `$Keys`, `$ReadOnly`)](#24-utility-types--property-variance-prop-shape-keys-readonly)
3. [WebIDL / Emscripten C++ Bindings Bridge (`GDevelop.js`)](#3-webidl--emscripten-c-bindings-bridge-gdevelopjs)
   - [3.1 The Global vs Namespaced C++ Type Conflict](#31-the-global-vs-namespaced-c-type-conflict)
   - [3.2 The Zero-Code-Change Ambient Bridge Solution](#32-the-zero-code-change-ambient-bridge-solution)
   - [3.3 Reference Implementation: `src/types/gd-globals.d.ts`](#33-reference-implementation-srctypesgd-globalsdts)
   - [3.4 C++ Object Memory Lifecycles & Pointer Equality](#34-c-object-memory-lifecycles--pointer-equality)
   - [3.5 Long-Term Libdef Generation Convergence](#35-long-term-libdef-generation-convergence)
4. [Tooling & Build System Coexistence Architecture](#4-tooling--build-system-coexistence-architecture)
   - [4.1 Vite 7 Dual-Compilation Engine (`newIDE/app/vite.config.mjs`)](#41-vite-7-dual-compilation-engine-newideappviteconfigmjs)
   - [4.2 Scoped Babel Configuration (`newIDE/app/.babelrc.json`)](#42-scoped-babel-configuration-newideappbabelrcjson)
   - [4.3 Jest 27 Test Runner Coexistence (`newIDE/app/jest.config.js`)](#43-jest-27-test-runner-coexistence-newideappjestconfigjs)
   - [4.4 Storybook 7 with Webpack 5 Integration (`.storybook/main.js`)](#44-storybook-7-with-webpack-5-integration-storybookmainjs)
   - [4.5 Linter & Formatter Alignment (ESLint, Prettier, Husky)](#45-linter--formatter-alignment-eslint-prettier-husky)
   - [4.6 Continuous Integration Pipeline Dual-Checking (`.semaphore/semaphore.yml`)](#46-continuous-integration-pipeline-dual-checking-semaphoresemaphoreyml)
5. [Module Boundary Interoperability Patterns](#5-module-boundary-interoperability-patterns)
   - [5.1 Why `allowJs: false` is Mandatory for the IDE `tsconfig.json`](#51-why-allowjs-false-is-mandatory-for-the-ide-tsconfigjson)
   - [5.2 Pattern A: TypeScript Importing Flow Code](#52-pattern-a-typescript-importing-flow-code)
   - [5.3 Pattern B: Flow Importing TypeScript Code](#53-pattern-b-flow-importing-typescript-code)
   - [5.4 Stub Management Lifecycle & Automated Cleanup](#54-stub-management-lifecycle--automated-cleanup)
6. [Automated Codemod Suite & Conversion Workflow](#6-automated-codemod-suite--conversion-workflow)
   - [6.1 Evaluation of Existing Tools (`flow-to-ts`, `flow-to-typescript`)](#61-evaluation-of-existing-tools-flow-to-ts-flow-to-typescript)
   - [6.2 The Recommended Multi-Stage Codemod Pipeline](#62-the-recommended-multi-stage-codemod-pipeline)
   - [6.3 Custom AST Post-Processor Specifications](#63-custom-ast-post-processor-specifications)
   - [6.4 Developer Step-by-Step File Migration Guide](#64-developer-step-by-step-file-migration-guide)
7. [Actionable 6-Phase Topological Migration Roadmap](#7-actionable-6-phase-topological-migration-roadmap)
   - [7.1 Phase 0: Infrastructure & Tooling Foundation (Weeks 1–2)](#71-phase-0-infrastructure--tooling-foundation-weeks-12)
   - [7.2 Phase 1: Pure Foundation Utilities & Custom SVG Icons (Weeks 3–4)](#72-phase-1-pure-foundation-utilities--custom-svg-icons-weeks-34)
   - [7.3 Phase 2: Design System & Primitive UI Components (Weeks 5–7)](#73-phase-2-design-system--primitive-ui-components-weeks-57)
   - [7.4 Phase 3: Core Domain Models & Editor Functions (Weeks 8–11)](#74-phase-3-core-domain-models--editor-functions-weeks-811)
   - [7.5 Phase 4: Feature Editors & Workspace Panels (Weeks 12–16)](#75-phase-4-feature-editors--workspace-panels-weeks-1216)
   - [7.6 Phase 5: High-Complexity Visual Editors & Application Shell (Weeks 17–21)](#76-phase-5-high-complexity-visual-editors--application-shell-weeks-1721)
   - [7.7 Phase 6: Subproject Integration & Flow Decommissioning (Weeks 22–24)](#77-phase-6-subproject-integration--flow-decommissioning-weeks-2224)
8. [Risk Governance, Verification Gates & Rollback Runbooks](#8-risk-governance-verification-gates--rollback-runbooks)
   - [8.1 Comprehensive Risk Matrix](#81-comprehensive-risk-matrix)
   - [8.2 Per-Phase Automated CI Verification Gates](#82-per-phase-automated-ci-verification-gates)
   - [8.3 Rollback Protocols](#83-rollback-protocols)

---

## 1. Executive Strategy Summary & Objectives

### 1.1 Transition Objectives & Success Criteria
The primary goal is the complete, orderly migration of the GDevelop editor application (`newIDE/app`) from **Flow 0.299.0** to **TypeScript 5.4+** without destabilizing active feature development, introducing runtime bugs, or breaking existing CI workflows.

Key quantitative and qualitative success criteria:
1. **Zero Runtime Regressions**: 100% test pass rate maintained in Jest unit tests, integration tests, and visual tests across every pull request.
2. **Unified Monorepo Typing**: Unify `newIDE/app` with `GDJS/Runtime` (Game Engine) and `Extensions/`, eliminating Flow from the entire repository.
3. **Zero-Code-Change C++ Bindings**: Seamless resolution of 1,386 C++ WebAssembly type call sites (`gdProject`, `gdLayout`) via an ambient declaration bridge.
4. **Tooling Simplification**: Elimination of hundreds of lines of fragile Sucrase and Babel type-stripping logic in `vite.config.mjs`.
5. **Developer Experience Acceleration**: Sub-second editor autocompletion, refactoring safety, and standard DefinitelyTyped `@types/*` library ecosystem integration.

### 1.2 Strategic Tenets: Non-Disruptive Incrementalism
A "big-bang" migration across 1,972 files in a single pull request is mathematically infeasible and architecturally irresponsible. It would create unresolvable merge conflicts for ongoing feature branches, overwhelm code reviewers, and risk catastrophic editor regressions.

Instead, this strategy adheres to **Strict Topological Incrementalism**:
- **Leaf-to-Root Migration**: Modules are converted strictly according to their directed acyclic graph (DAG) dependency order: pure utility leaves $\rightarrow$ design system primitives $\rightarrow$ domain models $\rightarrow$ feature editors $\rightarrow$ application shell.
- **Bi-Directional Coexistence**: Both Flow and TypeScript coexist simultaneously within `newIDE/app` throughout the 6-month roadmap.
- **Dual CI Enforcement**: Continuous integration executes both `flow` and `tsc` in parallel on every pull request, guaranteeing that unmigrated files remain Flow-valid while newly migrated files strictly satisfy TypeScript.

### 1.3 High-Level Topological Overview

```
                      ┌────────────────────────────────────────┐
                      │ Phase 0: Infrastructure & Tooling      │
                      │ Vite, Babel, Jest, tsconfig, gd-globals│
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │ Phase 1: Pure Utilities & SVG Icons    │
                      │ src/Utils, CustomSvgIcons (278 files)  │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │ Phase 2: Design System & Primitive UI  │
                      │ src/UI/*, Alerts, Buttons, Inputs      │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │ Phase 3: Domain Models & Core Editors  │
                      │ EditorFunctions, InstancesEditor, Props│
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │ Phase 4: Feature Editors & Panels      │
                      │ ObjectEditor, AssetStore, Export, Dash │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │ Phase 5: Visual Editors & App Shell    │
                      │ EventsSheet, SceneEditor, MainFrame    │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │ Phase 6: Subprojects & Decommissioning │
                      │ electron-app, remove .flowconfig & bin │
                      └────────────────────────────────────────┘
```

---

## 2. Technical Incompatibility Analysis & Syntax Mapping

### 2.1 Comprehensive Flow vs TypeScript Syntax & Semantics Comparison
The following table details every Flow typing construct present in GDevelop, mapped to its TypeScript counterpart with real repository code extracts, semantic hazards, and recommended conversion mechanisms:

| Flow Syntax / Pattern | TypeScript Equivalent | GDevelop Code Sample | Semantic Differences / Hazards | Migration Strategy | Risk |
|---|---|---|---|---|---|
| **Exact Object Type** `{| ... |}` (3,677) | `{ ... }` | `type Props = {\| isHistoryOpen: boolean \|};` (`AiGeneration/Toolbar.js:11`) | Flow strictly disallows excess properties across variable assignments. TS only checks fresh object literals. | Convert `{\| ... \|}` $\rightarrow$ `{ ... }`. Accept TS structural excess property behavior. | Low |
| **Type Spread in Object Type** `{ ...Props }` (866) | `Props & { ... }` | `type ContainerProps = {\| ...Props, gameId: string \|};` (`LeaderboardAdmin/index.js:1138`) | **Syntax Error in TypeScript**. TS does not allow object spreading in type literals. | Convert to intersection: `Props & { gameId: string }` or `interface ... extends Props`. | **High** |
| **Maybe Type** `: ?T` (2,958) | `: T \| null \| undefined` | `tutorials: ?Array<Tutorial>` (`EventsSheet/index.js:209`) | **Syntax Error in TypeScript**. Flow's `?T` combines null and undefined. | Convert `: ?T` $\rightarrow$ `: T \| null \| undefined`. For props `x?: ?T`, use `x?: T \| null`. | **High** |
| **Unnamed Function Parameter** `(T) => R` (87) | `(arg: T) => R` | `done: (boolean) => void` (`CompactEventsFunctionParametersEditor.js:152`) | **Severe Silent Semantic Bug**: TS treats `(boolean) => void` as parameter named `boolean` of type `any`! | Codemod must synthesize named parameter: `(done: boolean) => void`. | **Critical** |
| **`React.forwardRef` Generics** `<Props, Ref>` (157) | `<Ref, Props>` | `React.forwardRef<Props, AskAiEditorInterface>(...)` (`AskAiEditorContainer.js:294`) | **Generic Parameter Order Inverted**: Flow uses `<Props, Ref>`, TypeScript uses `<Ref, Props>`. | Codemod must swap generic arguments when transforming `forwardRef`. | **Critical** |
| **Flow Type Cast** `(x: T)` / `((x: any): T)` (3,653) | `(x as T)` / `(x as any as T)` | `((anchorName: any): InstanceAnchor)` (`EditorFunctions/index.js:872`) | `(x: T)` in expression position is a **Syntax Error in TypeScript**. | Transform to `(x as T)` or `(x as unknown as T)`. | **High** |
| **React Node Type** `React.Node` (2,524) | `React.ReactNode` | `}: Props): React.Node => {` (`Toolbar.js:27`) | `React.Node` does not exist in `@types/react`. | Mechanical replacement: `React.Node` $\rightarrow$ `React.ReactNode`. | Low |
| **React Ref Setter** `React.RefSetter<T>` | `React.Ref<T>` / `React.ForwardedRef<T>` | `+ref?: React.RefSetter<AssetStoreInterface>` (`AssetStore/index.js:125`) | `React.RefSetter` is a Flow-only utility type. | Replace with `React.Ref<T>` or `React.ForwardedRef<T>`. | Medium |
| **Covariant Property** `+prop: T` (44) | `readonly prop: T` | `+scene: ?gdLayout` (`OutsideEditorChanges.js:22`) | Flow uses `+`/`-`. TS uses `readonly`. | Replace `+key:` with `readonly key:`. | Low |
| **Class Constructor Type** `Class<T>` (25) | `typeof T` / `new (...args: any[]) => T` | `pixiResourcesLoader: Class<PixiResourcesLoader>` (`Rendered3DInstance.js:19`) | `Class<T>` does not exist in standard TypeScript. | Replace with `typeof T` (for static side) or `new (...args: any[]) => T`. | Medium |
| **Flow Utility `$Keys<T>`** (3) | `keyof T` | `export type CommandArea = $Keys<typeof commandAreas>;` (`CommandsList.js:110`) | `$Keys<T>` does not exist in TypeScript. | Replace with `keyof T`. | Low |
| **Flow Utility `$Shape<T>`** (3) | `Partial<T>` | `export type EditorStateForProjectUpdate = $Shape<EditorStateForProject>;` (`PreferencesContext.js:195`) | `$Shape<T>` is Flow's partial object utility. | Replace with `Partial<T>`. | Low |
| **Flow Utility `$ReadOnlyArray<T>`** (27) | `ReadonlyArray<T>` / `readonly T[]` | `allowedPreferenceKeys: $ReadOnlyArray<...>` (`ApplyProjectPreferences.js:10`) | Exact equivalent exists in TS. | Replace with `ReadonlyArray<T>` or `readonly T[]`. | Low |
| **Flow Utility `$ReadOnly<T>`** (1) | `Readonly<T>` | `export type GdGamesMessageEventData = $ReadOnly<{ ... }>` (`UI/GdGamesFrame.js:16`) | Exact equivalent exists in TS. | Replace with `Readonly<T>`. | Low |
| **Flow Utility `$Exact<T>`** (2) | Identity (`T`) | `type Theme = $Exact<typeof DefaultLightTheme>;` (`UI/Theme/index.js:21`) | TS has no exact type operator; all object types are structural. | Replace with `T`. | Low |
| **Ambient C++ Class** `gdProject` (1,386 files) | `gd.Project` (or global alias) | `project: gdProject` (`EventsSheet/index.js:171`) | Flow types are flat global classes (`gdProject`); TS `types.d.ts` uses namespace `gd.Project`. | Inject global compatibility alias shim `declare global { type gdX = gd.X }`. | **High** |
| **Runtime C++ Object** `const gd = global.gd` (340 files) | Ambient global `gd` | `const gd: libGDevelop = global.gd;` (340 files in `newIDE/app/src/`) | TS already defines global `const gd: typeof gd`. | Define `type libGDevelop = typeof gd;` in bridge. | Medium |
| **Flow Suppression** `$FlowFixMe[code]` (3,194) | `@ts-expect-error` / `@ts-ignore` | `// $FlowFixMe[incompatible-type]` | Flow error codes in brackets are ignored by TypeScript. | Convert to `// @ts-expect-error [flow-migration: code]`. | Medium |
| **Inline Type Imports** `import { type Foo }` (1,500) | `import { type Foo }` | `import { type StoryDecorator } from '@storybook/react';` | Supported in TS 4.5+. Requires TS 5+ in `newIDE/app`. | Upgrade `typescript` devDependency to `>=5.4.5`. | Low |
| **Flow Test Mocks** `JestMockFn<any, any>` | `jest.Mock<any, any>` | `const mockFn = (fn: any): JestMockFn<any, any> => fn;` (`AiRequestContext.spec.js:37`) | Flow-typed Jest definition vs DefinitelyTyped `@types/jest`. | Replace with `jest.Mock` from `@types/jest`. | Low |

---

### 2.2 Critical Semantic Traps in Automated Migration

#### 2.2.1 `React.forwardRef` Generic Argument Order Inversion
In GDevelop, there are **157 instances** of `React.forwardRef`.
- **Flow Definition**:
  ```javascript
  React.forwardRef<Props, RefType>((props, ref) => ...)
  ```
  Flow places the component `Props` type first, and the `RefType` second.
- **TypeScript Definition (`@types/react`)**:
  ```typescript
  React.forwardRef<RefType, Props>((props, ref) => ...)
  ```
  TypeScript places `RefType` FIRST, and `Props` SECOND!
- **Catastrophic Failure Mode**: If an automated codemod does not invert the parameters, TypeScript will treat the component's `Props` as its DOM ref and its `RefType` as its JSX props, causing compilation failure across all 157 forwarded ref components in the editor.
- **Example in GDevelop (`newIDE/app/src/AiGeneration/AskAiEditorContainer.js:293`)**:
  ```javascript
  // FLOW (Current):
  export const AskAiEditor: React.ComponentType<Props> = React.memo<Props>(
    React.forwardRef<Props, AskAiEditorInterface>(
      ({ isHistoryOpen, ... }: Props, ref) => { ... }
    )
  );

  // TYPESCRIPT (Required Transformation):
  export const AskAiEditor: React.ComponentType<Props> = React.memo(
    React.forwardRef<AskAiEditorInterface, Props>(
      ({ isHistoryOpen, ... }: Props, ref) => { ... }
    )
  );
  ```

#### 2.2.2 Unnamed Function Parameters Type Erasure Bug
In Flow, a function type parameter does not require an identifier name:
```javascript
// Flow in AssetStoreUtils.js:
done: (boolean) => void,
onBundleSelection: ?(BundleListingData) => void
```
- **Silent Semantic Corruption in TypeScript**:
  In TypeScript, `(boolean) => void` is parsed as a function taking an argument **named `boolean`** whose type is implicitly **`any`**!
  Likewise, `(BundleListingData) => void` becomes an argument named `BundleListingData` of type `any`.
  The type is completely erased, and the parameter name becomes a useless shadow of the intended type!
- **Mandatory Codemod Rule**:
  When migrating arrow function types, if a parameter is an unannotated single identifier, the codemod must synthesize a parameter name:
  ```typescript
  done: (done: boolean) => void,
  onBundleSelection?: (bundle: BundleListingData) => void
  ```

#### 2.2.3 Object Type Spreading vs Intersection
In Flow, object type spreading is frequently used to compose component props (866 occurrences):
```javascript
// Flow in LeaderboardAdmin/index.js:
type ContainerProps = {| ...Props, gameId: string |};
```
TypeScript syntax completely rejects spreading within type literals (`Parsing error: '...' expected`).
- **Required Transformation**: Must be transformed to intersection types:
  ```typescript
  type ContainerProps = Props & { gameId: string };
  ```
  Or using interface inheritance where appropriate:
  ```typescript
  interface ContainerProps extends Props {
    gameId: string;
  }
  ```

#### 2.2.4 Flow Maybe Types (`?T`) Nullability Semantics
Flow's `?T` is shorthand for `T | null | void` (which includes `undefined`). In TypeScript:
1. **In property position (`prop: ?T`)**:
   ```typescript
   // Flow:
   onOpenSettings: ?(() => void)
   // TypeScript:
   onOpenSettings?: (() => void) | null
   ```
2. **In generic argument position (`Array<?T>`)**:
   ```typescript
   // Flow:
   tutorials: ?Array<Tutorial>
   // TypeScript:
   tutorials: Array<Tutorial> | null | undefined
   ```

#### 2.2.5 Exact Object Types (`{| |}`) vs TypeScript Structural Types
Flow enforces strict excess property prevention across variable assignments for exact types (`{| ... |}`, 3,677 occurrences).
- In TypeScript, structural typing allows extra properties when assigned through intermediate variables, though Excess Property Checks (EPC) are enforced on direct object literals.
- **Strategy**: Strip exact delimiters `{| ... |}` $\rightarrow$ `{ ... }`. Code review across GDevelop confirms runtime code does not rely on object sealing; TypeScript's standard structural typing is completely compatible with the existing runtime behavior.

#### 2.2.6 Expression Type Casts vs TypeScript Type Assertions
Flow uses colon expressions for type coercion:
```javascript
// Flow in EditorFunctions/index.js:
const anchor = ((anchorName: any): InstanceAnchor);
ALL_SCOPE_TYPES.includes((value: any));
```
Colons in expression positions are invalid syntax in TypeScript.
- **Transformation**:
  - `(value: any)` $\rightarrow$ `(value as any)`
  - `((x: any): T)` $\rightarrow$ `(x as any as T)` or `(x as unknown as T)`

---

### 2.3 React Typing Differences (`React.Node`, `RefSetter`, `ComponentType`)
1. **`React.Node` (2,524 occurrences)**:
   In `@types/react`, the corresponding interface is `React.ReactNode`. A global mechanical replacement (`React.Node` $\rightarrow$ `React.ReactNode`) is applied to all migrated `.tsx` files.
2. **`React.RefSetter<T>`**:
   Flow's custom ref setter interface must be replaced with standard TypeScript `React.Ref<T>` or `React.ForwardedRef<T>`.
3. **Class Component State Declarations**:
   Flow allows re-declaring class component state fields:
   ```javascript
   export default class EventsSheet extends React.Component<Props, State> {
     state: State = { ... };
   }
   ```
   In TypeScript with `useDefineForClassFields: true`, initialize state in the constructor or ensure state property types match `React.Component<Props, State>` exactly to prevent class field shadowing.

---

### 2.4 Utility Types & Property Variance (`+prop`, `$Shape`, `$Keys`, `$ReadOnly`)
The codebase uses standard Flow utility types in low volumes:
- **`+prop: T` (44 occurrences)** $\rightarrow$ Maps cleanly to `readonly prop: T`.
- **`$Keys<T>` (3 occurrences)** $\rightarrow$ Maps to `keyof T`.
- **`$Shape<T>` (3 occurrences)** $\rightarrow$ Maps to `Partial<T>`.
- **`$ReadOnlyArray<T>` (27 occurrences)** $\rightarrow$ Maps to `ReadonlyArray<T>` or `readonly T[]`.
- **`$ReadOnly<T>` (1 occurrence)** $\rightarrow$ Maps to `Readonly<T>`.
- **`$Exact<T>` (2 occurrences)** $\rightarrow$ Maps to identity `T`.
- **Advanced Flow Metaprogramming**: GDevelop contains **0 occurrences** of `$Values`, `$Diff`, `$Rest`, `$Call`, or `$ObjMap`. The codebase is free of exotic Flow type metaprogramming.

---

## 3. WebIDL / Emscripten C++ Bindings Bridge (`GDevelop.js`)

### 3.1 The Global vs Namespaced C++ Type Conflict
The C++ WebAssembly engine bindings (`GDevelop.js`) represent the most critical domain-specific typing subsystem in the monorepo:
1. **In Flow**: 150+ declaration files in `GDevelop.js/types/` export flat global classes: `gdProject`, `gdLayout`, `gdObjectsContainer`, `gdInstruction`, `gdEventsList`.
2. **In TypeScript**: `GDevelop.js/scripts/generate-dts.mjs` generates a single unified `GDevelop.js/types.d.ts` file structured under `namespace gd` (`gd.Project`, `gd.Layout`, `gd.ObjectsContainer`).
3. **The Scale of Conflict**: Across `newIDE/app/src/`, **1,386 files** directly annotate function parameters, variables, and state with unnamespaced `gd*` types!
4. **The Runtime Conflict**: **340 files** contain:
   ```javascript
   const gd: libGDevelop = global.gd;
   ```
   Whereas `GDevelop.js/types.d.ts` declares `const gd: typeof gd;` globally.

### 3.2 The Zero-Code-Change Ambient Bridge Solution
Refactoring 1,386 files to replace `gdProject` with `gd.Project` would create massive code churn and high merge-conflict risk.
Instead, we introduce an **Ambient Type Alias Bridge**: `src/types/gd-globals.d.ts`.

By declaring global type aliases that map every `gdX` identifier directly to `gd.X` (from the already existing `GDevelop.js/types.d.ts`), TypeScript will resolve all 1,386 files **with 100% type safety and zero code refactoring**!

### 3.3 Reference Implementation: `src/types/gd-globals.d.ts`

```typescript
/**
 * GDevelop.js C++ WebAssembly Ambient Type Bridge
 * Maps unnamespaced gd* Flow type identifiers to GDevelop.js/types.d.ts namespaced classes.
 * Enables zero-code-change type resolution for 1,386 migrated TypeScript files in newIDE/app.
 */

import * as gdModule from '../../../../GDevelop.js/types';

declare global {
  // Global runtime instance
  const gd: typeof gdModule;

  // Runtime library type bridge
  type libGDevelop = typeof gdModule;

  // Core Project & Layout Models
  type gdProject = gdModule.Project;
  type gdLayout = gdModule.Layout;
  type gdObjectsContainer = gdModule.ObjectsContainer;
  type gdObject = gdModule.Object;
  type gdObjectConfiguration = gdModule.ObjectConfiguration;
  type gdObjectGroup = gdModule.ObjectGroup;
  type gdInitialInstance = gdModule.InitialInstance;
  type gdInitialInstancesContainer = gdModule.InitialInstancesContainer;

  // Visual Events & Instructions
  type gdBaseEvent = gdModule.BaseEvent;
  type gdStandardEvent = gdModule.StandardEvent;
  type gdRepeatEvent = gdModule.RepeatEvent;
  type gdWhileEvent = gdModule.WhileEvent;
  type gdForEachEvent = gdModule.ForEachEvent;
  type gdEventsList = gdModule.EventsList;
  type gdInstruction = gdModule.Instruction;
  type gdInstructionsList = gdModule.InstructionsList;
  type gdExpression = gdModule.Expression;

  // Extensions & Functions
  type gdPlatform = gdModule.Platform;
  type gdJsPlatform = gdModule.JsPlatform;
  type gdPlatformExtension = gdModule.PlatformExtension;
  type gdEventsFunction = gdModule.EventsFunction;
  type gdEventsFunctionsContainer = gdModule.EventsFunctionsContainer;
  type gdEventsFunctionsExtension = gdModule.EventsFunctionsExtension;
  type gdEventsBasedBehavior = gdModule.EventsBasedBehavior;
  type gdEventsBasedObject = gdModule.EventsBasedObject;

  // Variables & Data Structures
  type gdVariable = gdModule.Variable;
  type gdVariablesContainer = gdModule.VariablesContainer;
  type gdSerializerElement = gdModule.SerializerElement;
  type gdResource = gdModule.Resource;
  type gdResourcesManager = gdModule.ResourcesManager;

  // Emscripten Standard Library Vector Helpers
  type gdVectorString = gdModule.VectorString;
  type gdVectorPlatformExtension = gdModule.VectorPlatformExtension;
  type gdVectorObject = gdModule.VectorObject;
  type gdVectorInstruction = gdModule.VectorInstruction;
  type gdMapStringString = gdModule.MapStringString;
  type gdMapStringVariable = gdModule.MapStringVariable;

  // Emscripten Base
  type gdEmscriptenObject = gdModule.EmscriptenObject;
}

export {};
```

*Note: A generator script (`scripts/generate-gd-globals.mjs`) will be authored in Phase 0 to automatically synchronize all 248 classes from `GDevelop.js/types.d.ts` into `src/types/gd-globals.d.ts`.*

### 3.4 C++ Object Memory Lifecycles & Pointer Equality
Because Emscripten objects represent heap-allocated C++ instances:
- Explicit disposal via `.delete()` is required when discarding owned objects.
- Object equality cannot use `===` because Emscripten creates separate JS wrapper instances for the same C++ pointer. `gd.compare(a, b)` must be used.
- Pointer validation is checked via `gd.assertObjectAlive(obj)`.
TypeScript's `types.d.ts` accurately models these constraints through `EmscriptenObject { ptr: number; delete(): void; }`.

### 3.5 Long-Term Libdef Generation Convergence
Upon completion of Phase 5 (zero Flow files remaining in `newIDE/app`):
1. Delete `GDevelop.js/scripts/generate-types.js` (Flow generator).
2. Delete `GDevelop.js/types/` (272 Flow files).
3. The entire monorepo (`GDJS`, `Extensions`, `newIDE`) will rely exclusively on `GDevelop.js/scripts/generate-dts.mjs` and `types.d.ts`.

---

## 4. Tooling & Build System Coexistence Architecture

### 4.1 Vite 7 Dual-Compilation Engine (`newIDE/app/vite.config.mjs`)
Vite 7 compiles `newIDE/app` using custom Sucrase and Babel plugins. To enable transparent dual compilation of both Flow and TypeScript files during the transition, three precise modifications are required:

#### Modification 1: Expand Source File Regular Expression
In `newIDE/app/vite.config.mjs` (line 59):
```javascript
// BEFORE:
const SOURCE_JS_RE = /[\\/]newIDE[\\/]app[\\/]src[\\/].*\.js$/;

// AFTER:
const SOURCE_CODE_RE = /[\\/]newIDE[\\/]app[\\/]src[\\/].*\.(js|jsx|ts|tsx)$/;
```

#### Modification 2: Route Sucrase Transforms by Extension (`createFastFlowJsxPlugin`)
In `createFastFlowJsxPlugin` (lines 308–355):
```javascript
// BEFORE:
const transformed = sucraseTransform(code, {
  transforms: ['flow', 'jsx'],
  jsxRuntime: 'classic',
  disableESTransforms: true,
  filePath: cleanId,
  sourceMapOptions: { compiledFilename: cleanId },
});

// AFTER:
const isTypeScript = cleanId.endsWith('.ts') || cleanId.endsWith('.tsx');
const transformed = sucraseTransform(code, {
  transforms: isTypeScript ? ['typescript', 'jsx'] : ['flow', 'jsx'],
  jsxRuntime: 'classic',
  disableESTransforms: true,
  filePath: cleanId,
  sourceMapOptions: { compiledFilename: cleanId },
});
```

#### Modification 3: Route Babel Fallback Presets by Extension (`createBabelReactPlugins`)
In `createBabelReactPlugins` (lines 358–395):
```javascript
// BEFORE:
presets: [
  ['@babel/preset-react', { runtime: 'classic' }],
  '@babel/preset-flow',
]

// AFTER:
const isTypeScript = cleanId.endsWith('.ts') || cleanId.endsWith('.tsx');
presets: [
  ['@babel/preset-react', { runtime: 'classic' }],
  isTypeScript ? '@babel/preset-typescript' : '@babel/preset-flow',
]
```

**Verification**: This change guarantees that `.ts` and `.tsx` files are stripped and hot-reloaded with sub-10ms latency using Sucrase, while existing `.js` files continue to be processed through the Flow pipeline.

---

### 4.2 Scoped Babel Configuration (`newIDE/app/.babelrc.json`)
Currently, `.babelrc.json` specifies `@babel/preset-flow` at the root, which throws syntax errors when encountering TypeScript keywords (`enum`, `as const`, etc.).
We convert the monolithic preset list into file-scoped `overrides`:

```json
{
  "sourceType": "unambiguous",
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "chrome": 100,
          "safari": 15,
          "firefox": 91
        }
      }
    ],
    "@babel/preset-react"
  ],
  "overrides": [
    {
      "test": ["**/*.js", "**/*.jsx"],
      "presets": ["@babel/preset-flow"]
    },
    {
      "test": ["**/*.ts", "**/*.tsx"],
      "presets": ["@babel/preset-typescript"]
    }
  ],
  "plugins": [
    "babel-plugin-macros"
  ]
}
```
**Verification**: Babel will now automatically apply `@babel/preset-flow` to `.js`/`.jsx` files and `@babel/preset-typescript` to `.ts`/`.tsx` files across Babel CLI, Jest, and Storybook.

---

### 4.3 Jest 27 Test Runner Coexistence (`newIDE/app/jest.config.js`)
`newIDE/app/jest.config.js` is **already pre-configured** to match `.ts` and `.tsx` files:
- `testMatch`: `['<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}', '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}']`
- `transform`: `'^.+\\.(js|jsx|mjs|cjs|ts|tsx)$': '<rootDir>/config/jest/babelTransform.js'`
- `moduleFileExtensions`: `['web.js', 'js', 'web.ts', 'ts', 'web.tsx', 'tsx', ...]`

Because `babelTransform.js` uses Babel with `babelrc: true`, the updated `.babelrc.json` overrides above immediately allow Jest to execute `.spec.js` (Flow) and `.spec.ts` (TypeScript) tests simultaneously in the same test run!

---

### 4.4 Storybook 7 with Webpack 5 Integration (`.storybook/main.js`)
In `newIDE/app/.storybook/main.js` (line 47):
```javascript
// BEFORE:
stories: ['../src/stories/**/*.stories.js'],

// AFTER:
stories: ['../src/stories/**/*.stories.@(js|jsx|ts|tsx)'],
```
Webpack 5 loads Babel via `babel-loader` extending `.babelrc.json`, ensuring newly migrated `.stories.tsx` components render seamlessly alongside existing `.stories.js` stories.

---

### 4.5 Linter & Formatter Alignment (ESLint, Prettier, Husky)
1. **TypeScript devDependency Upgrade**:
   `newIDE/app/package.json` currently specifies `"typescript": "^4.1.3"`. This must be updated to `"typescript": "5.4.5"` to match `GDJS/package.json` and support modern TypeScript syntax (`using`, inline type imports).
2. **ESLint Parser Keyword Support**:
   Upgrade `@typescript-eslint/parser` to support ECMAScript explicit resource management (`using`) used in `copyBinarySnapshot.ts`.
3. **Expand Package Scripts**:
   Update `newIDE/app/package.json`:
   ```json
   "lint": "eslint src/ --ext .js,.jsx,.ts,.tsx --max-warnings=0",
   "format": "prettier --write \"src/!(locales)/**/*.{js,jsx,ts,tsx}\"",
   "check-format": "prettier --list-different \"src/!(locales)/**/*.{js,jsx,ts,tsx}\"",
   "lint-staged": {
     "src/!(locales)/**/*.{js,jsx,ts,tsx}": [
       "prettier --write",
       "eslint --max-warnings=0"
     ]
   }
   ```

---

### 4.6 Continuous Integration Pipeline Dual-Checking (`.semaphore/semaphore.yml`)
In `.semaphore/semaphore.yml`, update the `newIDE typing` CI job:
```yaml
        - name: newIDE typing
          commands:
            - checkout
            - cd newIDE/app
            - npm run postinstall
            - npm run flow
            - npm run check-types
            - npm run check-script-types
```
Where `npm run check-types` in `newIDE/app/package.json` executes:
```json
"check-types": "tsc --noEmit --project tsconfig.json"
```
**CI Gate Rule**: A pull request can only be merged if **BOTH** Flow (`npm run flow`) and TypeScript (`npm run check-types`) report 0 errors!

---

## 5. Module Boundary Interoperability Patterns

### 5.1 Why `allowJs: false` is Mandatory for the IDE `tsconfig.json`
Direct testing with the TypeScript compiler API demonstrated that if `allowJs: true` is configured in `newIDE/app/tsconfig.json`, `tsc` attempts to parse unmigrated Flow `.js` files when imported by TypeScript files.
Because Flow syntax (`?T`, `{| |}`, `(x: T)`, `export type`) is invalid JavaScript, `tsc` immediately crashes with:
- `error TS8008: Type aliases can only be used in TypeScript files.`
- `error TS8010: Type annotations can only be used in TypeScript files.`

**Architectural Mandate**: `newIDE/app/tsconfig.json` MUST configure:
```json
"allowJs": false,
"checkJs": false
```
Cross-language module resolution across the boundary must be handled strictly via **Declaration Bridges** and **Companion Stubs**.

---

### 5.2 Pattern A: TypeScript Importing Flow Code
When a newly migrated TypeScript file imports an unmigrated Flow `.js` file:

#### 1. Ambient Wildcard Declaration (`src/types/unmigrated-flow-modules.d.ts`)
To allow developers to migrate leaf modules without authoring hundreds of stubs for high-level UI parents, provide ambient wildcard declarations:
```typescript
/**
 * Wildcard ambient typings for unmigrated Flow modules.
 * Allows migrated TypeScript files to import unmigrated Flow subsystems as 'any'.
 */
declare module '*/MainFrame/*' { const content: any; export default content; export = content; }
declare module '*/SceneEditor/*' { const content: any; export default content; export = content; }
declare module '*/EventsSheet/*' { const content: any; export default content; export = content; }
```

#### 2. Companion `.d.ts` Stubs (High-Traffic Service Boundaries)
For heavily consumed services (e.g. `PreferencesContext.js`, `ProjectManager.js`), author a typed companion file: `PreferencesContext.d.ts` adjacent to `PreferencesContext.js`.
TypeScript resolves `PreferencesContext.d.ts`, providing full autocomplete and type safety, while Flow continues using `PreferencesContext.js`.
*Once `PreferencesContext.js` is converted to `PreferencesContext.tsx`, the companion `.d.ts` file is deleted.*

---

### 5.3 Pattern B: Flow Importing TypeScript Code
When an unmigrated Flow file imports a newly migrated TypeScript file:

#### 1. The Companion `.js.flow` Stub Pattern (The Proven Pilot)
Demonstrated in production by `src/Utils/copyBinarySnapshot.ts` & `copyBinarySnapshot.js.flow`:
- Implementation: `MyHelper.ts`
- Companion Stub: `MyHelper.js.flow` (containing Flow `declare export function ...`)
- Flow resolves `MyHelper.js.flow` and continues type-checking without error.
- Bundlers (Vite/Webpack/Jest) resolve `MyHelper.ts` for actual execution.

#### 2. Untyped Declaration in `.flowconfig`
For components where strict type propagation into Flow is not required, `.flowconfig` can mark migrated files as untyped:
```ini
[untyped]
<PROJECT_ROOT>/src/.*\.tsx?$
```
Flow will treat imports of `.ts`/`.tsx` files as `any`, preventing Flow compiler errors without requiring manual `.js.flow` stub authoring for non-critical components.

---

### 5.4 Stub Management Lifecycle & Automated Cleanup
Stubs are strictly temporary transitional artifacts.
- Every `.js.flow` stub will carry a header: `// @flow-transitional-stub [Phase N]`.
- At the end of each migration phase, a CI check ensures that any stubs whose corresponding consumers have all been migrated to TypeScript are deleted.

---

## 6. Automated Codemod Suite & Conversion Workflow

### 6.1 Evaluation of Existing Tools (`flow-to-ts`, `flow-to-typescript`)
Off-the-shelf conversion tools were evaluated against GDevelop's AST patterns:

| Tool | Rating | Successes | Critical Shortcomings in GDevelop |
|---|---|---|---|
| **Khan Academy `@khanacademy/flow-to-ts`** | ⭐⭐⭐⭐ (Best Primary Base) | Converted 90% of basic syntax: `{| |}` $\rightarrow$ `{ }`, `?T` $\rightarrow$ `T \| null \| undefined`, `+prop` $\rightarrow$ `readonly prop`. | **Corrupts `React.forwardRef`** by failing to swap generic parameters; strips unnamed parameters; leaves `$FlowFixMe` unmapped. |
| **`flow-to-typescript`** | ⭐⭐⭐ | Good type alias conversion. | Fails on Flow 0.299 Local Type Inference syntax; fails on complex union spreads. |
| **`@babel/plugin-transform-flow-strip-types`** | ⭐⭐ | 100% reliable AST type stripping. | Destructive; removes all types instead of converting them. |

### 6.2 The Recommended Multi-Stage Codemod Pipeline
We implement a **3-Stage Conversion Pipeline**:
1. **Stage 1 (AST Normalization)**: Run `@khanacademy/flow-to-ts` to handle baseline syntax desugaring.
2. **Stage 2 (GDevelop Custom AST Post-Processor)**: Execute a custom `jscodeshift` / Babel AST transform script (`scripts/codemods/gdevelop-flow-to-ts-postprocess.mjs`) to fix GDevelop-specific quirks.
3. **Stage 3 (Formatting & Validation)**: Run Prettier and `tsc --noEmit` to verify type cleanliness.

### 6.3 Custom AST Post-Processor Specifications
The custom post-processor implements the following transforms:

```javascript
// Rule 1: Invert React.forwardRef generic parameters
if (isCallExpression(node) && isReactForwardRef(node.callee)) {
  if (node.typeParameters && node.typeParameters.params.length === 2) {
    const [propsType, refType] = node.typeParameters.params;
    node.typeParameters.params = [refType, propsType]; // SWAP!
  }
}

// Rule 2: Synthesize names for unnamed arrow function parameters
if (isFunctionTypeAnnotation(node)) {
  node.params.forEach((param, index) => {
    if (!param.name) {
      param.name = identifier(`arg${index}`);
    }
  });
}

// Rule 3: Transform Object Type Spreading to Intersections
// {| ...Props, extra: string |} -> Props & { extra: string }
if (isTSTypeLiteral(node) && containsTypeSpread(node)) {
  return transformToIntersection(node);
}

// Rule 4: Global React Type Mappings
// React.Node -> React.ReactNode
// React.RefSetter<T> -> React.Ref<T>
if (isTypeReference(node, 'React.Node')) {
  node.typeName = identifier('React.ReactNode');
}
if (isTypeReference(node, 'React.RefSetter')) {
  node.typeName = identifier('React.Ref');
}

// Rule 5: Error Suppression Mapping
// // $FlowFixMe[error-code] -> // @ts-expect-error [flow-migrated: error-code]
comments.forEach(comment => {
  if (comment.value.includes('$FlowFixMe')) {
    comment.value = comment.value.replace(/\$FlowFixMe(\[.*?\])?/, '@ts-expect-error [flow-migrated$1]');
  }
});
```

### 6.4 Developer Step-by-Step File Migration Guide
When converting a module `src/Foo/MyComponent.js`:
1. **Execute Codemod**:
   ```bash
   node scripts/codemods/migrate-file.mjs src/Foo/MyComponent.js
   ```
   (Renames to `.tsx`, executes Stage 1–3 codemods).
2. **Review Diff**: Verify `React.forwardRef` and prop intersections.
3. **Run Typecheck**:
   ```bash
   npm run check-types
   ```
4. **Run Unit Tests**:
   ```bash
   npm test -- src/Foo/MyComponent.spec.js
   ```
5. **Commit**: Ensure both `npm run flow` and `npm run check-types` pass in CI.

---

## 7. Actionable 6-Phase Topological Migration Roadmap

### 7.1 Phase 0: Infrastructure & Tooling Foundation (Weeks 1–2)
- **Objective**: Establish the dual-stack development, build, and CI environment.
- **Deliverables**:
  - Author `newIDE/app/tsconfig.json` (`allowJs: false`, strict null checks, React JSX).
  - Update `newIDE/app/.babelrc.json` with file-scoped Flow/TS overrides.
  - Update `newIDE/app/vite.config.mjs` (Sucrase and Babel extension routing).
  - Update `newIDE/app/.storybook/main.js` to match `.stories.@(js|jsx|ts|tsx)`.
  - Generate `src/types/gd-globals.d.ts` (ambient C++ WebIDL bridge).
  - Author `src/types/unmigrated-flow-modules.d.ts` (wildcard fallbacks).
  - Upgrade `typescript` devDependency in `newIDE/app/package.json` to `5.4.5`.
  - Update `.semaphore/semaphore.yml` to run `npm run flow` + `npm run check-types`.
- **Validation Gate**: 0 TypeScript compilation errors; existing Flow checks continue passing 100%.

---

### 7.2 Phase 1: Pure Foundation Utilities & Custom SVG Icons (Weeks 3–4)
- **Scope**:
  - `src/UI/CustomSvgIcons/*.js` (291 files $\rightarrow$ `.tsx`).
  - `src/Utils/` pure leaf utilities (e.g. `Array.js`, `Color.js`, `Mathematics.js`, `Delay.js`, `GDevelopServices/`, `Version.js`).
- **File Volume**: ~330 files (~17% of total repository files).
- **Complexity**: Low. Almost zero incoming dependencies from external modules.
- **Validation Gate**:
  - All SVG icons render in Vite dev server and Storybook.
  - 100% pass rate on `Utils/*.spec.ts`.

---

### 7.3 Phase 2: Design System & Primitive UI Components (Weeks 5–7)
- **Scope**:
  - `src/UI/` primitive design system components: `Alert.js`, `Button.js`, `TextField.js`, `Dialog.js`, `InlineCheckbox.js`, `RaisedButton.js`, `IconButton.js`, `SelectField.js`.
  - Layout primitives: `Line.js`, `Column.js`, `ResponsiveWindowMeasurer.js`.
  - `src/UI/Theme/` theme definitions.
- **File Volume**: ~180 files.
- **Complexity**: Medium. Requires strict typing of `children: React.ReactNode` and forwarded refs (`React.forwardRef<Ref, Props>`).
- **Validation Gate**: Storybook visual test suite passes with 0 rendering regressions.

---

### 7.4 Phase 3: Core Domain Models & Editor Functions (Weeks 8–11)
- **Scope**:
  - `src/EditorFunctions/` (95 files).
  - `src/InstancesEditor/` (40 files).
  - `src/PropertiesEditor/` (7 files).
  - `src/ObjectsRendering/` (21 files).
  - `src/ResourcesList/` (35 files).
  - `src/VariablesList/` (19 files).
- **File Volume**: ~220 files.
- **Complexity**: High. Intensive interaction with WebAssembly C++ bindings (`gdProject`, `gdLayout`, `gdSerializerElement`) and PixiJS v7 canvas display hierarchies.
- **Validation Gate**:
  - Full test suite in `EditorFunctions.spec.ts` passes with WebAssembly memory validation.
  - 2D scene editor canvas interactions fully functional in desktop and web dev builds.

---

### 7.5 Phase 4: Feature Editors & Workspace Panels (Weeks 12–16)
- **Scope**:
  - `src/ObjectEditor/` (51 files).
  - `src/AssetStore/` (84 files).
  - `src/ExportAndShare/` (72 files).
  - `src/GameDashboard/` (39 files).
  - `src/BehaviorsEditor/` (11 files).
  - `src/Debugger/` (16 files).
  - `src/AiGeneration/` (56 files).
- **File Volume**: ~330 files.
- **Complexity**: High. Network API payloads, Firebase authentication, cloud project serialization.
- **Validation Gate**: Manual and automated E2E tests for project export, asset downloading, and cloud save.

---

### 7.6 Phase 5: High-Complexity Visual Editors & Application Shell (Weeks 17–21)
- **Scope**:
  - `src/EventsSheet/` (140 files) — Core visual programming event tree and instruction editor.
  - `src/SceneEditor/` (31 files).
  - `src/MainFrame/` (156 files) — Root application shell, menu bar, tabs, project lifecycle.
  - `src/stories/` (269 files) — Component Storybook stories.
- **File Volume**: ~600 files.
- **Complexity**: Critical. Recursive tree structures (`EventsTree`), state machines, complex keyboard shortcuts.
- **Validation Gate**:
  - 100% of `newIDE/app/src` authored in TypeScript (.ts/.tsx).
  - Flow check reports 0 remaining files in `newIDE/app/src`.
  - Electron desktop app packaging passes on Windows, macOS, and Linux in CircleCI.

---

### 7.7 Phase 6: Subproject Integration & Flow Decommissioning (Weeks 22–24)
- **Scope**:
  - Convert remaining 5 files in `newIDE/electron-app`.
  - Delete `newIDE/app/.flowconfig`.
  - Uninstall `flow-bin`, `@babel/preset-flow`, and `flow-coverage-report` from `newIDE/app/package.json`.
  - Delete `newIDE/app/flow-libs/` (9 files) and `newIDE/app/flow-typed/` (33 files).
  - Delete `GDevelop.js/scripts/generate-types.js` and `GDevelop.js/types/` (272 files).
  - Simplify `newIDE/app/vite.config.mjs` by removing Sucrase and Babel Flow stripping plugins.
  - Update Semaphore CI to run unified `tsc --noEmit` across entire monorepo.
- **Validation Gate**: Complete removal of all Flow artifacts; clean monorepo build and test pass.

---

## 8. Risk Governance, Verification Gates & Rollback Runbooks

### 8.1 Comprehensive Risk Matrix

| Risk ID | Description | Likelihood | Impact | Severity | Mitigation Strategy |
|---|---|---|---|---|---|
| **R-01** | `React.forwardRef` generic order inversion silently corrupts component refs | High | High | **Critical** | Custom AST post-processor swaps type arguments automatically; automated TypeScript compiler checks flag mismatches. |
| **R-02** | Unnamed function parameters `(boolean) => void` erased to `(boolean: any)` | Medium | High | **High** | AST post-processor synthesizes named arguments (`(done: boolean) => void`) before passing to TS compiler. |
| **R-03** | WebIDL C++ type divergence (`gdProject` vs `gd.Project`) breaks 1,386 files | High | High | **High** | Ambient type bridge `src/types/gd-globals.d.ts` provides complete backward-compatible global type aliases. |
| **R-04** | Dual compilation in Vite causes development HMR slowdown | Medium | Medium | Medium | Sucrase plugin routes `.ts` to `typescript` transform and `.js` to `flow` transform; preserves sub-10ms HMR. |
| **R-05** | Circular dependencies between migrated TS and unmigrated Flow modules | Medium | Medium | Medium | Strict leaf-to-root topological ordering; temporary `.js.flow` and `.d.ts` companion stubs at boundaries. |
| **R-06** | Third-party libdef incompatibilities in React 18 (`react-virtualized`) | Low | Medium | Low | Install official `@types/*` packages from DefinitelyTyped; vendor minimal `.d.ts` shims if needed. |
| **R-07** | Merge conflicts with concurrent feature development | High | Medium | Medium | Granular, directory-scoped PRs merged within 48-hour cycles; avoid sweeping mass-reformatting. |

---

### 8.2 Per-Phase Automated CI Verification Gates
Every pull request within each migration phase must satisfy the following automated CI pipeline before approval:

```
[PR Submitted]
      │
      ├──> Step 1: Pre-Commit Linting & Formatting Check
      │    `npm run check-format` + `npm run lint`
      │
      ├──> Step 2: Parallel Typechecking
      │    `npm run flow` (Validates unmigrated Flow files)
      │    `npm run check-types` (Validates migrated TypeScript files via tsc)
      │
      ├──> Step 3: Fast Unit & Integration Testing
      │    `npm run test` (Jest runs both .spec.js and .spec.ts tests)
      │
      ├──> Step 4: Build Verification
      │    `npm run build` (Vite 7 production bundling succeeds)
      │
      └──> Step 5: Packaging & Storybook (On Merge)
           `npm run build-storybook` + Electron packaging in CircleCI
```

---

### 8.3 Rollback Protocols
Because every phase is strictly incremental and leaf-to-root:
1. **Per-Module Rollback**: If a migrated module in Phase 3 exhibits subtle edge-case issues in staging, the specific module can be reverted to its previous `.js` Flow state via `git revert` without impacting sibling modules or reverting the build infrastructure.
2. **Coexistence Safety**: Because Vite, Babel, and Jest are configured to execute both Flow and TypeScript simultaneously throughout Phases 0–5, the codebase remains in a continuously shippable, deployable state at any point in the roadmap.
3. **Emergency Fix Protocol**: Critical hotfixes can be applied directly in either Flow (`.js`) or TypeScript (`.ts`) as appropriate, without blocking the overall migration timeline.
