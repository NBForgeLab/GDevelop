import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import {
  separateAngleBracketLineComments,
  synthesizeParamName,
} from './flow-to-ts-ast.mjs';

const require = createRequire(
  new URL('../../newIDE/app/package.json', import.meta.url)
);

const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const recast = require('recast');

export const TS_PARSER_PLUGINS = [
  'typescript',
  'jsx',
  'classProperties',
  'classPrivateProperties',
  'classPrivateMethods',
  'objectRestSpread',
  'optionalChaining',
  'nullishCoalescingOperator',
  'dynamicImport',
  'exportDefaultFrom',
  'exportNamespaceFrom',
  'numericSeparator',
  'logicalAssignment',
];

const SYNTHETIC_EVENT_MAP = {
  SyntheticEvent: 'SyntheticEvent',
  SyntheticMouseEvent: 'MouseEvent',
  SyntheticKeyboardEvent: 'KeyboardEvent',
  SyntheticDragEvent: 'DragEvent',
  SyntheticPointerEvent: 'PointerEvent',
  SyntheticFocusEvent: 'FocusEvent',
  SyntheticTouchEvent: 'TouchEvent',
  SyntheticClipboardEvent: 'ClipboardEvent',
  SyntheticWheelEvent: 'WheelEvent',
  SyntheticUIEvent: 'UIEvent',
  SyntheticInputEvent: 'FormEvent',
  SyntheticAnimationEvent: 'AnimationEvent',
  SyntheticTransitionEvent: 'TransitionEvent',
};

const PRIMITIVE_KEYWORD_BUILDERS = {
  any: () => t.tsAnyKeyword(),
  boolean: () => t.tsBooleanKeyword(),
  bigint: () => t.tsBigIntKeyword(),
  never: () => t.tsNeverKeyword(),
  null: () => t.tsNullKeyword(),
  number: () => t.tsNumberKeyword(),
  object: () => t.tsObjectKeyword(),
  string: () => t.tsStringKeyword(),
  symbol: () => t.tsSymbolKeyword(),
  undefined: () => t.tsUndefinedKeyword(),
  unknown: () => t.tsUnknownKeyword(),
  void: () => t.tsVoidKeyword(),
};

function parseTsWithRecast(source, useJsx = true) {
  const plugins = useJsx
    ? TS_PARSER_PLUGINS
    : TS_PARSER_PLUGINS.filter((p) => p !== 'jsx');
  return recast.parse(source, {
    parser: {
      parse(code) {
        return parser.parse(code, {
          sourceType: 'unambiguous',
          tokens: true,
          plugins,
        });
      },
    },
  });
}

function copyComments(fromNode, toNode) {
  if (!fromNode || !toNode) return toNode;
  if (fromNode.comments && fromNode.comments.length > 0) {
    toNode.comments = [...fromNode.comments];
  }
  if (fromNode.leadingComments && fromNode.leadingComments.length > 0) {
    toNode.leadingComments = [...fromNode.leadingComments];
  }
  if (fromNode.trailingComments && fromNode.trailingComments.length > 0) {
    toNode.trailingComments = [...fromNode.trailingComments];
  }
  return toNode;
}

function replaceTypeNodeSafely(pathObj, replacement) {
  copyComments(pathObj.node, replacement);
  const annPath = pathObj.parentPath;
  const fnPath = annPath && annPath.parentPath;
  if (
    annPath &&
    t.isTSTypeAnnotation(annPath.node) &&
    fnPath &&
    (t.isTSFunctionType(fnPath.node) || t.isTSConstructorType(fnPath.node)) &&
    fnPath.node.typeAnnotation === annPath.node
  ) {
    const fn = fnPath.node;
    const fresh = t.isTSConstructorType(fn)
      ? t.tsConstructorType(
          fn.typeParameters || null,
          fn.parameters || [],
          t.tsTypeAnnotation(replacement)
        )
      : t.tsFunctionType(
          fn.typeParameters || null,
          fn.parameters || [],
          t.tsTypeAnnotation(replacement)
        );
    copyComments(fn, fresh);
    fnPath.replaceWith(fresh);
    return;
  }
  pathObj.replaceWith(replacement);
}

function getQualifiedTypeName(typeName) {
  if (t.isIdentifier(typeName)) return typeName.name;
  if (t.isTSQualifiedName(typeName)) {
    const left = getQualifiedTypeName(typeName.left);
    return left ? `${left}.${typeName.right.name}` : null;
  }
  return null;
}

function buildQualifiedName(parts) {
  let node = t.identifier(parts[0]);
  for (let i = 1; i < parts.length; i++) {
    node = t.tsQualifiedName(node, t.identifier(parts[i]));
  }
  return node;
}

function isReactForwardRefCallee(callee, forwardRefLocalNames) {
  if (
    t.isMemberExpression(callee) &&
    t.isIdentifier(callee.object, { name: 'React' }) &&
    t.isIdentifier(callee.property, { name: 'forwardRef' })
  ) {
    return true;
  }
  if (t.isIdentifier(callee) && forwardRefLocalNames.has(callee.name)) {
    return true;
  }
  return false;
}

function isReactMemoCallee(callee, memoLocalNames) {
  if (
    t.isMemberExpression(callee) &&
    t.isIdentifier(callee.object, { name: 'React' }) &&
    t.isIdentifier(callee.property, { name: 'memo' })
  ) {
    return true;
  }
  if (t.isIdentifier(callee) && memoLocalNames.has(callee.name)) {
    return true;
  }
  return false;
}

