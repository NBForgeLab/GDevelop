const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  DEFAULT_CLASSES_TO_ERASE,
  DEFAULT_FUNCTIONS_TO_ERASE,
  patchGlueCppContent,
  patchGlueCppFile,
} = require('../update-bindings');

function createValidGlueFixture({
  classesToErase = DEFAULT_CLASSES_TO_ERASE,
  functionsToErase = DEFAULT_FUNCTIONS_TO_ERASE,
} = {}) {
  const classBlocks = classesToErase
    .map(
      (className) =>
        `class ${className} : public ${className}Wrapper {\npublic:\n  void invoke() {}\n};`
    )
    .join('\n\n');

  const erasedFunctionBlocks = functionsToErase
    .map(
      (fnName) =>
        `void EMSCRIPTEN_KEEPALIVE ${fnName}(void* self, const char* arg0) {\n  // erased body\n}`
    )
    .join('\n\n');

  return [
    '#include <emscripten.h>',
    '',
    'class KeepMeFunctor : public KeepMeFunctorWrapper {',
    'public:',
    '  void invoke() {}',
    '};',
    '',
    classBlocks,
    '',
    'extern "C" {',
    '',
    'const char* EMSCRIPTEN_KEEPALIVE emscripten_bind_Resource_GetName_0(Resource* self) {',
    '  return &self->GetName();',
    '}',
    '',
    'const char* EMSCRIPTEN_KEEPALIVE emscripten_bind_Platform_GetName_0(Platform* self) {',
    '  static char* temp;',
    '  return (temp = self->GetName(), &temp);',
    '}',
    '',
    'const char* EMSCRIPTEN_KEEPALIVE emscripten_bind_Free_GetTypeOfObject_3(gd::Project* self, gd::Layout* layout, const char* name) {',
    '  static char* temp;',
    '  return (temp = self->FREE_GetTypeOfObject(*layout, name), &temp);',
    '}',
    '',
    'VectorString* EMSCRIPTEN_KEEPALIVE emscripten_bind_Map_toNewVectorString_0(MapStringString* self) {',
    '  static VectorString temp;',
    '  return (temp = self->FREE_toNewVectorString(), &temp);',
    '}',
    '',
    'void EMSCRIPTEN_KEEPALIVE emscripten_bind_MapStringString_MAP_set_2(MapStringString* self, const char* name, const char* str) {',
    '  self->MAP_set(name, str);',
    '}',
    '',
    'VectorString* EMSCRIPTEN_KEEPALIVE emscripten_bind_MapStringString_MAP_keys_0(MapStringString* self) {',
    '  static VectorString temp;',
    '  return (temp = self->MAP_keys(), &temp);',
    '}',
    '',
    'Instruction* EMSCRIPTEN_KEEPALIVE emscripten_bind_Instruction_CLONE_Instruction_0(Instruction* self) {',
    '  return self->CLONE_Instruction();',
    '}',
    '',
    erasedFunctionBlocks,
    '',
    '} // extern "C"',
  ].join('\n');
}

