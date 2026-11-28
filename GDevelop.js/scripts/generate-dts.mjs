// @ts-check
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const bindingsFile = readFileSync(
  __dirname + '/../Bindings/Bindings.idl',
  'utf-8'
);

/** @type {Record<string, {returnType: string, inputType?: string}>} */
const castFunctions = {
  StandardEvent: { inputType: 'Event', returnType: 'StandardEvent' },
  ElseEvent: { inputType: 'Event', returnType: 'ElseEvent' },
  RepeatEvent: { inputType: 'Event', returnType: 'RepeatEvent' },
  WhileEvent: { inputType: 'Event', returnType: 'WhileEvent' },
  ForEachEvent: { inputType: 'Event', returnType: 'ForEachEvent' },
  ForEachChildVariableEvent: {
    inputType: 'Event',
    returnType: 'ForEachChildVariableEvent',
  },
  CommentEvent: { inputType: 'Event', returnType: 'CommentEvent' },
  GroupEvent: { inputType: 'Event', returnType: 'GroupEvent' },
  LinkEvent: { inputType: 'Event', returnType: 'LinkEvent' },
  JsCodeEvent: { inputType: 'Event', returnType: 'JsCodeEvent' },

  Platform: { inputType: 'JsPlatform', returnType: 'Platform' },

  SpriteConfiguration: {
    inputType: 'ObjectConfiguration',
    returnType: 'SpriteObject',
  },
  TiledSpriteConfiguration: {
    inputType: 'ObjectConfiguration',
    returnType: 'TiledSpriteObject',
  },
  PanelSpriteConfiguration: {
    inputType: 'ObjectConfiguration',
    returnType: 'PanelSpriteObject',
  },
  TextObjectConfiguration: {
    inputType: 'ObjectConfiguration',
    returnType: 'TextObject',
  },
  ShapePainterConfiguration: {
    inputType: 'ObjectConfiguration',
    returnType: 'ShapePainterObject',
  },
  TextEntryObject: {
    inputType: 'ObjectConfiguration',
    returnType: 'TextEntryObject',
  },
  ParticleEmitterConfiguration: {
    inputType: 'ObjectConfiguration',
    returnType: 'ParticleEmitterObject',
  },
  CustomObjectConfiguration: {
    inputType: 'ObjectConfiguration',
    returnType: 'CustomObjectConfiguration',
  },
  Model3DConfiguration: {
    inputType: 'ObjectConfiguration',
    returnType: 'Model3DObjectConfiguration',
  },
  SpineConfiguration: {
    inputType: 'ObjectConfiguration',
    returnType: 'SpineObjectConfiguration',
  },

  ObjectJsImplementation: { returnType: 'ObjectJsImplementation' },

  ImageResource: { inputType: 'Resource', returnType: 'ImageResource' },
};

/** @type {Record<string, string[]>} */
const extraClassAttributes = {
  ObjectJsImplementation: ['content: Record<string, any>;'],
  VectorString: ['toJSArray(): Array<string>;'],
  Serializer: [
    'static fromJSObject(object: unknown): SerializerElement;',
    'static toJSObject(element: SerializerElement): any;',
  ],
};

// Emscripten's WebIDL binder passes raw WASM pointers (`number`) to
// `[JSImplementation]` callbacks that are NOT erased and hand-wrapped in C++
// (see `DEFAULT_CLASSES_TO_ERASE` in `GDevelop.js/update-bindings.js`).
// Currently only `InitialInstanceJSFunctor.invoke` falls into this category
// (see `GDevelop.js/Bindings/glue.cpp`), so callers must pass its argument to
// `gd.wrapPointer(instancePtr, gd.InitialInstance)`.
/** @type {Record<string, Record<string, string>>} */
const methodSignatureOverrides = {
  InitialInstanceJSFunctor: {
    invoke: 'invoke(instancePtr: number): void;',
  },
};

const PrimitiveTypes = new Map([
  ['DOMString', 'string'],
  ['long', 'number'],
  ['double', 'number'],
  ['void', 'void'],
  ['boolean', 'boolean'],
]);

const none = Symbol('No default value');
class Parser {
  static parserPosition = 0;
  /** @private */
  static sourceString = '';
  /** @private */
  static sourceLength = 0;