function isReactComponentTypeRef(tsType) {
  if (!t.isTSTypeReference(tsType)) return false;
  const qn = getQualifiedTypeName(tsType.typeName);
  return qn === 'React.ComponentType' || qn === 'ComponentType';
}

function unwrapParens(node) {
  let cur = node;
  while (t.isParenthesizedExpression(cur)) cur = cur.expression;
  return cur;
}

function looksLikePropsTypeNode(node) {
  if (!node) return false;
  if (t.isTSTypeLiteral(node) || t.isTSIntersectionType(node)) return true;
  if (t.isTSTypeReference(node)) {
    const qn = getQualifiedTypeName(node.typeName) || '';
    return /(^|\.)Props$/.test(qn) || /Props$/.test(qn) || /Config$/.test(qn);
  }
  return false;
}

function looksLikeRefTypeNode(node) {
  if (!node) return false;
  if (t.isTSTypeReference(node)) {
    const qn = getQualifiedTypeName(node.typeName) || '';
    return (
      /Interface$/.test(qn) ||
      /^HTML.*Element$/.test(qn) ||
      /^SVG.*Element$/.test(qn) ||
      /Element$/.test(qn) ||
      /Ref$/.test(qn) ||
      qn === 'React.ElementRef'
    );
  }
  return false;
}

function shouldSwapForwardRefParams(params, mode) {
  if (!params || params.length !== 2) return false;
  if (mode === false) return false;
  if (mode === true) return true;
  // Auto heuristic for standalone CLI usage on already-converted files:
  const [first, second] = params;
  if (looksLikeRefTypeNode(first) && looksLikePropsTypeNode(second)) {
    return false;
  }
  if (looksLikePropsTypeNode(first) || looksLikeRefTypeNode(second)) {
    return true;
  }
  return false;
}

function getPropertyOrParamContextName(pathObj) {
  let cur = pathObj.parentPath;
  while (
    cur &&
    cur.node &&
    (t.isTSUnionType(cur.node) ||
      t.isTSParenthesizedType(cur.node) ||
      t.isTSArrayType(cur.node))
  ) {
    cur = cur.parentPath;
  }
  if (!cur || !t.isTSTypeAnnotation(cur.node)) return null;
  const owner = cur.parentPath?.node;
  if (t.isIdentifier(owner)) return owner.name;
  if (t.isTSPropertySignature(owner) && t.isIdentifier(owner.key)) {
    return owner.key.name;
  }
  if (t.isClassProperty(owner) && t.isIdentifier(owner.key)) {
    return owner.key.name;
  }
  return null;
}

function stripFlowPragmasFromSource(source) {
  // Remove standalone // @flow, // @flow strict, // @flow weak, /* @flow */, /** * @flow */
  let removed = 0;
  let result = source;

  // 1. Single-line // @flow ... or /* @flow */ or /** @flow */ on its own line
  result = result.replace(
    /^[ \t]*(?:\/\/\s*@flow(?:\s+(?:strict(?:-local)?|weak))?\s*|\/\*\*?\s*@flow(?:\s+(?:strict(?:-local)?|weak))?\s*\*\/)[ \t]*(?:\r?\n|$)/gm,
    () => {
      removed++;
      return '';
    }
  );

  // 2. Multi-line JSDoc containing `* @flow` line alongside other lines
  result = result.replace(
    /^[ \t]*\*[ \t]*@flow(?:\s+(?:strict(?:-local)?|weak))?[ \t]*\r?\n/gm,
    () => {
      removed++;
      return '';
    }
  );

  // 3. Empty JSDoc blocks left behind if `* @flow` was inside a multi-line comment
  result = result.replace(/^[ \t]*\/\*\*\s*\*\/[ \t]*\r?\n/gm, () => '');

  return { code: result, removed };
}

function transformSuppressionCommentsInSource(source) {
  // Transform comment occurrences using @babel/parser comment locations so strings are untouched
  let comments = [];
  try {
    const parsed = parser.parse(source, {
      sourceType: 'unambiguous',
      tokens: false,
      plugins: TS_PARSER_PLUGINS,
    });
    comments = parsed.comments || [];
  } catch {
    return { code: source, count: 0 };
  }

  const edits = [];
  let count = 0;

  for (const comment of comments) {
    const raw = source.slice(comment.start, comment.end);
    if (!/\$Flow(?:FixMe|Ignore|ExpectedError)\b/.test(raw)) continue;

    const updated = raw.replace(
      /\$Flow(?:FixMe|Ignore|ExpectedError)(?:\[([^\]]+)\])?/g,
      (_, code) => {
        count++;
        return code
          ? `@ts-expect-error [flow-migrated: ${code}]`
          : '@ts-expect-error [flow-migrated]';
      }
    );

    if (updated !== raw) {
      edits.push({ start: comment.start, end: comment.end, text: updated });
    }
  }

  if (edits.length === 0) return { code: source, count: 0 };
  edits.sort((a, b) => b.start - a.start);
  let out = source;
  for (const e of edits) {
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
  }
  return { code: out, count };
}