describe('update-bindings.js (patchGlueCppContent & patchGlueCppFile)', () => {
  const tempDirs = [];

  function makeTempDir() {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'gdevelopjs-update-bindings-test-')
    );
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    jest.restoreAllMocks();
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  describe('patchGlueCppContent happy path', () => {
    it('erases only the named class and function when declaration spacing changes', () => {
      const name = DEFAULT_FUNCTIONS_TO_ERASE[0];
      const raw = createValidGlueFixture()
        .replace('class ArbitraryResourceWorkerJS :', '  class\tArbitraryResourceWorkerJS :')
        .replace('EMSCRIPTEN_KEEPALIVE ' + name + '(', 'EMSCRIPTEN_KEEPALIVE\t' + name + '  (');
      const result = patchGlueCppContent(raw);
      expect(result.patchedContent).not.toContain('ArbitraryResourceWorkerJSWrapper');
      expect(result.patchedContent).not.toContain(name);
      expect(result.patchedContent).toContain('class KeepMeFunctor');
    });

    it('patches string getters when the generator varies declaration spacing', () => {
      const raw = createValidGlueFixture().replace(
        'const char* EMSCRIPTEN_KEEPALIVE emscripten_bind_Resource',
        '  const char *  EMSCRIPTEN_KEEPALIVE emscripten_bind_Resource'
      );
      const { patchedContent } = patchGlueCppContent(raw);
      expect(patchedContent).toContain('return self->GetName().c_str();');
    });

    it('patches all WebIDL C++ glue patterns and erases targeted classes and functions', () => {
      const raw = createValidGlueFixture();
      const { patchedContent, stats } = patchGlueCppContent(raw);

      expect(stats).toEqual({
        returnStringFunctions: 3,
        staticCharPtrReplacements: 2,
        tempCstrReplacements: 2,
        refReturnStringReplacements: 1,
        freeCallReplacements: 2,
        mapSetReplacements: 1,
        cloneCallReplacements: 1,
        mapKeysReplacements: 1,
      });

      // Preserves non-erased classes
      expect(patchedContent).toContain(
        'class KeepMeFunctor : public KeepMeFunctorWrapper {'
      );

      // Erases all targeted classes and functions
      for (const cls of DEFAULT_CLASSES_TO_ERASE) {
        expect(patchedContent).not.toContain(`class ${cls}`);
      }
      for (const fn of DEFAULT_FUNCTIONS_TO_ERASE) {
        expect(patchedContent).not.toContain(fn);
      }

      // Transforms [Const, Ref] DOMString
      expect(patchedContent).toContain('  return self->GetName().c_str();');
      expect(patchedContent).not.toContain('  return &self->GetName();');

      // Transforms [Const, Value] DOMString
      expect(patchedContent).toContain('  static gd::String temp;');
      expect(patchedContent).toContain(
        '  return (temp = self->GetName(), temp.c_str());'
      );

      // Transforms FREE_ with and without extra arguments
      expect(patchedContent).toContain(
        '  return (temp = GetTypeOfObject(*self, *layout, name), temp.c_str());'
      );
      expect(patchedContent).toContain(
        '  return (temp = toNewVectorString(*self), &temp);'
      );

      // Transforms MAP_set, MAP_keys, and CLONE_
      expect(patchedContent).toContain('  (*self)MAP_set(name, str);');
      expect(patchedContent).toContain(
        'temp.clear(); for(auto it = self->begin(); it != self->end();++it) { temp.push_back(it->first); } return &temp;'
      );
      expect(patchedContent).toContain('  return new Instruction(*self);');
    });

    it('supports debug mode for [Const, Ref] with & in arguments and [Const, Value] DOMString', () => {
      const raw = createValidGlueFixture().replace(
        '  return &self->GetName();',
        '  return &self->GetName(flags & mask);'
      );
      const { patchedContent } = patchGlueCppContent(raw, { debug: true });

      expect(patchedContent).toContain(
        '  gd::String & ref = const_cast<gd::String&>(self->GetName(flags & mask)); return ref.c_str();'
      );
      expect(patchedContent).toContain('  static gd::String temp;');
      expect(patchedContent).toContain(
        '  return (temp = self->GetName(), temp.c_str());'
      );
    });

    it('preserves CRLF line endings and exact trailing newline state without doubling newlines', () => {
      const lfNoTrailing = createValidGlueFixture();
      const crlfNoTrailing = lfNoTrailing.replace(/\n/g, '\r\n');
      const crlfWithTrailing = crlfNoTrailing + '\r\n';
      const lfWithTrailing = lfNoTrailing + '\n';

      // Each erased class block in the fixture spans 4 lines and each erased function block spans 3 lines.
      const erasedLineCount =
        DEFAULT_CLASSES_TO_ERASE.length * 4 +
        DEFAULT_FUNCTIONS_TO_ERASE.length * 3;

      const crlfResult = patchGlueCppContent(crlfNoTrailing);
      expect(crlfResult.patchedContent).toContain('\r\n');
      expect(crlfResult.patchedContent.replace(/\r\n/g, '')).not.toContain(
        '\n'
      );
      expect(crlfResult.patchedContent.endsWith('\r\n')).toBe(false);
      expect(crlfResult.patchedContent.split('\r\n').length).toBe(
        crlfNoTrailing.split('\r\n').length - erasedLineCount
      );

      const crlfTrailingResult = patchGlueCppContent(crlfWithTrailing);
      expect(
        crlfTrailingResult.patchedContent.replace(/\r\n/g, '')
      ).not.toContain('\n');
      expect(crlfTrailingResult.patchedContent.endsWith('\r\n')).toBe(true);
      expect(crlfTrailingResult.patchedContent.endsWith('\r\n\r\n')).toBe(
        false
      );
      expect(crlfTrailingResult.patchedContent.split('\r\n').length).toBe(
        crlfWithTrailing.split('\r\n').length - erasedLineCount
      );

      const lfNoTrailingResult = patchGlueCppContent(lfNoTrailing);
      expect(lfNoTrailingResult.patchedContent).not.toContain('\r\n');
      expect(lfNoTrailingResult.patchedContent.endsWith('\n')).toBe(false);

      const lfTrailingResult = patchGlueCppContent(lfWithTrailing);
      expect(lfTrailingResult.patchedContent).not.toContain('\r\n');
      expect(lfTrailingResult.patchedContent.endsWith('\n')).toBe(true);
      expect(lfTrailingResult.patchedContent.endsWith('\n\n')).toBe(false);
    });

    it('patches self->CLONE_ accurately when () precedes it on the same line', () => {
      const raw = createValidGlueFixture().replace(
        '  return self->CLONE_Instruction();',
        '  return foo() ? self->CLONE_Instruction() : nullptr;'
      );
      const { patchedContent } = patchGlueCppContent(raw);

      expect(patchedContent).toContain(
        '  return foo() ? new Instruction(*self) : nullptr;'
      );
      expect(patchedContent).not.toContain('foo(*self)');
    });

    it('does not insert a comma in self->FREE_ calls with whitespace inside empty parens', () => {
      const raw = createValidGlueFixture().replace(
        'self->FREE_toNewVectorString()',
        'self->FREE_toNewVectorString( )'
      );
      const { patchedContent } = patchGlueCppContent(raw);

      expect(patchedContent).toContain(
        '  return (temp = toNewVectorString(*self ), &temp);'
      );
      expect(patchedContent).not.toContain('toNewVectorString(*self,');
    });

    it('erases single-line class and function blocks without swallowing subsequent lines', () => {
      const singleLineClass = DEFAULT_CLASSES_TO_ERASE[0];
      const singleLineFn = DEFAULT_FUNCTIONS_TO_ERASE[0];
      const raw = createValidGlueFixture()
        .replace(
          `class ${singleLineClass} : public ${singleLineClass}Wrapper {\npublic:\n  void invoke() {}\n};`,
          `class ${singleLineClass} {};\nclass AfterSingleLineClass {};`
        )
        .replace(
          `void EMSCRIPTEN_KEEPALIVE ${singleLineFn}(void* self, const char* arg0) {\n  // erased body\n}`,
          `void EMSCRIPTEN_KEEPALIVE ${singleLineFn}(void* self, const char* arg0) { delete self; }\nvoid EMSCRIPTEN_KEEPALIVE keptAfterSingleLineFn() {}`
        );

      const { patchedContent } = patchGlueCppContent(raw);

      expect(patchedContent).not.toContain(`class ${singleLineClass}`);
      expect(patchedContent).toContain('class AfterSingleLineClass {};');
      expect(patchedContent).not.toContain(singleLineFn);
      expect(patchedContent).toContain(
        'void EMSCRIPTEN_KEEPALIVE keptAfterSingleLineFn() {}'
      );
    });

    it('erases multi-line class and function blocks whose first line ends with an inner brace pair (1f)', () => {
      const targetClass = DEFAULT_CLASSES_TO_ERASE[0];
      const targetFn = DEFAULT_FUNCTIONS_TO_ERASE[0];
      const raw = createValidGlueFixture()
        .replace(
          `class ${targetClass} : public ${targetClass}Wrapper {\npublic:\n  void invoke() {}\n};`,
          [
            `class ${targetClass} : public ${targetClass}Wrapper { struct Inner {};`,
            'public:',
            '  void leakedLineIfStoppedEarly() {}',
            '  int shouldBeErasedToo = 42;',
            '};',
            'class KeptAfterNestedFirstLineClass {};',
          ].join('\n')
        )
        .replace(
          `void EMSCRIPTEN_KEEPALIVE ${targetFn}(void* self, const char* arg0) {\n  // erased body\n}`,
          [
            `void EMSCRIPTEN_KEEPALIVE ${targetFn}(void* self, const char* arg0) { if (self) { noop(); }`,
            '  shouldAlsoBeErased(arg0);',
            '  if (arg0) { cleanup(); }',
            '}',
            'void EMSCRIPTEN_KEEPALIVE keptAfterNestedFirstLineFn() {}',
          ].join('\n')
        );

      const { patchedContent } = patchGlueCppContent(raw);

      expect(patchedContent).not.toContain(`class ${targetClass}`);
      expect(patchedContent).not.toContain('leakedLineIfStoppedEarly');
      expect(patchedContent).not.toContain('shouldBeErasedToo');
      expect(patchedContent).toContain(
        'class KeptAfterNestedFirstLineClass {};'
      );
      expect(patchedContent).not.toContain(targetFn);
      expect(patchedContent).not.toContain('shouldAlsoBeErased');
      expect(patchedContent).toContain(
        'void EMSCRIPTEN_KEEPALIVE keptAfterNestedFirstLineFn() {}'
      );
    });

    it('erases single-line blocks ending with comments without swallowing subsequent declarations (1g)', () => {
      const targetClass = DEFAULT_CLASSES_TO_ERASE[0];
      const targetFn = DEFAULT_FUNCTIONS_TO_ERASE[0];
      const raw = createValidGlueFixture()
        .replace(
          `class ${targetClass} : public ${targetClass}Wrapper {\npublic:\n  void invoke() {}\n};`,
          `class ${targetClass} {}; // single-line class { trailing comment\nclass KeptAfterCommentedSingleLineClass {};`
        )
        .replace(
          `void EMSCRIPTEN_KEEPALIVE ${targetFn}(void* self, const char* arg0) {\n  // erased body\n}`,
          `void EMSCRIPTEN_KEEPALIVE ${targetFn}(void* self, const char* arg0) { return; } // comment {\nvoid EMSCRIPTEN_KEEPALIVE keptAfterCommentedSingleLineFn() {}`
        );

      const { patchedContent } = patchGlueCppContent(raw);

      expect(patchedContent).not.toContain(`class ${targetClass}`);
      expect(patchedContent).toContain(
        'class KeptAfterCommentedSingleLineClass {};'
      );
      expect(patchedContent).not.toContain(targetFn);
      expect(patchedContent).toContain(
        'void EMSCRIPTEN_KEEPALIVE keptAfterCommentedSingleLineFn() {}'
      );
    });

    it('ignores braces inside single-line comments, multi-line block comments, strings, and char literals inside erased blocks (1h)', () => {
      const targetClass = DEFAULT_CLASSES_TO_ERASE[0];
      const targetFn = DEFAULT_FUNCTIONS_TO_ERASE[0];
      const raw = createValidGlueFixture()
        .replace(
          `class ${targetClass} : public ${targetClass}Wrapper {\npublic:\n  void invoke() {}\n};`,
          [
            `class ${targetClass} : public ${targetClass}Wrapper`,
            '{',
            'public:',
            '  /* multi-line comment with fake closing braces } };',
            `     and even a commented target line:\nclass ${DEFAULT_CLASSES_TO_ERASE[1]} {};`,
            '     and quotes " } \' */',
            '  void invoke() {',
            '    EM_ASM_INT({',
            "      var msg = 'single quoted } and \\' } \\\\';",
            '      var str = "escaped \\" } \\" and \\\\";',
            '      var spliced = "line \\',
            '} still inside string";',
            '    }, 0);',
            '  }',
            '  }; // closing class with indentation and comment',
            'class KeptAfterComplexErasedClass {};',
          ].join('\n')
        )
        .replace(
          `void EMSCRIPTEN_KEEPALIVE ${targetFn}(void* self, const char* arg0) {\n  // erased body\n}`,
          [
            `void EMSCRIPTEN_KEEPALIVE ${targetFn}(void* self, const char* arg0) {`,
            '  // line comment with unmatched } and {',
            '  /* inline comment } */ const char* a = "/* } */ // }";',
            "  char openBrace = '{'; char closeBrace = '}'; char escQuote = '\\''; char escSlash = '\\\\';",
            '  /* multi-line comment',
            '     } fake function end',
            '  */',
            '  if (self) { /* } */ return; } // } comment',
            '} /* trailing block comment */',
            'void EMSCRIPTEN_KEEPALIVE keptAfterComplexErasedFn() {}',
          ].join('\n')
        );

      const { patchedContent } = patchGlueCppContent(raw);

      expect(patchedContent).not.toContain(`class ${targetClass}`);
      expect(patchedContent).not.toContain('EM_ASM_INT');
      expect(patchedContent).not.toContain('still inside string');
      expect(patchedContent).toContain('class KeptAfterComplexErasedClass {};');
      expect(patchedContent).not.toContain(targetFn);
      expect(patchedContent).not.toContain('escQuote');
      expect(patchedContent).toContain(
        'void EMSCRIPTEN_KEEPALIVE keptAfterComplexErasedFn() {}'
      );
    });
  });

  describe('patchGlueCppContent fail-fast assertions', () => {
    it('throws on empty or non-string input', () => {
      expect(() => patchGlueCppContent('')).toThrow(
        'glue.cpp content must be a non-empty string.'
      );
      expect(() => patchGlueCppContent('   \n  ')).toThrow(
        'glue.cpp content must be a non-empty string.'
      );
      expect(() => patchGlueCppContent(null)).toThrow(
        'glue.cpp content must be a non-empty string.'
      );
    });

    it('throws when any expected class to erase is missing', () => {
      const raw = createValidGlueFixture({
        classesToErase: DEFAULT_CLASSES_TO_ERASE.slice(1),
      });
      expect(() => patchGlueCppContent(raw)).toThrow(
        `Expected classes to erase were not found in glue.cpp: ${DEFAULT_CLASSES_TO_ERASE[0]}`
      );
    });

    it('throws when any expected function to erase is missing', () => {
      const raw = createValidGlueFixture({
        functionsToErase: DEFAULT_FUNCTIONS_TO_ERASE.slice(1),
      });
      expect(() => patchGlueCppContent(raw)).toThrow(
        `Expected functions to erase were not found in glue.cpp: ${DEFAULT_FUNCTIONS_TO_ERASE[0]}`
      );
    });

    it('throws when an erased class block is not closed before EOF', () => {
      const raw =
        createValidGlueFixture() +
        `\nclass ${DEFAULT_CLASSES_TO_ERASE[0]} : public Wrapper {\n  void broken() {}`;
      expect(() => patchGlueCppContent(raw)).toThrow(
        `Unclosed class block at end of glue.cpp while erasing "${DEFAULT_CLASSES_TO_ERASE[0]}"`
      );
    });

    it('throws when an erased function block is not closed before EOF', () => {
      const raw =
        createValidGlueFixture() +
        `\nvoid EMSCRIPTEN_KEEPALIVE ${DEFAULT_FUNCTIONS_TO_ERASE[0]}(void* self) {\n  // missing closing brace`;
      expect(() => patchGlueCppContent(raw)).toThrow(
        `Unclosed function block at end of glue.cpp while erasing "${DEFAULT_FUNCTIONS_TO_ERASE[0]}"`
      );
    });

    it('throws when closing braces only appear inside comments or strings before EOF', () => {
      const onlyInCommentOrString =
        createValidGlueFixture() +
        `\nvoid EMSCRIPTEN_KEEPALIVE ${DEFAULT_FUNCTIONS_TO_ERASE[0]}(void* self) {\n  const char* s = "}";\n  /* } */\n  // }`;
      expect(() => patchGlueCppContent(onlyInCommentOrString)).toThrow(
        `Unclosed function block at end of glue.cpp while erasing "${DEFAULT_FUNCTIONS_TO_ERASE[0]}"`
      );

      const headerWithoutOpeningBrace =
        createValidGlueFixture() +
        `\nclass ${DEFAULT_CLASSES_TO_ERASE[0]} : public Wrapper`;
      expect(() => patchGlueCppContent(headerWithoutOpeningBrace)).toThrow(
        `Unclosed class block at end of glue.cpp while erasing "${DEFAULT_CLASSES_TO_ERASE[0]}"`
      );
    });

    it('throws when an erased block encounters a closing brace before its opening brace', () => {
      const raw =
        createValidGlueFixture() +
        `\nclass ${DEFAULT_CLASSES_TO_ERASE[0]} : public Wrapper\n};`;
      expect(() => patchGlueCppContent(raw)).toThrow(
        `Unexpected closing brace while erasing class "${DEFAULT_CLASSES_TO_ERASE[0]}"`
      );
    });

    it('throws when a const char* function contains an unrecognized line', () => {
      const raw = createValidGlueFixture().replace(
        '  return &self->GetName();',
        '  const char* unexpected = self->GetName();'
      );
      expect(() => patchGlueCppContent(raw)).toThrow(
        'Unexpected line inside const char* function "const char* EMSCRIPTEN_KEEPALIVE emscripten_bind_Resource_GetName_0(Resource* self) {"'
      );
    });

    it('throws when a const char* function is empty or unclosed', () => {
      const emptyFnRaw = createValidGlueFixture().replace(
        'const char* EMSCRIPTEN_KEEPALIVE emscripten_bind_Resource_GetName_0(Resource* self) {\n  return &self->GetName();\n}',
        'const char* EMSCRIPTEN_KEEPALIVE emscripten_bind_Resource_GetName_0(Resource* self) {\n}'
      );
      expect(() => patchGlueCppContent(emptyFnRaw)).toThrow(
        'closed at line 41 without any string return transformation.'
      );

      const unclosedFnRaw =
        createValidGlueFixture() +
        '\nconst char* EMSCRIPTEN_KEEPALIVE emscripten_bind_Broken_0(Resource* self) {\n  return &self->GetName();';
      expect(() => patchGlueCppContent(unclosedFnRaw)).toThrow(
        'Unclosed const char* EMSCRIPTEN_KEEPALIVE function at end of glue.cpp'
      );
    });

    it('throws when [Const, Value] DOMString has mismatched static char* vs &temp lines', () => {
      const raw = createValidGlueFixture().replace(
        '  return (temp = self->GetName(), &temp);',
        '  return &self->GetName();'
      );
      expect(() => patchGlueCppContent(raw)).toThrow(
        'Mismatched "[Const, Value] DOMString" replacements in glue.cpp'
      );
    });

    it('throws when self->FREE_, self->MAP_set, self->CLONE_, or self->MAP_keys patterns are missing or malformed', () => {
      const noFreeRaw = createValidGlueFixture().replace(
        /self->FREE_/g,
        'self->'
      );
      expect(() => patchGlueCppContent(noFreeRaw)).toThrow(
        'Expected "self->FREE_" patterns were not found in glue.cpp.'
      );

      const badFreeRaw = createValidGlueFixture().replace(
        'self->FREE_toNewVectorString()',
        'self->FREE_()'
      );
      expect(() => patchGlueCppContent(badFreeRaw)).toThrow(
        'Malformed self->FREE_ call'
      );

      const noMapSetRaw = createValidGlueFixture().replace(
        'self->MAP_set(name, str);',
        'self->set(name, str);'
      );
      expect(() => patchGlueCppContent(noMapSetRaw)).toThrow(
        'Expected "self->MAP_set" patterns were not found in glue.cpp.'
      );

      const noCloneRaw = createValidGlueFixture().replace(
        'self->CLONE_Instruction()',
        'self->Clone()'
      );
      expect(() => patchGlueCppContent(noCloneRaw)).toThrow(
        'Expected "self->CLONE_" patterns were not found in glue.cpp.'
      );

      const badCloneRaw = createValidGlueFixture().replace(
        'self->CLONE_Instruction()',
        'self->CLONE_Instruction(123)'
      );
      expect(() => patchGlueCppContent(badCloneRaw)).toThrow(
        'Malformed self->CLONE_ call'
      );

      const noMapKeysRaw = createValidGlueFixture().replace(
        'self->MAP_keys()',
        'self->keys()'
      );
      expect(() => patchGlueCppContent(noMapKeysRaw)).toThrow(
        'Expected "self->MAP_keys" patterns were not found in glue.cpp.'
      );
    });

    it('does not transform or fail on const char* functions or FREE_ calls inside erased blocks', () => {
      const erasedFnName = 'emscripten_bind_ErasedClass_GetLabel_0';
      const raw =
        createValidGlueFixture() +
        `\nconst char* EMSCRIPTEN_KEEPALIVE ${erasedFnName}(void* self) {\n  const char* custom = "ignored";\n  return custom;\n}\n` +
        `\nvoid EMSCRIPTEN_KEEPALIVE ${DEFAULT_FUNCTIONS_TO_ERASE[0]}(void* self) {\n  self->FREE_anything();\n}`;

      const result = patchGlueCppContent(raw, {
        functionsToErase: DEFAULT_FUNCTIONS_TO_ERASE.concat([erasedFnName]),
      });

      expect(result.patchedContent).not.toContain(erasedFnName);
      expect(result.patchedContent).not.toContain('self->FREE_anything()');
      expect(result.stats.returnStringFunctions).toBe(3);
      expect(result.stats.freeCallReplacements).toBe(2);
    });

    it('preserves ampersands in arguments when patching return & expressions in non-debug mode', () => {
      const raw = createValidGlueFixture().replace(
        '  return &self->GetName();',
        '  return &self->GetName(flags & mask);'
      );

      const { patchedContent } = patchGlueCppContent(raw, { debug: false });
      expect(patchedContent).toContain(
        '  return self->GetName(flags & mask).c_str();'
      );
    });

    it('throws if run a second time on already-patched glue.cpp content', () => {
      const raw = createValidGlueFixture();
      const { patchedContent } = patchGlueCppContent(raw);

      expect(() => patchGlueCppContent(patchedContent)).toThrow();
    });
  });

  describe('patchGlueCppFile file I/O and callback handling', () => {
    it('reads, patches, and writes glue.cpp on disk', (done) => {
      const dir = makeTempDir();
      const gluePath = path.join(dir, 'glue.cpp');
      fs.writeFileSync(gluePath, createValidGlueFixture(), 'utf8');

      patchGlueCppFile({ filePath: gluePath }, (err, result) => {
        expect(err).toBeNull();
        expect(result.stats.freeCallReplacements).toBe(2);

        const updatedOnDisk = fs.readFileSync(gluePath, 'utf8');
        expect(updatedOnDisk).toBe(result.patchedContent);
        expect(updatedOnDisk).toContain('(*self)MAP_set(name, str);');
        done();
      });
    });

    it('supports calling patchGlueCppFile(cb) with default glue.cpp path', (done) => {
      const expectedDefaultPath = path.resolve(
        __dirname,
        '..',
        'Bindings',
        'glue.cpp'
      );
      const rawFixture = createValidGlueFixture();
      let writtenPath = null;
      let writtenContent = null;

      jest.spyOn(fs, 'readFile').mockImplementation((filePath, cb) => {
        expect(filePath).toBe(expectedDefaultPath);
        cb(null, Buffer.from(rawFixture, 'utf8'));
      });
      jest
        .spyOn(fs, 'writeFile')
        .mockImplementation((filePath, content, cb) => {
          writtenPath = filePath;
          writtenContent = content;
          cb(null);
        });

      patchGlueCppFile((err, result) => {
        expect(err).toBeNull();
        expect(writtenPath).toBe(expectedDefaultPath);
        expect(writtenContent).toBe(result.patchedContent);
        expect(result.stats.mapKeysReplacements).toBe(1);
        done();
      });
    });

    it('returns an error to the callback when writing the patched glue.cpp file fails', (done) => {
      const dir = makeTempDir();
      const gluePath = path.join(dir, 'glue.cpp');
      fs.writeFileSync(gluePath, createValidGlueFixture(), 'utf8');

      const writeError = Object.assign(new Error('EACCES: permission denied'), {
        code: 'EACCES',
      });
      jest
        .spyOn(fs, 'writeFile')
        .mockImplementation((_filePath, _content, cb) => {
          cb(writeError);
        });

      patchGlueCppFile({ filePath: gluePath }, (err, result) => {
        expect(result).toBeUndefined();
        expect(err).toBeTruthy();
        expect(err.message).toBe(
          'Unable to write patched glue.cpp file at ' + gluePath
        );
        expect(err.output).toBe(writeError);
        done();
      });
    });

    it('throws immediately when patchGlueCppFile is called without a valid callback', () => {
      expect(() => patchGlueCppFile()).toThrow(
        'patchGlueCppFile requires a callback function.'
      );
      expect(() => patchGlueCppFile({})).toThrow(
        'patchGlueCppFile requires a callback function.'
      );
      expect(() => patchGlueCppFile({}, 'not-a-function')).toThrow(
        'patchGlueCppFile requires a callback function.'
      );
    });

    it('returns an error to the callback when the file does not exist or fails validation', (done) => {
      const dir = makeTempDir();
      const missingPath = path.join(dir, 'missing-glue.cpp');

      patchGlueCppFile({ filePath: missingPath }, (missingErr) => {
        expect(missingErr).toBeTruthy();
        expect(missingErr.message).toContain('Unable to read glue.cpp file');

        const invalidPath = path.join(dir, 'invalid-glue.cpp');
        fs.writeFileSync(invalidPath, '// invalid glue content\n', 'utf8');

        patchGlueCppFile({ filePath: invalidPath }, (patchErr) => {
          expect(patchErr).toBeTruthy();
          expect(patchErr.message).toContain('Error while patching glue.cpp:');
          done();
        });
      });
    });
  });
});