  /** @param {string} str */
  static setSource(str) {
    this.parserPosition = 0;
    this.sourceString = str;
    this.sourceLength = str.length;
  }
  static get isDone() {
    return this.parserPosition >= this.sourceLength;
  }
  static get currentCharacter() {
    return this.sourceString.charAt(this.parserPosition);
  }
  static get currentCharacterCode() {
    return this.sourceString.charCodeAt(this.parserPosition);
  }

  static skipWhitespaces() {
    while (this.currentCharacterCode <= 32) this.parserPosition++;
    // Comments go everywhere whitespaces go and must be skipped as if it were whitespace
    if (this.currentCharacter === '/') {
      this.parserPosition++;
      if (this.currentCharacter === '/') {
        // //-style comments
        this.skipUntil('\n');
      } else if (this.currentCharacter === '*') {
        // /* */-style comments
        do {
          this.skipUntil('*');
        } while (this.currentCharacter !== '/');
        this.parserPosition++;
      } else console.warn(`Unexpected slash.`);
      this.skipWhitespaces();
    }
  }
  /** @param {string} thisCharacter */
  static skipUntil(thisCharacter, skipOverIt = true) {
    while (this.currentCharacter !== thisCharacter && !this.isDone)
      this.parserPosition++;
    if (skipOverIt) this.parserPosition++;
  }
  /** @param {string} thisCharacter */
  static readUntil(thisCharacter, skipOverIt = true) {
    let token = '';
    while (this.currentCharacter !== thisCharacter) {
      if (this.isDone)
        throw new Error(`Never reached character '${thisCharacter}'!`);
      token += this.currentCharacter;
      this.parserPosition++;
    }
    if (skipOverIt) this.parserPosition++;
    return token;
  }

  static readType() {
    // Ignore [Const] and such annotations
    Parser.skipWhitespaces();
    if (Parser.currentCharacter === '[') Parser.skipUntil(']');
    Parser.skipWhitespaces();

    // Read the type
    /** @type {string} */
    let type;
    let optional = false;
    let attribute = false;
    do {
      Parser.skipWhitespaces();
      type = Parser.readUntil(' ');
      if (type === 'optional') optional = true;
      if (type === 'attribute') attribute = true;
    } while (
      type === 'unsigned' ||
      type === 'optional' ||
      type === 'attribute'
    );
    Parser.skipWhitespaces();

    return { type, optional, attribute };
  }

  static readIdentifier() {
    let name = '';
    while (
      (Parser.currentCharacterCode >= 97 &&
        Parser.currentCharacterCode <= 122) || // [a-z]
      (Parser.currentCharacterCode >= 65 &&
        Parser.currentCharacterCode <= 90) || // [A-Z]
      (Parser.currentCharacterCode >= 48 &&
        Parser.currentCharacterCode <= 57) || // [1-9]
      Parser.currentCharacter === '_'
    ) {
      name += Parser.currentCharacter;
      Parser.parserPosition++;
    }
    return name;
  }

  static readNumber() {
    let number = '';
    while (
      Parser.currentCharacterCode >= 48 &&
      Parser.currentCharacterCode <= 57 // [1-9]
    ) {
      number += Parser.currentCharacter;
      Parser.parserPosition++;
    }
    return parseInt(number, 10);
  }
}

const enums = [];
/** @type {Map<string, Array<{ memberName: string, enumName: string }>>} */
const scopedEnumMembersByClass = new Map();
for (const [, enumName, enumCode] of bindingsFile.matchAll(
  /enum\s+([a-zA-Z0-9_]+)\s+\{\r?\n?([^}]*)\r?\n\}/gm
)) {
  const members = [];
  let i = 0;
  for (const enumMemberString of enumCode.split(/\r?\n/)) {
    const match = enumMemberString
      .replace(/\/\/.*$/, '')
      .match(/"(?:([a-zA-Z0-9_]+)::)?([a-zA-Z0-9_]+)"/);
    if (!match) continue;
    const [, owningClassName, memberName] = match;
    members.push(`  ${memberName} = ${i++},`);
    if (owningClassName) {
      let classMembers = scopedEnumMembersByClass.get(owningClassName);
      if (!classMembers) {
        classMembers = [];
        scopedEnumMembersByClass.set(owningClassName, classMembers);
      }
      classMembers.push({ memberName, enumName });
    }
  }
  enums.push(
    `export enum ${enumName} {
${members.join('\n')}
}`
  );
}