function fixUnnamedParametersOnList(params) {
  if (!params || params.length === 0) return 0;
  let fixed = 0;
  const usedNames = new Set();

  for (const p of params) {
    if (t.isIdentifier(p) && p.typeAnnotation) {
      usedNames.add(p.name);
    } else if (
      t.isRestElement(p) &&
      t.isIdentifier(p.argument) &&
      p.typeAnnotation
    ) {
      usedNames.add(p.argument.name);
    }
  }

  for (let i = 0; i < params.length; i++) {
    const p = params[i];
    if (t.isIdentifier(p) && !p.typeAnnotation) {
      const builder = PRIMITIVE_KEYWORD_BUILDERS[p.name];
      const tsType = builder
        ? builder()
        : t.tsTypeReference(t.identifier(p.name));
      const newName = synthesizeParamName(tsType, i, usedNames);
      const nextId = t.identifier(newName);
      if (p.optional) nextId.optional = true;
      nextId.typeAnnotation = t.tsTypeAnnotation(tsType);
      copyComments(p, nextId);
      params[i] = nextId;
      fixed++;
    }
  }
  return fixed;
}

function buildReactImportStatement(valueImportNeeded) {
  const decl = t.importDeclaration(
    [t.importNamespaceSpecifier(t.identifier('React'))],
    t.stringLiteral('react')
  );
  if (!valueImportNeeded) {
    decl.importKind = 'type';
  }
  return decl;
}

/**
 * Applies GDevelop-specific Flow-to-TypeScript AST and comment post-processing.
 *
 * @param {string} source
 * @param {object} [options]
 * @param {boolean|'auto'} [options.swapForwardRef='auto']
 * @param {boolean} [options.useJsx=true]
 */
