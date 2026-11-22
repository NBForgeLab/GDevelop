import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import {
  FLOW_PARSER_PLUGINS,
  convertFlowAstToTsAst,
  generateFlowStub,
  unwrapFlowComments,
} from './flow-to-ts-ast.mjs';
import jscodeshiftTransform, {
  postprocessTypeScriptSource,
} from './gdevelop-flow-to-ts-postprocess.mjs';
import { migrateSingleFile } from './migrate-file.mjs';

const require = createRequire(
  new URL('../../newIDE/app/package.json', import.meta.url)
);
const parser = require('@babel/parser');
const ts = require('typescript');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

function parseAsTypeScript(code, isTsx = true) {
  const sf = ts.createSourceFile(
    isTsx ? 'test.tsx' : 'test.ts',
    code,
    ts.ScriptTarget.Latest,
    true,
    isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  assert.equal(
    sf.parseDiagnostics.length,
    0,
    `TS parseDiagnostics: ${sf.parseDiagnostics
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' '))
      .join('; ')}`
  );
  return parser.parse(code, {
    sourceType: 'module',
    plugins: isTsx ? ['typescript', 'jsx'] : ['typescript'],
  });
}

test('Stage 1 converts core Flow syntax, spreads, indexers, maybe types, and casts', () => {
  const flowSource = `// @flow
export type BaseProps = {|
  +id: string,
  'aria-label'?: ?string,
|};

export type Props = {|
  ...BaseProps,
  tutorials: ?Array<string>,
  onDone: (boolean, ?string) => void,
  onOrder: (first?: string, second: number) => void,
|};

type CommandMap = { [CommandName]: string };
type DynamicMap = { [string]: number };

export interface Manager {
  get(id: string): ?Props;
  opt?: () => void;
}

export default class ConcreteManager implements Manager {
  get(id: string): ?Props {
    return ((null: any): Props);
  }
}

export const identity = <T>(x: T): T => x;
const view = <div />;
`;

  const res = convertFlowAstToTsAst(flowSource);
  assert.equal(res.hasJsx, true);

  // Valid TS/TSX parse
  parseAsTypeScript(res.code, true);

  assert.match(res.code, /readonly id: string;/);
  assert.match(res.code, /["']aria-label["']\?: string \| null;/);
  assert.match(res.code, /BaseProps & \{/);
  assert.match(res.code, /tutorials: Array<string> \| null \| undefined;/);
  assert.match(
    res.code,
    /onDone: \(arg0: boolean, arg1: string \| null \| undefined\) => void;/
  );
  assert.match(
    res.code,
    /onOrder: \(first: string \| undefined, second: number\) => void;/
  );
  assert.match(res.code, /\[key in CommandName\]: string;/);
  assert.match(res.code, /\[key: string\]: number;/);
  assert.match(res.code, /interface Manager/);
  assert.match(res.code, /opt\?: \(\) => void;/);
  assert.match(res.code, /implements Manager/);
  assert.match(res.code, /as any as Props/);
  assert.match(res.code, /<T extends unknown>/);
});

test('Stage 1 unwraps Flow comment annotations cleanly', () => {
  const source = `// @flow
let modulePromise /*: ?Promise<string> */ = null;
const fn = /*:: <T> */ (x /*: string */, cb /*: (number) => T */) /*: T */ => cb(x.length);
const literal = "/*: not a flow comment */";
`;
  const unwrapped = unwrapFlowComments(source);
  assert.equal(unwrapped.hadFlowComments, true);
  assert.ok(unwrapped.code.includes('"/*: not a flow comment */"'));

  const converted = convertFlowAstToTsAst(source);
  parseAsTypeScript(converted.code, false);
  assert.match(
    converted.code,
    /let modulePromise: Promise<string> \| null \| undefined\s+= null;/
  );
  assert.match(converted.code, /\(arg0: number\) => T/);
  assert.ok(converted.code.includes('"/*: not a flow comment */"'));
  assert.ok(!converted.code.replace('"/*: not a flow comment */"', '').includes('*/'));
});

test('Stage 1 handles TypeCastExpression inside tight precedence positions', () => {
  const source = `// @flow
const a = (x: any).foo;
const b = (fn: any)(1);
const c = () => ({}: any);
`;
  const converted = convertFlowAstToTsAst(source);
  parseAsTypeScript(converted.code, false);
  assert.match(converted.code, /\(+x as any\)+\.foo/);
  assert.match(converted.code, /\(+fn as any\)+\(1\)/);
  assert.match(converted.code, /\(\) => \(+\{\} as any\)+/);
});

test('Stage 2 swaps React.forwardRef generics idempotently and cleans memo/ComponentType wrappers', () => {
  const flowConverted = `// @flow
import * as React from 'react';
type Props = { name: string };
type MyInterface = { focus: () => void };

export const CompA: React.ComponentType<Props & { readonly ref?: React.RefSetter<MyInterface> }> =
  React.forwardRef<Props, MyInterface>((props: Props, ref) => <div />);

export const CompB: React.ComponentType<Props> = React.memo<Props>(
  React.forwardRef<Props, MyInterface>((props: Props, ref) => <div />)
);

export default (React.forwardRef<Props, MyInterface>((props: Props, ref) => <div />) as React.ComponentType<Props>);
`;

  const pass1 = postprocessTypeScriptSource(flowConverted, {
    swapForwardRef: true,
    useJsx: true,
  });
  parseAsTypeScript(pass1.code, true);
  assert.equal(pass1.stats.forwardRefsSwapped, 3);
  assert.equal(pass1.stats.memoTypeArgsRemoved, 1);
  assert.equal(pass1.stats.forwardRefComponentTypeStripped, 3);
  assert.ok(!pass1.code.includes('// @flow'));
  assert.ok(
    pass1.code.includes('React.forwardRef<MyInterface, Props>('),
    'forwardRef generics must be <Ref, Props>'
  );
  assert.ok(!pass1.code.includes('React.memo<Props>'));

  // Idempotency check in default 'auto' mode: running again must NOT invert back!
  const pass2 = postprocessTypeScriptSource(pass1.code, {
    swapForwardRef: 'auto',
    useJsx: true,
  });
  assert.equal(pass2.stats.forwardRefsSwapped, 0);
  assert.equal(pass2.code, pass1.code);
});

test('Stage 2 synthesizes unnamed parameters, maps React/Flow types, and maps suppressions', () => {
  const rawTs = `/**
 * File description
 * @flow
 */
import { type Node } from 'react';
import { type $AxiosError } from 'axios';

const gd: libGDevelop = global.gd;

type Helper = {
  a: React.Node;
  b: Node;
  c: React.MixedElement;
  d: React.Element<typeof Foo>;
  e: React.RefSetter<HTMLDivElement>;
  f: SyntheticDragEvent<HTMLElement>;
  g: TimeoutID;
  h: IntervalID;
  i: AnimationFrameID;
  j: JestMockFn<[string], boolean>;
  k: $Keys<typeof map>;
  l: $Shape<Helper>;
  m: $ReadOnlyArray<string>;
  n: $ReadOnly<{ x: number }>;
  o: $Exact<Helper>;
  p: Class<MyClass>;
  q: mixed;
  r: empty;
  s: Object;
  style?: Object;
  t: Function;
  u: $AxiosError<any>;
  v: React$Portal;
  cb: (boolean, BundleListingData, string?) => void;
};

// $FlowFixMe[incompatible-type] legacy mismatch
const err = 1;
// $FlowIgnore
const ignored = 2;
`;

  const res = postprocessTypeScriptSource(rawTs, {
    swapForwardRef: 'auto',
    useJsx: false,
  });
  parseAsTypeScript(res.code, false);

  assert.ok(!res.code.includes('@flow'));
  assert.ok(res.code.includes('File description'));
  assert.match(res.code, /import \{ type ReactNode \} from ['"]react['"]/);
  assert.match(res.code, /import \{ type AxiosError \} from ['"]axios['"]/);
  assert.match(res.code, /import type \* as React from ['"]react['"]/);
  assert.match(res.code, /const gd: libGDevelop = \(global as any\)\.gd;/);
  assert.match(res.code, /a: React\.ReactNode;/);
  assert.match(res.code, /b: ReactNode;/);
  assert.match(res.code, /c: React\.ReactElement<any>;/);
  assert.match(res.code, /d: React\.ReactElement<any, typeof Foo>;/);
  assert.match(res.code, /e: React\.Ref<HTMLDivElement>;/);
  assert.match(res.code, /f: React\.DragEvent<HTMLElement>;/);
  assert.match(res.code, /g: ReturnType<typeof setTimeout>;/);
  assert.match(res.code, /h: ReturnType<typeof setInterval>;/);
  assert.match(res.code, /i: number;/);
  assert.match(res.code, /j: jest\.Mock<boolean, \[string\]>;/);
  assert.match(res.code, /k: keyof typeof map;/);
  assert.match(res.code, /l: Partial<Helper>;/);
  assert.match(res.code, /m: ReadonlyArray<string>;/);
  assert.match(res.code, /n: Readonly<\{ x: number \}>;/);
  assert.match(res.code, /o: Helper;/);
  assert.match(res.code, /p: typeof MyClass;/);
  assert.match(res.code, /q: unknown;/);
  assert.match(res.code, /r: never;/);
  assert.match(res.code, /s: Record<string, any>;/);
  assert.match(res.code, /style\?: React\.CSSProperties;/);
  assert.match(res.code, /t: \(\.\.\.args: Array<any>\) => any;/);
  assert.match(res.code, /u: AxiosError;/);
  assert.match(res.code, /v: React\.ReactPortal;/);
  assert.match(
    res.code,
    /cb: \(arg0: boolean, bundleListingData: BundleListingData, arg2\?: string\) => void;/
  );
  assert.match(
    res.code,
    /\/\/ @ts-expect-error \[flow-migrated: incompatible-type\] legacy mismatch/
  );
  assert.match(res.code, /\/\/ @ts-expect-error \[flow-migrated\]/);

  // Also test jscodeshift default export (returns undefined when already idempotent/unmodified, transformed code when changed)
  const jscodeshiftIdempotent = jscodeshiftTransform(
    { path: 'sample.ts', source: res.code },
    {},
    {}
  );
  assert.equal(jscodeshiftIdempotent, undefined);
  const jscodeshiftChanged = jscodeshiftTransform(
    { path: 'sample.ts', source: rawTs },
    {},
    {}
  );
  assert.equal(jscodeshiftChanged, res.code);
});

test('Stage 2 converts non-mutated useRef(null as ?T) to RefObject while keeping mutable refs', () => {
  const src = `// @flow
import * as React from 'react';
const Comp = () => {
  const domRef = React.useRef((null: ?HTMLDivElement));
  const timerRef = React.useRef((null: ?TimeoutID));
  timerRef.current = setTimeout(() => {}, 10);
  return <div ref={domRef} />;
};
`;
  const stage1 = convertFlowAstToTsAst(src);
  const stage2 = postprocessTypeScriptSource(stage1.code, {
    swapForwardRef: true,
    useJsx: true,
  });
  parseAsTypeScript(stage2.code, true);
  assert.match(stage2.code, /const domRef = React\.useRef<HTMLDivElement \| null>\(null\);/);
  assert.match(
    stage2.code,
    /const timerRef = React\.useRef\(\(?null as ReturnType<typeof setTimeout> \| null \| undefined\)?\);/
  );
});

test('Stage 1 generateFlowStub produces valid Flow declaration stub with pruned imports', () => {
  const src = `// @flow
import * as React from 'react';
import { type Unused } from './Unused';
import { type UsedType } from './Used';

export type Props = {|
  item: UsedType,
  children?: React.Node,
|};

export const helper = (a: string): number => a.length;
export default React.forwardRef<Props, HTMLDivElement>((props, ref) => <div />);
`;
  const stub = generateFlowStub(src, { phase: 2 });
  assert.match(stub.code, /^\/\/ @flow\n\/\/ @flow-transitional-stub \[Phase 2\]/);
  assert.ok(stub.code.includes("import * as React from 'react';"));
  assert.ok(stub.code.includes("import { type UsedType } from './Used';"));
  assert.ok(!stub.code.includes('Unused'));
  assert.match(stub.code, /declare export var helper: \(a: string\) => number;/);
  assert.match(
    stub.code,
    /declare export default React\.ComponentType<\{ \.\.\.Props, \+ref\?: React\.RefSetter<HTMLDivElement> \}>;/
  );
});

test('Stage 3 migrateSingleFile handles write-mode rename, snapshot rename, companion .d.ts cleanup, and .js.flow stub', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gd-codemod-test-'));
  try {
    const compPath = path.join(tmpDir, 'MyWidget.js');
    const compDtsPath = path.join(tmpDir, 'MyWidget.d.ts');
    const specPath = path.join(tmpDir, 'MyWidget.spec.js');
    const snapPath = path.join(tmpDir, 'MyWidget.spec.js.snap');

    fs.writeFileSync(
      compPath,
      `// @flow
import * as React from 'react';
type Props = {| label: string |};
export const MyWidget = ({ label }: Props): React.Node => <span>{label}</span>;
`,
      'utf8'
    );
    fs.writeFileSync(compDtsPath, 'export const MyWidget: any;\n', 'utf8');
    fs.writeFileSync(
      specPath,
      `// @flow
import * as React from 'react';
import { MyWidget } from './MyWidget';
const el = <MyWidget label="hi" />;
`,
      'utf8'
    );
    fs.writeFileSync(snapPath, '// Jest Snapshot v1\n', 'utf8');

    const compResult = await migrateSingleFile(compPath, {
      useTsc: false,
      flowStubMode: 'always',
      phase: 2,
    });
    assert.equal(compResult.targetPath, path.join(tmpDir, 'MyWidget.tsx'));
    assert.equal(fs.existsSync(compPath), false);
    assert.equal(fs.existsSync(compDtsPath), false);
    assert.equal(fs.existsSync(compResult.targetPath), true);
    assert.equal(fs.existsSync(path.join(tmpDir, 'MyWidget.js.flow')), true);

    const specResult = await migrateSingleFile(specPath, {
      useTsc: false,
      flowStubMode: 'never',
    });
    assert.equal(specResult.targetPath, path.join(tmpDir, 'MyWidget.spec.tsx'));
    assert.equal(fs.existsSync(specPath), false);
    assert.equal(fs.existsSync(snapPath), false);
    assert.equal(
      fs.existsSync(path.join(tmpDir, 'MyWidget.spec.tsx.snap')),
      true
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Stage 2 CLI --stdout works and handles TSFunctionType unnamed optional parameters', () => {
  const input = `// @flow
type Fn = (boolean, BundleListingData) => void;
type OptFn = (string?) => void;
`;
  const res = postprocessTypeScriptSource(input, { useJsx: false });
  parseAsTypeScript(res.code, false);
  assert.match(
    res.code,
    /type Fn = \(arg0: boolean, bundleListingData: BundleListingData\) => void;/
  );
  assert.match(res.code, /type OptFn = \(arg0\?: string\) => void;/);

  const cliOut = execFileSync(
    process.execPath,
    [
      path.join(REPO_ROOT, 'scripts/codemods/gdevelop-flow-to-ts-postprocess.mjs'),
      '--stdout',
      path.join(REPO_ROOT, 'newIDE/app/src/UI/FlatButton.tsx'),
    ],
    { cwd: REPO_ROOT, encoding: 'utf8' }
  );
  // Idempotent on an already-migrated forwardRef component
  assert.match(cliOut, /React\.forwardRef<HTMLButtonElement, FlatButtonProps>/);
});

test('Stage 2 preserves valid TS syntax for global.gd LHS/member/new and TSFunctionType return replacements', () => {
  const input = `// @flow
type Api = {|
  getRef: (name: string) => React.ElementRef<any>,
  getTimer: () => TimeoutID,
  getUnknown: () => mixed,
|};
global.gd = mockGd;
const v = new global.gd.Variable();
const p = global.gd.ProjectHelper.createNewGDJSProject();
`;
  const s1 = convertFlowAstToTsAst(input);
  const s2 = postprocessTypeScriptSource(s1.code, { swapForwardRef: true, useJsx: s1.hasJsx });
  parseAsTypeScript(s2.code, false);

  assert.match(s2.code, /getRef: \(name: string\) => any;/);
  assert.match(s2.code, /getTimer: \(\) => ReturnType<typeof setTimeout>;/);
  assert.match(s2.code, /getUnknown: \(\) => unknown;/);
  assert.match(s2.code, /\(global as any\)\.gd = mockGd;/);
  assert.match(s2.code, /new \(\(global as any\)\.gd as libGDevelop\)\.Variable\(\)/);
  assert.match(s2.code, /\(\(global as any\)\.gd as libGDevelop\)\.ProjectHelper\.createNewGDJSProject\(\)/);
});

test('End-to-end CLI dry-run succeeds with 0 tsc errors on self-contained Flow fixtures', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gd-codemod-cli-'));
  try {
    const leafFile = path.join(tmpDir, 'CleanLeaf.js');
    const jsxFile = path.join(tmpDir, 'Widget.js');

    fs.writeFileSync(
      leafFile,
      `// @flow
export const sanitize = (name: string): string => name.trim();
export const makePairs = <T>(items: Array<T>): Array<[T, number]> =>
  items.map((item, idx) => [item, idx]);
`,
      'utf8'
    );
    fs.writeFileSync(
      jsxFile,
      `// @flow
type Props = {| label: string |};
type WidgetRef = {| focus: () => void |};
declare var React: {
  forwardRef: <P, R>(fn: (props: P, ref: any) => any) => any,
};
export default React.forwardRef<Props, WidgetRef>((props, ref) => (
  <div>{props.label}</div>
));
`,
      'utf8'
    );

    const out = execFileSync(
      process.execPath,
      [
        path.join(REPO_ROOT, 'scripts/codemods/migrate-file.mjs'),
        '--dry-run',
        '--strict-tsc',
        leafFile,
      ],
      { cwd: REPO_ROOT, encoding: 'utf8' }
    );
    assert.match(out, /CleanLeaf\.js -> .*CleanLeaf\.ts/);

    const jsxOut = execFileSync(
      process.execPath,
      [
        path.join(REPO_ROOT, 'scripts/codemods/migrate-file.mjs'),
        '--dry-run',
        '--no-tsc',
        jsxFile,
      ],
      { cwd: REPO_ROOT, encoding: 'utf8' }
    );
    assert.match(jsxOut, /Widget\.js -> .*Widget\.tsx \(forwardRefSwapped=1/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('End-to-end CLI dry-run prunes unneeded @ts-expect-error [flow-migrated] directives and preserves human reasons', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gd-codemod-prune-'));
  try {
    const file = path.join(tmpDir, 'PruneTarget.js');
    fs.writeFileSync(
      file,
      `// @flow
export const run = (items: Array<string>): number => {
  // $FlowFixMe[incompatible-type]
  const n: number = items.length;
  // $FlowIgnore - cannot be empty in practice.
  const first: string | undefined = items[0];
  return first ? n : 0;
};
`,
      'utf8'
    );

    const out = execFileSync(
      process.execPath,
      [
        path.join(REPO_ROOT, 'scripts/codemods/migrate-file.mjs'),
        '--dry-run',
        '--strict-tsc',
        file,
      ],
      { cwd: REPO_ROOT, encoding: 'utf8' }
    );
    assert.match(
      out,
      /PruneTarget\.js -> .*PruneTarget\.ts .*suppressions=2, prunedUnused=2/
    );

    const stdoutCode = execFileSync(
      process.execPath,
      [
        path.join(REPO_ROOT, 'scripts/codemods/migrate-file.mjs'),
        '--stdout',
        file,
      ],
      { cwd: REPO_ROOT, encoding: 'utf8' }
    );
    assert.ok(!stdoutCode.includes('@ts-expect-error'));
    assert.ok(stdoutCode.includes('// cannot be empty in practice.'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Stage 1 + Stage 2 prevent <// TSX lexer collisions, preserve forwardRef type-arg comments, and map import { type Element } from react', () => {
  const fixtures = [
    {
      name: 'angle-bracket-comment',
      src: `// @flow
import * as React from 'react';
export const Demo = () => {
  const [val, setVal] = React.useState<// $FlowFixMe[incompatible-type]
    ?string>(null);
  return <div>{val}</div>;
};
`,
    },
    {
      name: 'forwardRef-with-comments',
      src: `// @flow
import * as React from 'react';
type BoxSearchResultsInterface = {| focus: () => void |};
type Props<T> = {| items: Array<T> |};
type SearchItem = {| id: string |};
export default React.forwardRef<
  // $FlowFixMe[incompatible-type] - generic props workaround
  // $FlowFixMe[cannot-resolve-name]
  Props<SearchItem>,
  BoxSearchResultsInterface
>((props, ref) => <div />);
`,
    },
    {
      name: 'react-element-import',
      src: `// @flow
import React, { Component, type Element } from 'react';
let App: ?Element<any>;
export class Root extends Component<{}> {
  render() {
    return App;
  }
}
`,
    },
  ];

  for (const { name, src } of fixtures) {
    const s1 = convertFlowAstToTsAst(src);
    assert.ok(!s1.code.includes('<//'), `${name} Stage 1 must not contain <//`);
    parseAsTypeScript(s1.code, s1.hasJsx);

    const s2 = postprocessTypeScriptSource(s1.code, {
      swapForwardRef: true,
      useJsx: s1.hasJsx,
    });
    assert.ok(!s2.code.includes('<//'), `${name} Stage 2 must not contain <//`);
    parseAsTypeScript(s2.code, s1.hasJsx);

    if (name === 'forwardRef-with-comments') {
      assert.match(
        s2.code,
        /React\.forwardRef<\s*BoxSearchResultsInterface,\s*\/\/ @ts-expect-error \[flow-migrated: incompatible-type\][^\n]*\s*\/\/ @ts-expect-error \[flow-migrated: cannot-resolve-name\]\s*Props<SearchItem>\s*>/
      );
    }
    if (name === 'react-element-import') {
      assert.match(
        s2.code,
        /import React, \{ Component, type ReactElement \} from ['"]react['"];/
      );
      assert.match(
        s2.code,
        /App: ReactElement<any> \| null \| undefined;/
      );
    }
  }
});

test('Stage 1 generateFlowStub handles export *, classes with methods/props, TypeCastExpression, unannotated forwardRef/memo, local export specifiers, and transitive local types', () => {
  const src = `// @flow
import * as React from 'react';
import { type ExternalDep } from './ExternalDep';
import { type UnusedDep } from './UnusedDep';

export * from './ReExportedModule';

type SubConfig = {|
  dep: ExternalDep,
|};

type LocalProps = {|
  config: SubConfig,
  label: string,
|};

interface RunnerInterface {
  run(id: string): boolean;
}

export class NamedService implements RunnerInterface {
  +name: string;
  count: number = 0;
  run(id: string): boolean {
    return true;
  }
  arrowMethod = (flag?: boolean): Promise<void> => Promise.resolve();
}

const MyComponent = ({ config, label }: LocalProps): React.Node => <div />;
export { MyComponent };
export default (React.memo<LocalProps>(MyComponent): React.ComponentType<LocalProps>);
`;

  const stub = generateFlowStub(src, { phase: 3 });
  assert.ok(stub.code.includes("import * as React from 'react';"));
  assert.ok(stub.code.includes("import { type ExternalDep } from './ExternalDep';"));
  assert.ok(!stub.code.includes('UnusedDep'));
  assert.ok(stub.code.includes("export * from './ReExportedModule';"));
  assert.ok(stub.code.includes('type SubConfig = {|'));
  assert.ok(stub.code.includes('type LocalProps = {|'));
  assert.ok(stub.code.includes('interface RunnerInterface {'));
  assert.match(
    stub.code,
    /declare export class NamedService implements RunnerInterface \{\s*\+name: string;\s*count: number;\s*run\(id: string\): boolean;\s*arrowMethod: \(flag\?: boolean\) => Promise<void>;\s*\}/
  );
  assert.match(
    stub.code,
    /declare export var MyComponent: React\.ComponentType<LocalProps>;/
  );
  assert.match(
    stub.code,
    /declare export default React\.ComponentType<LocalProps>;/
  );

  // Also test export default class with methods & unannotated forwardRef
  const classDefaultSrc = `// @flow
type Item = {| id: string |};
export default class DataStore {
  items: Array<Item>;
  get(id: string): ?Item {
    return null;
  }
}
`;
  const classStub = generateFlowStub(classDefaultSrc, { phase: 3 });
  assert.ok(classStub.code.includes('type Item = {| id: string |};'));
  assert.match(
    classStub.code,
    /declare export default class DataStore \{\s*items: Array<Item>;\s*get\(id: string\): \?Item;\s*\}/
  );

  const unannotatedForwardRefSrc = `// @flow
import * as React from 'react';
type ButtonProps = {| title: string |};
export default React.forwardRef(({ title }: ButtonProps, ref) => <button ref={ref}>{title}</button>);
`;
  const forwardRefStub = generateFlowStub(unannotatedForwardRefSrc, { phase: 2 });
  assert.ok(forwardRefStub.code.includes('type ButtonProps = {| title: string |};'));
  assert.match(
    forwardRefStub.code,
    /declare export default React\.ComponentType<ButtonProps>;/
  );
});

test('Stage 1 generateFlowStub handles typeof localConst ($Keys/$Values), unexported local classes, generic default functions/components, and top-level/return suppressions', () => {
  const typeofSrc = `// @flow
const localEnumObject = {
  ALPHA: 'alpha',
  BETA: 'beta',
};
export const exportedAreaMap = {
  GENERAL: ('General': any),
  SCENE: ('Scene': any),
};
export type LocalEnumKey = $Keys<typeof localEnumObject>;
export type LocalEnumVal = $Values<typeof localEnumObject>;
export type ExportedAreaKey = $Keys<typeof exportedAreaMap>;
`;
  const typeofStub = generateFlowStub(typeofSrc, { phase: 2 });
  parser.parse(typeofStub.code, {
    sourceType: 'module',
    plugins: FLOW_PARSER_PLUGINS,
  });
  assert.match(
    typeofStub.code,
    /declare var localEnumObject: \{\| ALPHA: "alpha", BETA: "beta" \|\};/
  );
  assert.match(
    typeofStub.code,
    /declare export var exportedAreaMap: \{\| GENERAL: any, SCENE: any \|\};/
  );

  const edgeStubFixtures = [
    {
      name: 'unexported-local-class',
      src: `// @flow
class UrlsCache {
  get(key: string): ?string { return null; }
}
export default class Loader {
  static _cache: UrlsCache;
}
`,
    },
    {
      name: 'generic-default-component',
      src: `// @flow
import * as React from 'react';
type Props<TabName: string> = {| current: TabName |};
const Switcher = <TabName: string>({ current }: Props<TabName>): React.Node => <div>{current}</div>;
export default Switcher;
`,
    },
    {
      name: 'generic-class-component',
      src: `// @flow
import * as React from 'react';
type Props<Item> = {| items: Array<Item> |};
export default class SortableVirtualizedItemList<Item> extends React.Component<Props<Item>> {
  focus(): void {}
  render() { return null; }
}
`,
    },
    {
      name: 'return-suppression-fn',
      src: `// @flow
class RenderedIconInstance {}
export default function makeRenderer(
  iconPath: string
  // $FlowFixMe[cannot-resolve-name]
): typeof RenderedIconInstance {
  return RenderedIconInstance;
}
`,
    },
    {
      name: 'top-level-var-suppression',
      src: `// @flow
// $FlowFixMe[cannot-resolve-name]
export const apiClient: Axios = (null: any);
`,
    },
  ];

  for (const { name, src } of edgeStubFixtures) {
    const stub = generateFlowStub(src, { phase: 2 });
    parser.parse(stub.code, {
      sourceType: 'module',
      plugins: FLOW_PARSER_PLUGINS,
    });

    if (name === 'unexported-local-class') {
      assert.match(stub.code, /declare class UrlsCache \{/);
    }
    if (name === 'generic-default-component') {
      assert.match(
        stub.code,
        /declare export default \(<TabName: string>\(arg0: Props<TabName>\) => React\.Node\);/
      );
    }
    if (name === 'generic-class-component') {
      assert.match(
        stub.code,
        /declare export default class SortableVirtualizedItemList<Item> extends React\.Component<Props<Item>> \{/
      );
      assert.ok(stub.code.includes('focus(): void;'));
      assert.ok(!stub.code.includes('render('));
    }
    if (name === 'return-suppression-fn') {
      assert.match(
        stub.code,
        /\/\/ \$FlowFixMe\[cannot-resolve-name\]\ndeclare export default function makeRenderer\(iconPath: string\): typeof RenderedIconInstance;/
      );
    }
    if (name === 'top-level-var-suppression') {
      assert.match(
        stub.code,
        /\/\/ \$FlowFixMe\[cannot-resolve-name\]\ndeclare export var apiClient: Axios;/
      );
    }
  }
});

test('Stage 1 + Stage 2 synthesize : any for $FlowFixMe[missing-local-annot] parameters/properties and convert useRef<?T>(null)', () => {
  const src = `// @flow
import * as React from 'react';

// $FlowFixMe[missing-local-annot]
const stopPropagation = e => e.stopPropagation();

const renderItems = (items: Array<any>) =>
  items.map(
    // $FlowFixMe[missing-local-annot]
    ({
      key: functionCallKey,
      messageContent,
    }) => <div key={functionCallKey}>{messageContent}</div>
  );

const sendFeedback = async (
  // $FlowFixMe[missing-local-annot]
  aiRequestId,
  // $FlowFixMe[missing-local-annot]
  messageIndex
) => {
  const inputRef = React.useRef<?HTMLInputElement>(null);
  return <input ref={inputRef} data-id={aiRequestId} data-idx={messageIndex} />;
};

class MyDebugger extends React.Component<any, any> {
  // $FlowFixMe[missing-local-annot]
  state = {
    selectedItem: null,
  };
}
`;
  const s1 = convertFlowAstToTsAst(src);
  const s2 = postprocessTypeScriptSource(s1.code, {
    swapForwardRef: true,
    useJsx: s1.hasJsx,
  });
  parseAsTypeScript(s2.code, true);

  assert.match(s2.code, /const stopPropagation = \(e: any\) => e\.stopPropagation\(\);/);
  assert.match(
    s2.code,
    /\(\s*\{\s*key: functionCallKey,\s*messageContent,?\s*\}: any\s*\) =>/
  );
  assert.match(
    s2.code,
    /async \(\s*aiRequestId: any,\s*messageIndex: any\s*\) =>/
  );
  assert.match(
    s2.code,
    /const inputRef = React\.useRef<HTMLInputElement \| null>\(null\);/
  );
  assert.match(s2.code, /state: any = \{/);
  assert.ok(
    !s2.code.includes('missing-local-annot'),
    'Consumed missing-local-annot suppressions should not remain as unused @ts-expect-error directives'
  );
});

test('Stage 1 generateFlowStub infers exported arrow functions, void blocks, React helper guards, forwardRef Ref, class components, destructured exports, import typeof, and pure LF', () => {
  const src = [
    '// @flow',
    "import { Component } from 'react';",
    "import typeof { FooService, UnusedService } from './Services';",
    '',
    'type Props = {| title: string |};',
    'type State = {| open: boolean |};',
    'type RefApi = {| focus: () => void |};',
    'const baseFactor: number = 2;',
    'export const zoomInFactor = baseFactor;',
    'export const safelyDo = async <T>(fn: () => Promise<T>): Promise<T> => fn();',
    'export const openUrl = (url: string) => { console.log(url); };',
    'export const implicitExpr = (x: number) => x + 1;',
    'export const create = (props: Props): React.Node => null;',
    'export const renderIcon = (name: string, size: number): React.Node => null;',
    'export const Widget = ({ title }: Props): React.Node => null;',
    'export const ForwardedWidget = React.forwardRef<Props, RefApi>((props, ref) => null);',
    'export const { destructuredA, destructuredB } = (null: any);',
    'export const svcRef: FooService = (null: any);',
    'class LocalHelper { ping(x: string) { console.log(x); } }',
    'export { LocalHelper };',
    'export default class Panel extends Component<Props, State> {',
    '  state = { open: false };',
    '  focus() { console.log("focus"); }',
    '  static defaultProps = { title: "hi" };',
    '  render() { return null; }',
    '}',
  ].join('\r\n');

  const stub = generateFlowStub(src, { phase: 1 });
  assert.ok(!stub.code.includes('\r'), 'Stub must use pure LF line endings');
  parser.parse(stub.code, {
    sourceType: 'module',
    plugins: FLOW_PARSER_PLUGINS,
  });

  // React namespace import auto-injected because source only had named `{ Component }`
  assert.ok(stub.code.includes("import * as React from 'react';"));
  // Partial `import typeof` preserves `typeof`
  assert.ok(stub.code.includes("import typeof { FooService } from './Services';"));
  assert.ok(!stub.code.includes('UnusedService'));

  assert.ok(stub.code.includes('declare export var zoomInFactor: number;'));
  assert.ok(
    stub.code.includes(
      'declare export var safelyDo: <T>(fn: () => Promise<T>) => Promise<T>;'
    )
  );
  // Void block vs expression-body arrow
  assert.ok(
    stub.code.includes('declare export var openUrl: (url: string) => void;')
  );
  assert.ok(
    stub.code.includes('declare export var implicitExpr: (x: number) => any;')
  );
  // Lowercase & multi-arg React.Node helpers MUST stay callable function types, NOT ComponentType
  assert.ok(
    stub.code.includes('declare export var create: (props: Props) => React.Node;')
  );
  assert.ok(
    stub.code.includes(
      'declare export var renderIcon: (name: string, size: number) => React.Node;'
    )
  );
  // PascalCase 1-arg component emits ComponentType<Props>
  assert.ok(
    stub.code.includes('declare export var Widget: React.ComponentType<Props>;')
  );
  // forwardRef preserves Ref type parameter via Flow 0.299 RefSetter
  assert.ok(
    stub.code.includes(
      'declare export var ForwardedWidget: React.ComponentType<{ ...Props, +ref?: React.RefSetter<RefApi> }>;'
    )
  );
  // Destructured export preserved
  assert.ok(stub.code.includes('declare export var destructuredA: any;'));
  assert.ok(stub.code.includes('declare export var destructuredB: any;'));
  // Local class exported via `export { LocalHelper }`
  assert.match(
    stub.code,
    /declare export class LocalHelper \{\s*ping\(x: string\): void;\s*\}/
  );
  // Class component preserves ref methods & static defaultProps, omits unannotated state & render
  assert.match(
    stub.code,
    /declare export default class Panel extends Component<Props, State> \{/
  );
  assert.ok(stub.code.includes('focus(): void;'));
  assert.ok(stub.code.includes('static defaultProps: {| title: "hi" |};'));
  assert.ok(!stub.code.includes('state:'));
  assert.ok(!stub.code.includes('render('));

  // DOM `Node` return type without React import must NOT become React.ComponentType
  const domSrc = `// @flow
export const GetDomNode = (el: HTMLElement): Node => el;
`;
  const domStub = generateFlowStub(domSrc, { phase: 1 });
  assert.ok(!domStub.code.includes('React'));
  assert.ok(
    domStub.code.includes(
      'declare export var GetDomNode: (el: HTMLElement) => Node;'
    )
  );

  // `export const a = ...; export default a;` and inline anonymous superclass safety
  const reExportDefaultSrc = `// @flow
export const primary = (x: string): number => x.length;
export default primary;
export class Wrapped extends class { run() {} } {
  ping() {}
}
`;
  const reExportStub = generateFlowStub(reExportDefaultSrc, { phase: 1 });
  parser.parse(reExportStub.code, {
    sourceType: 'module',
    plugins: FLOW_PARSER_PLUGINS,
  });
  assert.ok(
    reExportStub.code.includes('declare export default (x: string) => number;')
  );
  assert.match(reExportStub.code, /declare export class Wrapped \{\s*ping\(\): void;\s*\}/);
});

test('Stage 1 + Stage 2 handle trailing type comments without semicolon corruption, numeric object keys, non-return void, typeof undefined, interface extends, $Keys/$Values precedence, and styles: Object', () => {
  const src = `// @flow
type Operator = {
  arity: number, // Needed by evalReversePolishNotation()
  0: string,
  1?: number,
};

type ExtendedIface = interface extends BaseA, BaseB {
  extra: string,
};

type MaybeVoid = string | void;
type MaybeTypeofUndef = string | typeof undefined;
type UnionKeys = $Keys<A | B>;
type KeysArray = $Keys<Foo>[];
type UnionValues = $Values<A | B>;
type StyleProps = {
  style: Object,
  styles: Object,
};

export const asyncVoid = async (): Promise<void> => {};
export const cb: (x: string | void) => void = () => {};
`;

  const s1 = convertFlowAstToTsAst(src);
  const s2 = postprocessTypeScriptSource(s1.code, {
    swapForwardRef: true,
    useJsx: s1.hasJsx,
  });
  parseAsTypeScript(s2.code, false);

  assert.ok(
    !s2.code.includes('evalReversePolishNotation();'),
    'Trailing line comment must not have semicolon appended'
  );
  assert.ok(s2.code.includes('// Needed by evalReversePolishNotation()'));
  assert.match(s2.code, /0:\s*string;/);
  assert.match(s2.code, /1\?:\s*number;/);
  assert.match(s2.code, /type ExtendedIface = BaseA & BaseB & \{/);
  assert.match(s2.code, /type MaybeVoid = string \| undefined;/);
  assert.match(s2.code, /type MaybeTypeofUndef = string \| undefined;/);
  assert.match(s2.code, /type UnionKeys = keyof \(A \| B\);/);
  assert.match(s2.code, /type KeysArray = \(keyof Foo\)\[\];/);
  assert.match(s2.code, /type UnionValues = \(A \| B\)\[keyof \(A \| B\)\];/);
  assert.match(s2.code, /style:\s*React\.CSSProperties;/);
  assert.match(s2.code, /styles:\s*Record<string,\s*React\.CSSProperties>;/);
  assert.match(s2.code, /Promise<void>/);
  assert.match(s2.code, /cb:\s*\(x:\s*string \| undefined\) => void/);
});