/** @param {string} type */
const mapTsType = (type) => PrimitiveTypes.get(type) ?? type;

/**
 * @typedef {{
 *   name: string,
 *   type: string,
 *   optional: boolean,
 *   defaultValue: number | typeof none,
 * }} ParsedParameter
 *
 * @typedef {{
 *   methodName: string,
 *   isStatic: boolean,
 *   isFree: boolean,
 *   isConstructor: boolean,
 *   returnType: string,
 *   parameters: ParsedParameter[],
 *   overrideSignature?: string,
 * }} ParsedMethod
 *
 * @typedef {{
 *   name: string,
 *   type: string,
 *   optional: boolean,
 * }} ParsedAttribute
 *
 * @typedef {{
 *   interfaceName: string,
 *   implementationName?: string,
 *   inheritedClass?: string,
 *   methods: ParsedMethod[],
 *   attributes: ParsedAttribute[],
 * }} ParsedInterface
 */

/**
 * @param {ParsedMethod} method
 * @returns {string}
 */
const getNormalizedMethodSignature = (method) => {
  if (method.overrideSignature) {
    return method.overrideSignature;
  }
  const paramTypes = method.parameters
    .map(({ type, optional }) => `${optional ? '?' : ''}:${mapTsType(type)}`)
    .join(',');
  return `(${paramTypes})=>${mapTsType(method.returnType)}`;
};

/** @type {ParsedInterface[]} */
const parsedInterfaces = [];
for (const [
  ,
  implementationName,
  interfaceName,
  interfaceCode,
] of bindingsFile.matchAll(
  /(?:\[JSImplementation=([a-zA-Z0-9]+)\]\r?\n?)?interface\s+([a-zA-Z0-9]+)\s+\{(?:}|(?:\r?\n?([^}]*)\r?\n\}))/gm
)) {
  /** @type {ParsedMethod[]} */
  const methods = [];
  /** @type {ParsedAttribute[]} */
  const attributes = [];

  if (interfaceCode) {
    Parser.setSource(interfaceCode);
    Parser.skipWhitespaces();
    while (!Parser.isDone) {
      const {
        type: returnType,
        optional: optionalReturn,
        attribute: isAttribute,
      } = Parser.readType();

      if (isAttribute) {
        const attributeName = Parser.readUntil(';');
        attributes.push({
          name: attributeName,
          type: returnType,
          optional: optionalReturn,
        });
        Parser.skipWhitespaces();
        continue;
      }

      let methodName = Parser.readUntil('(');
      const isStatic = methodName.includes('STATIC_');
      const isFree = methodName.includes('FREE_');
      const isConstructor =
        returnType === 'void' && methodName === interfaceName;
      // Remove prefixes which are not part of the actual function name
      methodName = methodName
        .replace('WRAPPED_', '')
        .replace('MAP_', '')
        .replace('FREE_', '')
        .replace('CLONE_', '')
        .replace('STATIC_', '');
      // Convert PascalCase to camelCase
      methodName = methodName[0].toLowerCase() + methodName.slice(1);

      /** @type {ParsedParameter[]} */
      const parameters = [];
      Parser.skipWhitespaces();
      if (Parser.currentCharacter !== ')')
        do {
          if (Parser.currentCharacter === ',') Parser.parserPosition++;
          const { type, optional } = Parser.readType();
          Parser.skipWhitespaces();
          const name = Parser.readIdentifier();
          Parser.skipWhitespaces();

          /** @type {number | typeof none} */
          let defaultValue = none;
          if (Parser.currentCharacter === '=') {
            Parser.parserPosition++;
            Parser.skipWhitespaces();
            defaultValue = Parser.readNumber();
            Parser.skipWhitespaces();
          }

          parameters.push({ name, type, optional, defaultValue });
        } while (Parser.currentCharacter === ',');

      // Health checks
      if (Parser.currentCharacter !== ')')
        console.warn('Expected closing parenthesis.');
      Parser.parserPosition++;
      Parser.skipWhitespaces();
      if (Parser.currentCharacter !== ';') console.warn('Expected semicolon.');
      Parser.parserPosition++;
      Parser.skipWhitespaces();

      methods.push({
        methodName,
        isStatic,
        isFree,
        isConstructor,
        returnType,
        parameters,
        overrideSignature:
          methodSignatureOverrides[interfaceName]?.[methodName],
      });
    }
  }

  const explicitlyInheritedClass = bindingsFile.match(
    new RegExp(`(?<![a-zA-Z0-9])${interfaceName} implements ([a-zA-Z0-9]+)`)
  );
  const inheritedClass =
    implementationName ||
    (explicitlyInheritedClass ? explicitlyInheritedClass[1] : undefined);

  parsedInterfaces.push({
    interfaceName,
    implementationName: implementationName || undefined,
    inheritedClass,
    methods,
    attributes,
  });
}