export function postprocessTypeScriptSource(source, options = {}) {
  const swapForwardRefMode =
    options.swapForwardRef !== undefined ? options.swapForwardRef : 'auto';
  const useJsx = options.useJsx !== undefined ? options.useJsx : true;

  const stats = {
    pragmasRemoved: 0,
    forwardRefsSwapped: 0,
    memoTypeArgsRemoved: 0,
    forwardRefComponentTypeStripped: 0,
    unnamedParamsFixed: 0,
    reactTypesMapped: 0,
    flowUtilsMapped: 0,
    suppressionsMapped: 0,
    reactImportAdded: false,
  };

  // Step 1: Strip Flow pragmas
  const pragmaPass = stripFlowPragmasFromSource(source);
  let current = pragmaPass.code;
  stats.pragmasRemoved = pragmaPass.removed;

  // Step 2: Transform AST using recast + @babel/parser (typescript + jsx)
  let ast;
  try {
    ast = parseTsWithRecast(current, useJsx);
  } catch (err) {
    if (useJsx) {
      ast = parseTsWithRecast(current, false);
    } else {
      throw err;
    }
  }

  let hasReactImportOrBinding = false;
  let needsReactNamespace = false;
  let usesReactAsValueOrJsx = false;
  let reactNodeLocalName = null;
  let reactElementLocalName = null;
  let axiosErrorLocalNames = new Set();
  const forwardRefLocalNames = new Set();
  const memoLocalNames = new Set();

  // Pre-scan imports & JSX
  traverse(ast, {
    JSXElement() {
      usesReactAsValueOrJsx = true;
    },
    JSXFragment() {
      usesReactAsValueOrJsx = true;
    },
    ImportDeclaration(pathObj) {
      const src = pathObj.node.source.value;
      if (src === 'react') {
        const specs = pathObj.node.specifiers;
        for (let i = specs.length - 1; i >= 0; i--) {
          const spec = specs[i];
          if (
            t.isImportDefaultSpecifier(spec) ||
            t.isImportNamespaceSpecifier(spec)
          ) {
            if (spec.local.name === 'React') {
              hasReactImportOrBinding = true;
            }
          } else if (t.isImportSpecifier(spec)) {
            const importedName = t.isIdentifier(spec.imported)
              ? spec.imported.name
              : spec.imported.value;
            if (importedName === 'Node') {
              if (spec.local.name === 'Node') {
                reactNodeLocalName = 'Node';
                spec.imported = t.identifier('ReactNode');
                spec.local = t.identifier('ReactNode');
              } else {
                // `import { type Node as ReactNode } from 'react'`
                spec.imported = t.identifier('ReactNode');
              }
              stats.reactTypesMapped++;
            } else if (importedName === 'Element') {
              if (spec.local.name === 'Element') {
                reactElementLocalName = 'Element';
                spec.imported = t.identifier('ReactElement');
                spec.local = t.identifier('ReactElement');
              } else {
                // `import { type Element as ReactElement } from 'react'`
                spec.imported = t.identifier('ReactElement');
              }
              stats.reactTypesMapped++;
            } else if (importedName === 'forwardRef') {
              forwardRefLocalNames.add(spec.local.name);
            } else if (importedName === 'memo') {
              memoLocalNames.add(spec.local.name);
            }
          }
        }
      } else if (src === 'axios') {
        for (const spec of pathObj.node.specifiers) {
          if (t.isImportSpecifier(spec)) {
            const importedName = t.isIdentifier(spec.imported)
              ? spec.imported.name
              : spec.imported.value;
            if (importedName === '$AxiosError') {
              axiosErrorLocalNames.add(spec.local.name);
              spec.imported = t.identifier('AxiosError');
              if (spec.local.name === '$AxiosError') {
                spec.local = t.identifier('AxiosError');
              }
              stats.flowUtilsMapped++;
            }
          }
        }
      }
    },
  });

  // Main post-processing traversal
  traverse(ast, {
    Identifier(pathObj) {
      if (pathObj.node.name === 'React' && !pathObj.isBindingIdentifier()) {
        const parent = pathObj.parent;
        if (t.isMemberExpression(parent) && parent.object === pathObj.node) {
          usesReactAsValueOrJsx = true;
        }
      }
    },

    TSAsExpression(pathObj) {
      const node = pathObj.node;
      if (!isReactComponentTypeRef(node.typeAnnotation)) return;
      const inner = unwrapParens(node.expression);
      const isForwardRefExpr =
        t.isCallExpression(inner) &&
        isReactForwardRefCallee(inner.callee, forwardRefLocalNames);
      const isMemoForwardRefExpr =
        t.isCallExpression(inner) &&
        isReactMemoCallee(inner.callee, memoLocalNames) &&
        inner.arguments &&
        inner.arguments[0] &&
        t.isCallExpression(unwrapParens(inner.arguments[0])) &&
        isReactForwardRefCallee(
          unwrapParens(inner.arguments[0]).callee,
          forwardRefLocalNames
        );
      if (isForwardRefExpr || isMemoForwardRefExpr) {
        copyComments(node, inner);
        stats.forwardRefComponentTypeStripped++;
        pathObj.replaceWith(inner);
      }
    },

    MemberExpression(pathObj) {
      const node = pathObj.node;
      if (
        !node.computed &&
        t.isIdentifier(node.object, { name: 'global' }) &&
        t.isIdentifier(node.property, { name: 'gd' }) &&
        !pathObj.scope.hasBinding('global')
      ) {
        const parent = pathObj.parent;
        const parentPath = pathObj.parentPath;
        if (
          t.isTSAsExpression(parent) &&
          t.isTSAnyKeyword(parent.typeAnnotation)
        ) {
          return;
        }
        const safeGlobal = t.memberExpression(
          t.parenthesizedExpression(
            t.tsAsExpression(t.identifier('global'), t.tsAnyKeyword())
          ),
          t.identifier('gd')
        );

        const isAssignmentTarget =
          (t.isAssignmentExpression(parent) && parent.left === node) ||
          (t.isUpdateExpression(parent) && parent.argument === node) ||
          (t.isUnaryExpression(parent, { operator: 'delete' }) &&
            parent.argument === node);

        const isAlreadyTypedVar =
          t.isVariableDeclarator(parent) && parent.id?.typeAnnotation;

        let replacement;
        if (isAssignmentTarget || isAlreadyTypedVar) {
          replacement = safeGlobal;
        } else {
          const typed = t.tsAsExpression(
            safeGlobal,
            t.tsTypeReference(t.identifier('libGDevelop'))
          );
          const needsParens =
            ((t.isMemberExpression(parent) ||
              t.isOptionalMemberExpression(parent)) &&
              pathObj.key === 'object') ||
            ((t.isCallExpression(parent) ||
              t.isOptionalCallExpression(parent) ||
              t.isNewExpression(parent)) &&
              pathObj.key === 'callee') ||
            t.isUnaryExpression(parent) ||
            t.isBinaryExpression(parent) ||
            t.isLogicalExpression(parent);
          replacement = needsParens ? t.parenthesizedExpression(typed) : typed;
        }

        copyComments(node, replacement);
        stats.flowUtilsMapped++;
        pathObj.replaceWith(replacement);
        pathObj.skip();
      }
    },

    CallExpression(pathObj) {
      const node = pathObj.node;
      // React.useRef(null as T | null | undefined) -> React.useRef<T | null>(null)
      const isUseRef =
        (t.isMemberExpression(node.callee) &&
          t.isIdentifier(node.callee.object, { name: 'React' }) &&
          t.isIdentifier(node.callee.property, { name: 'useRef' })) ||
        t.isIdentifier(node.callee, { name: 'useRef' });
      if (
        isUseRef &&
        !node.typeParameters &&
        node.arguments.length === 1
      ) {
        const arg = unwrapParens(node.arguments[0]);
        if (
          t.isTSAsExpression(arg) &&
          t.isNullLiteral(unwrapParens(arg.expression)) &&
          t.isTSUnionType(arg.typeAnnotation)
        ) {
          let hasMutableCurrentAssignment = false;
          const parentDecl = pathObj.parentPath?.node;
          if (t.isVariableDeclarator(parentDecl) && t.isIdentifier(parentDecl.id)) {
            const binding = pathObj.scope.getBinding(parentDecl.id.name);
            if (binding) {
              for (const refPath of binding.referencePaths) {
                const mem = refPath.parentPath;
                if (
                  mem &&
                  t.isMemberExpression(mem.node) &&
                  t.isIdentifier(mem.node.property, { name: 'current' }) &&
                  mem.parentPath &&
                  t.isAssignmentExpression(mem.parentPath.node) &&
                  mem.parentPath.node.left === mem.node
                ) {
                  hasMutableCurrentAssignment = true;
                  break;
                }
              }
            }
          }
          if (!hasMutableCurrentAssignment) {
            const nonUndefined = arg.typeAnnotation.types.filter(
              (m) => !t.isTSUndefinedKeyword(m)
            );
            if (
              nonUndefined.length > 0 &&
              nonUndefined.length < arg.typeAnnotation.types.length
            ) {
              const cleanedType =
                nonUndefined.length === 1
                  ? nonUndefined[0]
                  : t.tsUnionType(nonUndefined);
              node.typeParameters = t.tsTypeParameterInstantiation([cleanedType]);
              node.arguments[0] = t.nullLiteral();
              stats.reactTypesMapped++;
            }
          }
        }
      } else if (
        isUseRef &&
        node.typeParameters &&
        node.typeParameters.params &&
        node.typeParameters.params.length === 1 &&
        node.arguments.length === 1 &&
        t.isNullLiteral(unwrapParens(node.arguments[0])) &&
        t.isTSUnionType(node.typeParameters.params[0])
      ) {
        const unionNode = node.typeParameters.params[0];
        const hasNull = unionNode.types.some((m) => t.isTSNullKeyword(m));
        const hasUndefined = unionNode.types.some((m) =>
          t.isTSUndefinedKeyword(m)
        );
        if (hasNull && hasUndefined) {
          let assignsUndefinedToCurrent = false;
          const parentDecl = pathObj.parentPath?.node;
          if (
            t.isVariableDeclarator(parentDecl) &&
            t.isIdentifier(parentDecl.id)
          ) {
            const binding = pathObj.scope.getBinding(parentDecl.id.name);
            if (binding) {
              for (const refPath of binding.referencePaths) {
                const mem = refPath.parentPath;
                if (
                  mem &&
                  t.isMemberExpression(mem.node) &&
                  t.isIdentifier(mem.node.property, { name: 'current' }) &&
                  mem.parentPath &&
                  t.isAssignmentExpression(mem.parentPath.node) &&
                  mem.parentPath.node.left === mem.node &&
                  t.isIdentifier(mem.parentPath.node.right, {
                    name: 'undefined',
                  })
                ) {
                  assignsUndefinedToCurrent = true;
                  break;
                }
              }
            }
          }
          if (!assignsUndefinedToCurrent) {
            const nonUndefined = unionNode.types.filter(
              (m) => !t.isTSUndefinedKeyword(m)
            );
            if (nonUndefined.length > 0) {
              node.typeParameters.params[0] =
                nonUndefined.length === 1
                  ? nonUndefined[0]
                  : t.tsUnionType(nonUndefined);
              stats.reactTypesMapped++;
            }
          }
        }
      }

      if (isReactForwardRefCallee(node.callee, forwardRefLocalNames)) {
        const tp = node.typeParameters || node.typeArguments;
        if (
          tp &&
          tp.params &&
          tp.params.length === 2 &&
          shouldSwapForwardRefParams(tp.params, swapForwardRefMode)
        ) {
          const [first, second] = tp.params;
          const hasParamComments =
            (first.leadingComments && first.leadingComments.length > 0) ||
            (second.leadingComments && second.leadingComments.length > 0);
          if (hasParamComments) {
            const paramCommentSet = new Set([
              ...(first.leadingComments || []),
              ...(second.leadingComments || []),
            ]);
            if (node.callee && node.callee.comments) {
              node.callee.comments = node.callee.comments.filter(
                (c) => !paramCommentSet.has(c)
              );
            }
            if (
              node.arguments &&
              node.arguments[0] &&
              node.arguments[0].comments
            ) {
              node.arguments[0].comments = node.arguments[0].comments.filter(
                (c) => !paramCommentSet.has(c)
              );
            }
            if (first.leadingComments && first.leadingComments.length > 0) {
              first.comments = first.leadingComments.map((c) => ({
                ...c,
                leading: true,
                trailing: false,
              }));
            }
            if (second.leadingComments && second.leadingComments.length > 0) {
              second.comments = second.leadingComments.map((c) => ({
                ...c,
                leading: true,
                trailing: false,
              }));
            }
            if (node.typeParameters) {
              node.typeParameters = t.tsTypeParameterInstantiation([
                second,
                first,
              ]);
            } else {
              tp.params = [second, first];
            }
          } else {
            tp.params = [second, first];
          }
          stats.forwardRefsSwapped++;
        }
      }

      if (isReactMemoCallee(node.callee, memoLocalNames)) {
        const firstArg = node.arguments && unwrapParens(node.arguments[0]);
        const isWrappingForwardRef =
          firstArg &&
          t.isCallExpression(firstArg) &&
          isReactForwardRefCallee(firstArg.callee, forwardRefLocalNames);
        const tp = node.typeParameters || node.typeArguments;
        const hasMultiFlowTypeArgs = tp && tp.params && tp.params.length > 1;
        if (isWrappingForwardRef || hasMultiFlowTypeArgs) {
          if (node.typeParameters) {
            node.typeParameters = null;
            stats.memoTypeArgsRemoved++;
          }
          if (node.typeArguments) {
            node.typeArguments = null;
            stats.memoTypeArgsRemoved++;
          }
        }
      }
    },

    VariableDeclarator(pathObj) {
      const node = pathObj.node;
      if (!t.isIdentifier(node.id) || !node.id.typeAnnotation || !node.init) {
        return;
      }
      const tsType = node.id.typeAnnotation.typeAnnotation;
      if (!isReactComponentTypeRef(tsType)) return;

      const init = unwrapParens(node.init);
      const isForwardRefInit =
        t.isCallExpression(init) &&
        isReactForwardRefCallee(init.callee, forwardRefLocalNames);
      const isMemoForwardRefInit =
        t.isCallExpression(init) &&
        isReactMemoCallee(init.callee, memoLocalNames) &&
        init.arguments &&
        init.arguments[0] &&
        t.isCallExpression(unwrapParens(init.arguments[0])) &&
        isReactForwardRefCallee(
          unwrapParens(init.arguments[0]).callee,
          forwardRefLocalNames
        );

      if (isForwardRefInit || isMemoForwardRefInit) {
        node.id.typeAnnotation = null;
        stats.forwardRefComponentTypeStripped++;
      }
    },

    TSFunctionType(pathObj) {
      stats.unnamedParamsFixed += fixUnnamedParametersOnList(
        pathObj.node.parameters
      );
    },

    TSConstructorType(pathObj) {
      stats.unnamedParamsFixed += fixUnnamedParametersOnList(
        pathObj.node.parameters
      );
    },

    TSCallSignatureDeclaration(pathObj) {
      stats.unnamedParamsFixed += fixUnnamedParametersOnList(
        pathObj.node.parameters
      );
    },

    TSConstructSignatureDeclaration(pathObj) {
      stats.unnamedParamsFixed += fixUnnamedParametersOnList(
        pathObj.node.parameters
      );
    },

    TSMethodSignature(pathObj) {
      stats.unnamedParamsFixed += fixUnnamedParametersOnList(
        pathObj.node.parameters
      );
    },

    TSTypeReference: {
      exit(pathObj) {
        const node = pathObj.node;
        const qn = getQualifiedTypeName(node.typeName);
        if (!qn) return;
        const typeArgs =
          node.typeParameters && node.typeParameters.params
            ? node.typeParameters.params
            : [];

        // React.* mappings
        if (qn === 'React.Node' || qn === 'React$Node') {
          node.typeName = buildQualifiedName(['React', 'ReactNode']);
          node.typeParameters = null;
          needsReactNamespace = true;
          stats.reactTypesMapped++;
          return;
        }
        if (qn === 'React$Portal') {
          node.typeName = buildQualifiedName(['React', 'ReactPortal']);
          node.typeParameters = null;
          needsReactNamespace = true;
          stats.reactTypesMapped++;
          return;
        }
        if (qn === 'React$RefObject') {
          node.typeName = buildQualifiedName(['React', 'RefObject']);
          needsReactNamespace = true;
          stats.reactTypesMapped++;
          return;
        }
        if (
          (qn === 'React.ElementRef' || qn === 'React$ElementRef') &&
          typeArgs.length === 1 &&
          t.isTSAnyKeyword(typeArgs[0])
        ) {
          stats.reactTypesMapped++;
          replaceTypeNodeSafely(pathObj, t.tsAnyKeyword());
          return;
        }
        if (qn === 'React$ElementRef') {
          node.typeName = buildQualifiedName(['React', 'ElementRef']);
          needsReactNamespace = true;
          stats.reactTypesMapped++;
          return;
        }
        if (qn === 'React$ComponentType') {
          node.typeName = buildQualifiedName(['React', 'ComponentType']);
          needsReactNamespace = true;
          stats.reactTypesMapped++;
          return;
        }
        if (
          qn === 'React.ElementProps' ||
          qn === 'React$ElementProps' ||
          qn === 'React.ElementConfig' ||
          qn === 'React$ElementConfig'
        ) {
          node.typeName = buildQualifiedName(['React', 'ComponentProps']);
          needsReactNamespace = true;
          stats.reactTypesMapped++;
          return;
        }
        if (reactNodeLocalName && qn === reactNodeLocalName) {
          node.typeName = t.identifier('ReactNode');
          stats.reactTypesMapped++;
          return;
        }
        if (reactElementLocalName && qn === reactElementLocalName) {
          node.typeName = t.identifier('ReactElement');
          if (typeArgs.length === 1 && !t.isTSAnyKeyword(typeArgs[0])) {
            node.typeParameters = t.tsTypeParameterInstantiation([
              t.tsAnyKeyword(),
              typeArgs[0],
            ]);
          }
          stats.reactTypesMapped++;
          return;
        }
        if (qn === 'React.MixedElement' || qn === 'React$MixedElement') {
          node.typeName = buildQualifiedName(['React', 'ReactElement']);
          node.typeParameters = t.tsTypeParameterInstantiation([
            t.tsAnyKeyword(),
          ]);
          needsReactNamespace = true;
          stats.reactTypesMapped++;
          return;
        }
        if (qn === 'React.Element' || qn === 'React$Element') {
          node.typeName = buildQualifiedName(['React', 'ReactElement']);
          if (typeArgs.length === 1 && !t.isTSAnyKeyword(typeArgs[0])) {
            node.typeParameters = t.tsTypeParameterInstantiation([
              t.tsAnyKeyword(),
              typeArgs[0],
            ]);
          }
          needsReactNamespace = true;
          stats.reactTypesMapped++;
          return;
        }
        if (qn === 'React.RefSetter' || qn === 'React$RefSetter') {
          node.typeName = buildQualifiedName(['React', 'Ref']);
          needsReactNamespace = true;
          stats.reactTypesMapped++;
          return;
        }
        if (
          (qn === 'React.AbstractComponent' ||
            qn === 'React$AbstractComponent') &&
          typeArgs.length >= 1
        ) {
          node.typeName = buildQualifiedName(['React', 'ComponentType']);
          if (typeArgs.length >= 2) {
            const refAttr = t.tsTypeReference(
              buildQualifiedName(['React', 'RefAttributes']),
              t.tsTypeParameterInstantiation([typeArgs[1]])
            );
            node.typeParameters = t.tsTypeParameterInstantiation([
              t.tsIntersectionType([typeArgs[0], refAttr]),
            ]);
          }
          needsReactNamespace = true;
          stats.reactTypesMapped++;
          return;
        }
        if (SYNTHETIC_EVENT_MAP[qn]) {
          node.typeName = buildQualifiedName(['React', SYNTHETIC_EVENT_MAP[qn]]);
          if (node.typeParameters && node.typeParameters.params.length === 0) {
            node.typeParameters = null;
          }
          needsReactNamespace = true;
          stats.reactTypesMapped++;
          return;
        }

        // Timer IDs
        if (qn === 'TimeoutID' || qn === 'IntervalID') {
          const fnName = qn === 'TimeoutID' ? 'setTimeout' : 'setInterval';
          const replacement = t.tsTypeReference(
            t.identifier('ReturnType'),
            t.tsTypeParameterInstantiation([
              t.tsTypeQuery(t.identifier(fnName)),
            ])
          );
          stats.flowUtilsMapped++;
          replaceTypeNodeSafely(pathObj, replacement);
          return;
        }
        if (qn === 'AnimationFrameID') {
          stats.flowUtilsMapped++;
          replaceTypeNodeSafely(pathObj, t.tsNumberKeyword());
          return;
        }

        // JestMockFn<Args, Ret> -> jest.Mock<Ret, Args>
        if (qn === 'JestMockFn') {
          node.typeName = buildQualifiedName(['jest', 'Mock']);
          if (typeArgs.length === 2) {
            node.typeParameters = t.tsTypeParameterInstantiation([
              typeArgs[1],
              typeArgs[0],
            ]);
          }
          stats.flowUtilsMapped++;
          return;
        }

        // AxiosError
        if (qn === '$AxiosError' || axiosErrorLocalNames.has(qn)) {
          node.typeName = t.identifier('AxiosError');
          node.typeParameters = null;
          stats.flowUtilsMapped++;
          return;
        }

        // Flow utility types
        if (qn === '$Keys' && typeArgs.length === 1) {
          const op = t.tsTypeOperator(typeArgs[0]);
          op.operator = 'keyof';
          stats.flowUtilsMapped++;
          replaceTypeNodeSafely(pathObj, op);
          return;
        }
        if (qn === '$Shape' && typeArgs.length === 1) {
          node.typeName = t.identifier('Partial');
          stats.flowUtilsMapped++;
          return;
        }
        if (qn === '$ReadOnly' && typeArgs.length === 1) {
          node.typeName = t.identifier('Readonly');
          stats.flowUtilsMapped++;
          return;
        }
        if (qn === '$ReadOnlyArray' && typeArgs.length === 1) {
          node.typeName = t.identifier('ReadonlyArray');
          stats.flowUtilsMapped++;
          return;
        }
        if (qn === '$Exact' && typeArgs.length === 1) {
          stats.flowUtilsMapped++;
          replaceTypeNodeSafely(pathObj, typeArgs[0]);
          return;
        }
        if (qn === '$NonMaybeType' && typeArgs.length === 1) {
          node.typeName = t.identifier('NonNullable');
          stats.flowUtilsMapped++;
          return;
        }
        if (qn === '$Values' && typeArgs.length === 1) {
          const keyofNode = t.tsTypeOperator(typeArgs[0]);
          keyofNode.operator = 'keyof';
          const indexed = t.tsIndexedAccessType(typeArgs[0], keyofNode);
          stats.flowUtilsMapped++;
          replaceTypeNodeSafely(pathObj, indexed);
          return;
        }
        if (
          (qn === '$PropertyType' || qn === '$ElementType') &&
          typeArgs.length === 2
        ) {
          const indexed = t.tsIndexedAccessType(typeArgs[0], typeArgs[1]);
          stats.flowUtilsMapped++;
          replaceTypeNodeSafely(pathObj, indexed);
          return;
        }
        if (qn === '$Iterable' && typeArgs.length >= 1) {
          node.typeName = t.identifier('Iterable');
          node.typeParameters = t.tsTypeParameterInstantiation([typeArgs[0]]);
          stats.flowUtilsMapped++;
          return;
        }
        if (qn === 'Class' && typeArgs.length === 1) {
          const target = typeArgs[0];
          let replacement;
          if (t.isTSTypeReference(target) && !target.typeParameters) {
            replacement = t.tsTypeQuery(target.typeName);
          } else {
            const argsId = t.identifier('args');
            argsId.typeAnnotation = t.tsTypeAnnotation(
              t.tsTypeReference(
                t.identifier('Array'),
                t.tsTypeParameterInstantiation([t.tsAnyKeyword()])
              )
            );
            const rest = t.restElement(argsId);
            rest.typeAnnotation = argsId.typeAnnotation;
            argsId.typeAnnotation = null;
            const ctor = t.tsConstructorType(
              null,
              [rest],
              t.tsTypeAnnotation(target)
            );
            const parent = pathObj.parent;
            replacement =
              t.isTSUnionType(parent) ||
              t.isTSIntersectionType(parent) ||
              t.isTSArrayType(parent)
                ? t.tsParenthesizedType(ctor)
                : ctor;
          }
          stats.flowUtilsMapped++;
          replaceTypeNodeSafely(pathObj, replacement);
          return;
        }

        // Legacy Flow keywords/catch-alls
        if (qn === 'mixed' && typeArgs.length === 0) {
          stats.flowUtilsMapped++;
          replaceTypeNodeSafely(pathObj, t.tsUnknownKeyword());
          return;
        }
        if (qn === 'empty' && typeArgs.length === 0) {
          stats.flowUtilsMapped++;
          replaceTypeNodeSafely(pathObj, t.tsNeverKeyword());
          return;
        }
        if (qn === 'Object' && typeArgs.length === 0) {
          const ctxName = getPropertyOrParamContextName(pathObj);
          let replacement;
          if (ctxName === 'style' || ctxName === 'styles') {
            replacement = t.tsTypeReference(
              buildQualifiedName(['React', 'CSSProperties'])
            );
            needsReactNamespace = true;
          } else {
            replacement = t.tsTypeReference(
              t.identifier('Record'),
              t.tsTypeParameterInstantiation([
                t.tsStringKeyword(),
                t.tsAnyKeyword(),
              ])
            );
          }
          stats.flowUtilsMapped++;
          replaceTypeNodeSafely(pathObj, replacement);
          return;
        }
        if (qn === 'Function' && typeArgs.length === 0) {
          const restParam = t.restElement(t.identifier('args'));
          restParam.typeAnnotation = t.tsTypeAnnotation(
            t.tsTypeReference(
              t.identifier('Array'),
              t.tsTypeParameterInstantiation([t.tsAnyKeyword()])
            )
          );
          const fnType = t.tsFunctionType(
            null,
            [restParam],
            t.tsTypeAnnotation(t.tsAnyKeyword())
          );
          const parent = pathObj.parent;
          const wrapped =
            t.isTSUnionType(parent) ||
            t.isTSIntersectionType(parent) ||
            t.isTSArrayType(parent)
              ? t.tsParenthesizedType(fnType)
              : fnType;
          stats.flowUtilsMapped++;
          replaceTypeNodeSafely(pathObj, wrapped);
        }
      },
    },

    TSIntersectionType: {
      exit(pathObj) {
        // Simplify redundant empty type literal `{}` in intersections like `Props & {}`
        const filtered = pathObj.node.types.filter(
          (member) =>
            !(t.isTSTypeLiteral(member) && member.members.length === 0)
        );
        if (filtered.length === 1) {
          pathObj.replaceWith(filtered[0]);
        } else if (filtered.length > 1 && filtered.length !== pathObj.node.types.length) {
          pathObj.node.types = filtered;
        }
      },
    },
  });

  if (needsReactNamespace && !hasReactImportOrBinding) {
    const reactImport = buildReactImportStatement(usesReactAsValueOrJsx);
    let lastImportIdx = -1;
    for (let i = 0; i < ast.program.body.length; i++) {
      if (t.isImportDeclaration(ast.program.body[i])) {
        lastImportIdx = i;
      }
    }
    if (lastImportIdx >= 0) {
      ast.program.body.splice(lastImportIdx + 1, 0, reactImport);
    } else if (ast.program.body.length > 0) {
      // Preserve leading file comments on body[0]
      const firstStmt = ast.program.body[0];
      if (firstStmt.comments && firstStmt.comments.length > 0) {
        reactImport.comments = firstStmt.comments;
        firstStmt.comments = null;
      }
      ast.program.body.unshift(reactImport);
    } else {
      ast.program.body.unshift(reactImport);
    }
    stats.reactImportAdded = true;
  }

  const lineTerminator = source.includes('\r\n') ? '\r\n' : '\n';
  current = recast.print(ast, { lineTerminator }).code;
  current = separateAngleBracketLineComments(current, TS_PARSER_PLUGINS);

  // Step 3: Map $FlowFixMe / $FlowIgnore / $FlowExpectedError comments
  const suppPass = transformSuppressionCommentsInSource(current);
  current = suppPass.code;
  stats.suppressionsMapped = suppPass.count;

  return {
    code: current,
    changed: current !== source,
    stats,
  };
}