/** @type {Map<string, ParsedInterface>} */
const interfaceByName = new Map(
  parsedInterfaces.map((iface) => [iface.interfaceName, iface])
);

/**
 * Collect instance member signatures from `baseClassName` and its ancestors so
 * `[JSImplementation=...]` wrappers with incompatible callback signatures do not
 * emit invalid TypeScript subclass overrides (TS2416).
 * @param {string} baseClassName
 * @returns {Map<string, string>}
 */
const collectInheritedMemberSignatures = (baseClassName) => {
  /** @type {Map<string, string>} */
  const memberSignatures = new Map([
    ['ptr', 'attribute::number'],
    ['delete', 'method:()=>void'],
  ]);
  /** @type {Set<string>} */
  const visited = new Set();
  /** @type {string | undefined} */
  let currentName = baseClassName;
  while (currentName && !visited.has(currentName)) {
    visited.add(currentName);
    const current = interfaceByName.get(currentName);
    if (!current) break;
    for (const method of current.methods) {
      if (method.isStatic || method.isConstructor) continue;
      if (!memberSignatures.has(method.methodName)) {
        memberSignatures.set(
          method.methodName,
          `method:${getNormalizedMethodSignature(method)}`
        );
      }
    }
    for (const attr of current.attributes) {
      if (!memberSignatures.has(attr.name)) {
        memberSignatures.set(
          attr.name,
          `attribute:${attr.optional ? '?' : ''}:${mapTsType(attr.type)}`
        );
      }
    }
    currentName = current.inheritedClass;
  }
  return memberSignatures;
};

/** @type {Map<string, string[]>} */
const conflictingMembersByInterface = new Map();
/** @type {Map<string, string[]>} */
const incompatibleSubclassesByBase = new Map();

for (const iface of parsedInterfaces) {
  if (!iface.implementationName || !iface.inheritedClass) continue;
  const inheritedMembers = collectInheritedMemberSignatures(
    iface.inheritedClass
  );
  /** @type {string[]} */
  const conflictingMembers = [];

  for (const method of iface.methods) {
    if (method.isStatic || method.isConstructor) continue;
    const inheritedSignature = inheritedMembers.get(method.methodName);
    if (!inheritedSignature) continue;
    const ownSignature = `method:${getNormalizedMethodSignature(method)}`;
    if (inheritedSignature !== ownSignature) {
      conflictingMembers.push(method.methodName);
    }
  }

  for (const attr of iface.attributes) {
    const inheritedSignature = inheritedMembers.get(attr.name);
    if (!inheritedSignature) continue;
    const ownSignature = `attribute:${attr.optional ? '?' : ''}:${mapTsType(
      attr.type
    )}`;
    if (inheritedSignature !== ownSignature) {
      conflictingMembers.push(attr.name);
    }
  }

  if (conflictingMembers.length > 0) {
    conflictingMembersByInterface.set(iface.interfaceName, conflictingMembers);
    let subclasses = incompatibleSubclassesByBase.get(iface.inheritedClass);
    if (!subclasses) {
      subclasses = [];
      incompatibleSubclassesByBase.set(iface.inheritedClass, subclasses);
    }
    subclasses.push(iface.interfaceName);
  }
}

/** @param {string} type */
const mapParameterTsType = (type) => {
  const tsType = mapTsType(type);
  const incompatibleSubclasses = incompatibleSubclassesByBase.get(tsType);
  if (!incompatibleSubclasses || incompatibleSubclasses.length === 0) {
    return tsType;
  }
  return [tsType, ...incompatibleSubclasses].join(' | ');
};

/** @type {string[]} */
const interfaces = [];
/** @type {string[]} */
const freeFunctions = [];
for (const {
  interfaceName,
  inheritedClass,
  methods: parsedMethods,
  attributes: parsedAttributes,
} of parsedInterfaces) {
  /** @type {Set<string>} */
  const existingStaticMembers = new Set();

  const methods = parsedMethods.map((method) => {
    if (method.isStatic) {
      existingStaticMembers.add(method.methodName);
    }
    const formattedMethod = `${method.isStatic ? 'static ' : ''}${
      method.isConstructor ? 'constructor' : method.methodName
    }(${method.parameters
      .map(
        ({ name, type, optional }) =>
          `${name}${optional ? '?' : ''}: ${mapParameterTsType(type)}`
      )
      .join(', ')})${
      method.isConstructor ? '' : `: ${mapTsType(method.returnType)}`
    };`;

    const finalMethod = method.overrideSignature ?? formattedMethod;
    if (method.isFree) freeFunctions.push(`export function ${finalMethod}`);
    return finalMethod;
  });

  const attributes = parsedAttributes.map(
    ({ name, type, optional }) =>
      `${name}${optional ? '?' : ''}: ${mapTsType(type)};`
  );

  const extraAttributes = extraClassAttributes[interfaceName] ?? [];
  for (const attr of extraAttributes) {
    const staticMatch = attr.match(/^static\s+(?:readonly\s+)?([a-zA-Z0-9_]+)/);
    if (staticMatch) {
      existingStaticMembers.add(staticMatch[1]);
    }
  }

  const scopedEnumAttributes = (
    scopedEnumMembersByClass.get(interfaceName) ?? []
  )
    .filter(({ memberName }) => {
      if (existingStaticMembers.has(memberName)) return false;
      existingStaticMembers.add(memberName);
      return true;
    })
    .map(
      ({ memberName, enumName }) =>
        `static readonly ${memberName}: ${enumName};`
    );

  const classBodyLines = [
    ...methods,
    ...attributes,
    ...extraAttributes,
    ...scopedEnumAttributes,
  ];

  const conflictingMembers = conflictingMembersByInterface.get(interfaceName);
  let baseDeclaration = '';
  let extendsClause = inheritedClass || 'EmscriptenObject';
  if (conflictingMembers && conflictingMembers.length > 0 && inheritedClass) {
    const baseAliasName = `${interfaceName}Base`;
    const omittedUnion = conflictingMembers
      .map((memberName) => `'${memberName}'`)
      .join(' | ');
    baseDeclaration = `declare const ${baseAliasName}: {\n  new (): Omit<${inheritedClass}, ${omittedUnion}>;\n};\n\n`;
    extendsClause = baseAliasName;
  }

  interfaces.push(
    `${baseDeclaration}export class ${interfaceName} extends ${extendsClause} {${
      classBodyLines.length ? '\n  ' + classBodyLines.join('\n  ') + '\n' : ''
    }}`
  );
}

const dts = `// Automatically generated by GDevelop.js/scripts/generate-dts.mjs
type float = number;

declare class EmscriptenObject {
  /** The object's index in the WASM memory, and thus its unique identifier. */
  ptr: number;

  /**
   * Call this to free the object's underlying memory. It may not be used afterwards.
   *
   * **Call with care** - if the object owns some other objects, those will also be destroyed,
   * or if this object is owned by another object that does not expect it to be externally deleted
   * (e.g. it is a child of a map), objects will be put in an invalid state that will most likely
   * crash the app.
   *
   * If the object is owned by your code, you should still call this method when adequate, as
   * otherwise the memory will never be freed, causing a memory leak, which is to be avoided.
   */
  delete(): void;
}

${enums.join('\n\n')}

${interfaces.join('\n\n')}

${freeFunctions.join('\n\n')}
${Object.entries(castFunctions)
  .map(
    ([interfaceName, { returnType, inputType = 'EmscriptenObject' }]) => `