/**
 * jscodeshift-compatible transform export:
 *   jscodeshift -t scripts/codemods/gdevelop-flow-to-ts-postprocess.mjs <file>
 */
export default function jscodeshiftTransformer(fileInfo, _api, options = {}) {
  const isJsx =
    fileInfo.path.endsWith('.tsx') || fileInfo.path.endsWith('.jsx');
  const result = postprocessTypeScriptSource(fileInfo.source, {
    swapForwardRef:
      options.swapForwardRef !== undefined ? options.swapForwardRef : 'auto',
    useJsx: isJsx || undefined,
  });
  return result.changed ? result.code : undefined;
}

function runCli() {
  const args = process.argv.slice(2);
  let dryRun = false;
  let stdout = false;
  let swapForwardRef = 'auto';
  const files = [];

  for (const arg of args) {
    if (arg === '--dry-run') dryRun = true;
    else if (arg === '--stdout') stdout = true;
    else if (arg === '--write') dryRun = false;
    else if (arg === '--swap-forward-ref' || arg === '--from-flow') {
      swapForwardRef = true;
    } else if (arg === '--no-swap-forward-ref') {
      swapForwardRef = false;
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: node scripts/codemods/gdevelop-flow-to-ts-postprocess.mjs [--dry-run] [--stdout] [--swap-forward-ref|--no-swap-forward-ref] <file...>'
      );
      process.exit(0);
    } else {
      files.push(arg);
    }
  }

  if (files.length === 0) {
    console.error('Error: Please provide at least one TypeScript file path.');
    process.exit(1);
  }

  for (const rawFile of files) {
    const resolved = path.resolve(process.cwd(), rawFile);
    const input = fs.readFileSync(resolved, 'utf8');
    const result = postprocessTypeScriptSource(input, {
      swapForwardRef,
      useJsx: resolved.endsWith('.tsx') || resolved.endsWith('.jsx'),
    });
    if (stdout) {
      process.stdout.write(result.code);
    } else if (!dryRun && result.changed) {
      fs.writeFileSync(resolved, result.code, 'utf8');
      console.log(`Post-processed ${rawFile}`, result.stats);
    } else {
      console.log(
        `${dryRun ? '[dry-run] ' : ''}${rawFile} (changed=${result.changed})`,
        result.stats
      );
    }
  }
}

const isExecutedDirectly =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isExecutedDirectly) {
  runCli();
}