export function as${interfaceName}(object: ${inputType}): ${returnType};
`
  )
  .join('')}

export const Object: typeof gdObject;

/**
 * Initialises the Platforms included in the build (currently, only the JsPlatform),
 * and loads all built-in extensions into the platform.
 * To be called once when the library is first loaded.
 */
export const initializePlatforms: typeof ProjectHelper.initializePlatforms;

/**
 * Returns the pointer in WASM memory to an object. It is a number that uniquely
 * represents that instance of the object.
 *
 * @see {@link wrapPointer} to convert a pointer back to an object.
 */
export function getPointer(object: EmscriptenObject): number;

type ClassConstructor<T> = {
  new (...args: any[]): T;
};

/**
 * Wraps a pointer with a wrapper class, allowing to use the object located at the
 * pointer's destination as an instance of that class.
 *
 * @see {@link getPointer} to get a pointer from an object.
 */
export function wrapPointer<T extends EmscriptenObject>(ptr: number, objectClass: ClassConstructor<T>): T;

/**
 * Casts an object to another class type.
 *
 * **Careful** - this is not a conversion function.
 * This only changes the class type and functions exposed, not the underlying memory.
 * Only cast to another class if you are certain that the underlying memory is of that type!
 */
export function castObject<T extends EmscriptenObject>(object: EmscriptenObject, objectClass: ClassConstructor<T>): T;

/**
 * Checks whether two objects are pointing to the same underlying memory.
 * A reference to the object itself is not trustworthy, since there may be multiple
 * wrapper objects (which allow to call C++ function on C++ memory) for a single
 * pointer ("real object").
 *
 * This function must be therefore used to check for referential equality instead of
 * JavaScript's standard equality operators when handling Emscripten objects.
 */
export function compare<T extends EmscriptenObject>(object1: T, object2: T): boolean;

/**
 * Call this to free the object's underlying memory. It may not be used afterwards.
 *
 * **Call with care** - if the object owns some other objects, those will also be destroyed,
 * or if this object is owned by another object that does not expect it to be externally deleted
 * (e.g. it is a child of a map), objects will be put in an invalid state that will most likely
 * crash the app.
 *
 * If the object is owned by your code, you should still call this method when adequate, as
 * otherwise the memory will never be freed, causing a memory leak, which is to be avoided.
 *
 * The alias {@link EmscriptenObject.delete} is recommended instead, for readability.
 */
export function destroy(object: EmscriptenObject): void;

/**
 * Check that an Emscripten object is still alive, i.e. not destroyed from
 * JavaScript (ptr is 0) or from C++ (only for memory-tracked classes).
 *
 * In theory, a dead object should never be accessed. In practice this can
 * help prevent stale references to objects (deleted by JS: ptr will be 0,
 * or deleted in C++, only for tracked classes).
 * This is used just to add extra protection and should usually not be useful.
 *
 * @throws if the object is dead.
 */
export function assertObjectAlive(object: EmscriptenObject): void;

/** An independent Wasm allocation. copyBytes returns a JavaScript-owned copy. */
export type OwnedBinarySnapshot = {
  copyBytes(): Uint8Array;
  dispose(): void;
} & {
  // Expose the disposal protocol when the consumer includes ESNext.Disposable.
  [key in (typeof Symbol)[Extract<'dispose', keyof typeof Symbol>]]: () => void;
};

export function createOwnedBinarySnapshot(element: SerializerElement): OwnedBinarySnapshot;

export function _malloc(size: number): number;
export function _free(ptr: number): void;
export const HEAPU8: Uint8Array;
`;

const exportedTypeNames = Array.from(
  new Set(
    Array.from(dts.matchAll(/^export (?:class|enum|type) (\w+)/gm)).map(
      (m) => m[1]
    )
  )
);

const finalDts =
  dts +
  `
import type * as _GdModule from './types';

declare global {
  // \`var\` (not \`const\`) so that \`gd\` is also a property of \`globalThis\`: code can then
  // access it as \`global.gd\` / \`globalThis.gd\` without any cast.
  var gd: typeof _GdModule;

  // Companion type namespace so type positions like \`gd.Project\` keep resolving globally.
  namespace gd {
${exportedTypeNames.map((name) => `    export type ${name} = _GdModule.${name};`).join('\n')}
  }
}
`;

writeFileSync(__dirname + '/../types.d.ts', finalDts);
