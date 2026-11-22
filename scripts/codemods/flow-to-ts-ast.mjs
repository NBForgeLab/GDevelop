import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(
  new URL('../../newIDE/app/package.json', import.meta.url)
);

const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const recast = require('recast');

export const FLOW_PARSER_PLUGINS = [
  'flow',
  'flowComments',
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

const RESERVED_PARAM_NAMES = new Set([
  'any',
  'array',
  'boolean',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'mixed',
  'never',
  'new',
  'null',
  'number',
  'object',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'string',
  'super',
  'switch',
  'symbol',
  'this',
  'throw',
  'true',
  'try',
  'type',
  'typeof',
  'undefined',
  'unknown',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

export function parseFlowWithRecast(source) {
  return recast.parse(source, {
    parser: {
      parse(code) {
        return parser.parse(code, {
          sourceType: 'unambiguous',
          tokens: true,
          plugins: FLOW_PARSER_PLUGINS,
        });
      },
    },
  });
}

/**
 * Unwraps Flow comment annotations (`/*: T *\/`, `/*:: ... *\/`, `/*flow-include ... *\/`)
 * using @babel/parser's lexer comments so string literals and non-Flow comments are untouched.
 */
export function unwrapFlowComments(source) {
  const ast = parser.parse(source, {
    sourceType: 'unambiguous',
    tokens: true,
    plugins: FLOW_PARSER_PLUGINS.filter((p) => p !== 'flowComments'),
  });

  const comments = ast.comments || [];
  const edits = [];

  for (const comment of comments) {
    if (comment.type !== 'CommentBlock') continue;
    const raw = source.slice(comment.start, comment.end);
    if (raw.startsWith('/*::')) {
      const inner = raw.slice(4, -2);
      edits.push({ start: comment.start, end: comment.end, text: inner });
    } else if (/^\/\*flow-include\b/.test(raw)) {
      const inner = raw.slice('/*flow-include'.length, -2);
      edits.push({ start: comment.start, end: comment.end, text: inner });
    } else if (raw.startsWith('/*:') && !raw.startsWith('/*::')) {
      const inner = raw.slice(3, -2);
      // Avoid double colon if someone wrote `: /*: string */`
      let prefixIdx = comment.start - 1;
      while (prefixIdx >= 0 && /\s/.test(source[prefixIdx])) prefixIdx--;
      const alreadyHasColon = prefixIdx >= 0 && source[prefixIdx] === ':';
      const replacement = (alreadyHasColon ? '' : ':') + inner;
      edits.push({
        start: comment.start,
        end: comment.end,
        text: replacement,
      });
    }
  }

  if (edits.length === 0) {
    return { code: source, hadFlowComments: false };
  }

  edits.sort((a, b) => b.start - a.start);
  let result = source;
  for (const edit of edits) {
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  }
  return { code: result, hadFlowComments: true };
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
  if (fromNode.innerComments && fromNode.innerComments.length > 0) {
    toNode.innerComments = [...fromNode.innerComments];
  }
  return toNode;
}

export function synthesizeParamName(typeNode, index, usedNames) {
  let candidate = `arg${index}`;
  let baseName = null;

  if (t.isTSTypeReference(typeNode)) {
    const typeName = typeNode.typeName;
    if (t.isIdentifier(typeName)) {
      baseName = typeName.name;
    } else if (t.isTSQualifiedName(typeName) && t.isIdentifier(typeName.right)) {
      baseName = typeName.right.name;
    }
  } else if (t.isGenericTypeAnnotation(typeNode)) {
    if (t.isIdentifier(typeNode.id)) {
      baseName = typeNode.id.name;
    } else if (
      t.isQualifiedTypeIdentifier(typeNode.id) &&
      t.isIdentifier(typeNode.id.id)
    ) {
      baseName = typeNode.id.id.name;
    }
  }

  if (baseName) {
    if (/^gd[A-Z]/.test(baseName)) {
      baseName = baseName.slice(2);
    }
    if (baseName.endsWith('Type') && baseName.length > 4) {
      baseName = baseName.slice(0, -4);
    }
    if (/^[A-Z]/.test(baseName)) {
      const camel = baseName[0].toLowerCase() + baseName.slice(1);
      if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(camel) && !RESERVED_PARAM_NAMES.has(camel)) {
        candidate = camel;
      }
    }
  }

  let unique = candidate;
  let suffix = 1;
  while (usedNames.has(unique) || RESERVED_PARAM_NAMES.has(unique)) {
    unique = `${candidate}${suffix++}`;
  }
  usedNames.add(unique);
  return unique;
}

function wrapIfNeedsParensInUnionOrIntersection(tsType, inIntersection) {
  if (t.isTSFunctionType(tsType) || t.isTSConstructorType(tsType)) {
    return t.tsParenthesizedType(tsType);
  }
  if (inIntersection && t.isTSUnionType(tsType)) {
    return t.tsParenthesizedType(tsType);
  }
  return tsType;
}

function wrapIfNeedsParensInArray(tsType) {
  if (
    t.isTSUnionType(tsType) ||
    t.isTSIntersectionType(tsType) ||
    t.isTSFunctionType(tsType) ||
    t.isTSConstructorType(tsType) ||
    t.isTSConditionalType(tsType) ||
    t.isTSTypeOperator(tsType)
  ) {
    return t.tsParenthesizedType(tsType);
  }
  return tsType;
}

function flattenUnionMembers(types) {
  const out = [];
  let hasNull = false;
  let hasUndefined = false;

  const push = (node) => {
    if (t.isTSParenthesizedType(node) && t.isTSUnionType(node.typeAnnotation)) {
      for (const m of node.typeAnnotation.types) push(m);
      return;
    }
    if (t.isTSUnionType(node)) {
      for (const m of node.types) push(m);
      return;
    }
    if (t.isTSNullKeyword(node)) {
      if (!hasNull) {
        hasNull = true;
        out.push(node);
      }
      return;
    }
    if (t.isTSUndefinedKeyword(node)) {
      if (!hasUndefined) {
        hasUndefined = true;
        out.push(node);
      }
      return;
    }
    out.push(wrapIfNeedsParensInUnionOrIntersection(node, false));
  };

  for (const item of types) push(item);
  return out;
}

function isPrimitiveIndexKey(tsType) {
  return (
    t.isTSStringKeyword(tsType) ||
    t.isTSNumberKeyword(tsType) ||
    t.isTSSymbolKeyword(tsType)
  );
}

function needsParensAroundAsExpression(pathObj) {
  const parentPath = pathObj && pathObj.parentPath;
  if (!parentPath || !parentPath.node) return false;
  const parent = parentPath.node;
  const key = pathObj.key;
  if (t.isParenthesizedExpression(parent)) return false;
  if (
    (t.isMemberExpression(parent) || t.isOptionalMemberExpression(parent)) &&
    key === 'object'
  ) {
    return true;
  }
  if (
    (t.isCallExpression(parent) ||
      t.isOptionalCallExpression(parent) ||
      t.isNewExpression(parent)) &&
    key === 'callee'
  ) {
    return true;
  }
  if (t.isTaggedTemplateExpression(parent) && key === 'tag') {
    return true;
  }
  if (
    t.isUnaryExpression(parent) ||
    t.isUpdateExpression(parent) ||
    t.isAwaitExpression(parent) ||
    t.isBinaryExpression(parent) ||
    t.isLogicalExpression(parent) ||
    t.isConditionalExpression(parent) ||
    t.isSpreadElement(parent)
  ) {
    return true;
  }
  return false;
}

function fixOptionalThenRequiredParams(params) {
  // In TS, an optional parameter cannot precede a required parameter.
  let seenRequiredAfter = false;
  for (let i = params.length - 1; i >= 0; i--) {
    const p = params[i];
    if (t.isRestElement(p)) continue;
    const isOptional = Boolean(p.optional) || t.isAssignmentPattern(p);
    if (!isOptional) {
      seenRequiredAfter = true;
    } else if (seenRequiredAfter && t.isIdentifier(p) && p.optional) {
      p.optional = false;
      if (p.typeAnnotation && t.isTSTypeAnnotation(p.typeAnnotation)) {
        const inner = p.typeAnnotation.typeAnnotation;
        p.typeAnnotation.typeAnnotation = t.tsUnionType(
          flattenUnionMembers([inner, t.tsUndefinedKeyword()])
        );
      }
    }
  }
  return params;
}

function buildFlowStubFromAst(flowAst, originalSource, options = {}) {
  const phaseLabel = options.phase ? ` [Phase ${options.phase}]` : '';
  const headerLines = [
    '// @flow',
    `// @flow-transitional-stub${phaseLabel}`,
  ];

  const slice = (node) =>
    node ? originalSource.slice(node.start, node.end) : '';

  const astComments = flowAst.comments || [];

  const getSuppressionLines = (...nodes) => {
    const seen = new Set();
    const lines = [];
    const addComment = (c) => {
      if (!c) return;
      if (/\$Flow(?:FixMe|Ignore|ExpectedError)\b/.test(c.value)) {
        const text = slice(c);
        const key = `${c.start}:${c.end}:${text}`;
        if (!seen.has(key)) {
          seen.add(key);
          lines.push(text);
        }
      }
    };
    for (const node of nodes) {
      if (!node) continue;
      if (node._rangeStart !== undefined && node._rangeEnd !== undefined) {
        for (const c of astComments) {
          if (c.start >= node._rangeStart && c.end <= node._rangeEnd) {
            addComment(c);
          }
        }
        continue;
      }
      const comments = [
        ...(node.leadingComments || []),
        ...((node.comments || []).filter((c) => c.leading)),
      ];
      for (const c of comments) {
        addComment(c);
      }
    }
    return lines;
  };

  const getSuppressionPrefix = (node, indent = '', ...extraNodes) => {
    const lines = getSuppressionLines(node, ...extraNodes).map(
      (l) => `${indent}${l}`
    );
    return lines.length > 0 ? lines.join('\n') + '\n' : '';
  };

  const getFunctionSuppressionNodes = (fnNode) => {
    if (!fnNode) return [];
    const headerEnd =
      fnNode.body && fnNode.body.start !== undefined
        ? fnNode.body.start
        : fnNode.end;
    return [
      fnNode,
      { _rangeStart: fnNode.start, _rangeEnd: headerEnd },
    ];
  };

  const typeRefNames = new Set();
  const collectTypeRefs = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) collectTypeRefs(item);
      return;
    }
    if (node.type === 'GenericTypeAnnotation' || node.type === 'ClassImplements') {
      if (node.id && node.id.type === 'Identifier') {
        typeRefNames.add(node.id.name);
      } else if (node.id && node.id.type === 'QualifiedTypeIdentifier') {
        let cur = node.id.qualification;
        while (cur && cur.type === 'QualifiedTypeIdentifier') {
          cur = cur.qualification;
        }
        if (cur && cur.type === 'Identifier') {
          typeRefNames.add(cur.name);
        }
      }
    } else if (node.type === 'InterfaceExtends') {
      if (node.id && node.id.type === 'Identifier') {
        typeRefNames.add(node.id.name);
      } else if (node.id && node.id.type === 'QualifiedTypeIdentifier') {
        let cur = node.id.qualification;
        while (cur && cur.type === 'QualifiedTypeIdentifier') {
          cur = cur.qualification;
        }
        if (cur && cur.type === 'Identifier') {
          typeRefNames.add(cur.name);
        }
      }
    } else if (node.type === 'TypeofTypeAnnotation' && node.argument) {
      collectTypeRefs(node.argument);
    }
    for (const k of Object.keys(node)) {
      if (
        k === 'loc' ||
        k === 'start' ||
        k === 'end' ||
        k === 'extra' ||
        k === 'comments' ||
        k === 'leadingComments' ||
        k === 'trailingComments' ||
        k === 'innerComments'
      ) {
        continue;
      }
      collectTypeRefs(node[k]);
    }
  };

  // Pre-scan local type declarations & local value declarations
  const localTypesByName = new Map();
  const localValuesByName = new Map();
  const exportedTypeNames = new Set();

  for (const stmt of flowAst.program.body) {
    if (
      stmt.type === 'TypeAlias' ||
      stmt.type === 'OpaqueType' ||
      stmt.type === 'InterfaceDeclaration'
    ) {
      if (stmt.id && stmt.id.name) {
        localTypesByName.set(stmt.id.name, stmt);
      }
    } else if (stmt.type === 'VariableDeclaration') {
      for (const d of stmt.declarations) {
        if (d.id && d.id.type === 'Identifier') {
          localValuesByName.set(d.id.name, { kind: 'var', node: d });
        }
      }
    } else if (stmt.type === 'FunctionDeclaration' && stmt.id) {
      localValuesByName.set(stmt.id.name, { kind: 'func', node: stmt });
    } else if (stmt.type === 'ClassDeclaration' && stmt.id) {
      localValuesByName.set(stmt.id.name, { kind: 'class', node: stmt });
    }
  }

  const exportSnippets = [];
  const exportNodesForRefs = [];

  const formatFlowFunctionSignature = (fnNode) => {
    const typeParams = fnNode.typeParameters ? slice(fnNode.typeParameters) : '';
    if (fnNode.typeParameters) exportNodesForRefs.push(fnNode.typeParameters);
    const params = (fnNode.params || [])
      .map((p, idx) => {
        if (p.type === 'RestElement') {
          const argName =
            p.argument && p.argument.type === 'Identifier'
              ? p.argument.name
              : `args${idx}`;
          const ann = p.typeAnnotation ? slice(p.typeAnnotation) : ': Array<any>';
          if (p.typeAnnotation) exportNodesForRefs.push(p.typeAnnotation);
          return `...${argName}${ann}`;
        }
        const left = p.type === 'AssignmentPattern' ? p.left : p;
        const isOptional =
          Boolean(left && left.optional) || p.type === 'AssignmentPattern';
        const paramName =
          left && left.type === 'Identifier' ? left.name : `arg${idx}`;
        const ann =
          left && left.typeAnnotation ? slice(left.typeAnnotation) : ': any';
        if (left && left.typeAnnotation) {
          exportNodesForRefs.push(left.typeAnnotation);
        }
        return `${paramName}${isOptional ? '?' : ''}${ann}`;
      })
      .join(', ');
    let retAnn = ': any';
    if (fnNode.returnType) {
      retAnn = slice(fnNode.returnType);
      exportNodesForRefs.push(fnNode.returnType);
    } else if (fnNode.async) {
      retAnn = ': Promise<any>';
    }
    return {
      typeParams,
      params,
      retAnn,
      fnTypeExpr: `${typeParams}(${params}) => ${retAnn.replace(/^:\s*/, '')}`,
    };
  };

  const isReactComponentSuperClass = (superClassNode) => {
    if (!superClassNode) return false;
    const superText = slice(superClassNode).trim();
    return (
      superText === 'React.Component' ||
      superText === 'React.PureComponent' ||
      superText === 'Component' ||
      superText === 'PureComponent'
    );
  };

  const buildFlowClassDeclSnippet = (classNode, prefixKeyword) => {
    const className =
      classNode.id && classNode.id.name
        ? classNode.id.name
        : 'AnonymousDefaultClass';
    const typeParams = classNode.typeParameters
      ? slice(classNode.typeParameters)
      : '';
    if (classNode.typeParameters) {
      exportNodesForRefs.push(classNode.typeParameters);
    }

    let extendsClause = '';
    if (classNode.superClass) {
      const superText = slice(classNode.superClass).trim();
      if (superText.startsWith('React.')) {
        typeRefNames.add('React');
      } else if (classNode.superClass.type === 'Identifier') {
        typeRefNames.add(classNode.superClass.name);
      } else if (
        classNode.superClass.type === 'MemberExpression' &&
        classNode.superClass.object.type === 'Identifier'
      ) {
        typeRefNames.add(classNode.superClass.object.name);
      }
      const superTp = classNode.superTypeParameters
        ? slice(classNode.superTypeParameters)
        : '';
      if (classNode.superTypeParameters) {
        exportNodesForRefs.push(classNode.superTypeParameters);
      }
      extendsClause = ` extends ${superText}${superTp}`;
    }

    let implementsClause = '';
    if (classNode.implements && classNode.implements.length > 0) {
      for (const imp of classNode.implements) {
        exportNodesForRefs.push(imp);
      }
      implementsClause = ` implements ${classNode.implements
        .map((imp) => slice(imp))
        .join(', ')}`;
    }

    const memberLines = [];
    const seenMemberKeys = new Set();
    const bodyMembers =
      classNode.body && Array.isArray(classNode.body.body)
        ? classNode.body.body
        : [];

    for (const member of bodyMembers) {
      if (member.type === 'ClassProperty') {
        if (
          !member.key ||
          member.computed ||
          (member.key.type !== 'Identifier' &&
            member.key.type !== 'StringLiteral')
        ) {
          continue;
        }
        const keyName =
          member.key.type === 'Identifier'
            ? member.key.name
            : JSON.stringify(member.key.value);
        const staticPrefix = member.static ? 'static ' : '';
        const dedupKey = `${staticPrefix}prop:${keyName}`;
        if (seenMemberKeys.has(dedupKey)) continue;
        seenMemberKeys.add(dedupKey);

        const variance =
          member.variance && member.variance.kind === 'plus'
            ? '+'
            : member.variance && member.variance.kind === 'minus'
              ? '-'
              : '';
        const opt = member.optional ? '?' : '';
        let propAnn = ': any';
        if (member.typeAnnotation) {
          propAnn = slice(member.typeAnnotation);
          exportNodesForRefs.push(member.typeAnnotation);
        } else if (
          member.value &&
          (member.value.type === 'ArrowFunctionExpression' ||
            member.value.type === 'FunctionExpression')
        ) {
          const sig = formatFlowFunctionSignature(member.value);
          propAnn = `: ${sig.fnTypeExpr}`;
        }
        memberLines.push(
          `${getSuppressionPrefix(member, '  ')}  ${staticPrefix}${variance}${keyName}${opt}${propAnn};`
        );
      } else if (member.type === 'ClassMethod') {
        if (!member.key || member.computed || member.key.type !== 'Identifier') {
          continue;
        }
        const keyName = member.key.name;
        const staticPrefix = member.static ? 'static ' : '';
        const dedupKey = `${staticPrefix}${member.kind || 'method'}:${keyName}`;
        if (seenMemberKeys.has(dedupKey)) continue;
        seenMemberKeys.add(dedupKey);
        const suppPrefix = getSuppressionPrefix(member, '  ');

        if (member.kind === 'get') {
          const retAnn = member.returnType ? slice(member.returnType) : ': any';
          if (member.returnType) exportNodesForRefs.push(member.returnType);
          memberLines.push(`${suppPrefix}  ${staticPrefix}get ${keyName}()${retAnn};`);
        } else if (member.kind === 'set') {
          const sig = formatFlowFunctionSignature(member);
          memberLines.push(
            `${suppPrefix}  ${staticPrefix}set ${keyName}(${sig.params}): void;`
          );
        } else {
          const sig = formatFlowFunctionSignature(member);
          const ret = member.kind === 'constructor' ? ': void' : sig.retAnn;
          memberLines.push(
            `${suppPrefix}  ${staticPrefix}${keyName}${sig.typeParams}(${sig.params})${ret};`
          );
        }
      }
    }

    if (memberLines.length === 0) {
      return `${prefixKeyword} ${className}${typeParams}${extendsClause}${implementsClause} {}`;
    }
    return `${prefixKeyword} ${className}${typeParams}${extendsClause}${implementsClause} {\n${memberLines.join('\n')}\n}`;
  };

  const inferObjectLiteralFlowType = (objExpr, depth = 0) => {
    if (
      !objExpr ||
      objExpr.type !== 'ObjectExpression' ||
      !Array.isArray(objExpr.properties) ||
      objExpr.properties.length === 0 ||
      depth > 2
    ) {
      return null;
    }
    const propParts = [];
    for (const prop of objExpr.properties) {
      if (prop.type !== 'ObjectProperty' || prop.computed || !prop.key) {
        return null;
      }
      let keyText = null;
      if (prop.key.type === 'Identifier') {
        keyText = prop.key.name;
      } else if (prop.key.type === 'StringLiteral') {
        keyText = JSON.stringify(prop.key.value);
      } else {
        return null;
      }
      let valType = 'any';
      if (prop.value) {
        if (prop.value.type === 'StringLiteral') {
          valType = JSON.stringify(prop.value.value);
        } else if (prop.value.type === 'NumericLiteral') {
          valType = String(prop.value.value);
        } else if (prop.value.type === 'BooleanLiteral') {
          valType = String(prop.value.value);
        } else if (prop.value.type === 'TypeCastExpression') {
          exportNodesForRefs.push(prop.value.typeAnnotation);
          valType = slice(prop.value.typeAnnotation).replace(/^:\s*/, '');
        } else if (prop.value.type === 'ObjectExpression') {
          valType = inferObjectLiteralFlowType(prop.value, depth + 1) || 'any';
        }
      }
      propParts.push(`${keyText}: ${valType}`);
    }
    return `{| ${propParts.join(', ')} |}`;
  };

  const inferFlowComponentOrValueType = (expr) => {
    if (!expr) return 'any';
    if (expr.type === 'StringLiteral') return 'string';
    if (expr.type === 'NumericLiteral') return 'number';
    if (expr.type === 'BooleanLiteral') return 'boolean';
    if (expr.type === 'ObjectExpression') {
      return inferObjectLiteralFlowType(expr) || 'any';
    }
    if (expr.type === 'TypeCastExpression') {
      exportNodesForRefs.push(expr.typeAnnotation);
      return slice(expr.typeAnnotation).replace(/^:\s*/, '');
    }
    if (expr.type === 'CallExpression') {
      const calleeText = slice(expr.callee).trim();
      const isForwardRef =
        calleeText === 'React.forwardRef' ||
        calleeText === 'forwardRef' ||
        calleeText.endsWith('.forwardRef');
      const isMemo =
        calleeText === 'React.memo' ||
        calleeText === 'memo' ||
        calleeText.endsWith('.memo');
      if (isForwardRef || isMemo) {
        typeRefNames.add('React');
        if (expr.typeArguments && expr.typeArguments.params && expr.typeArguments.params[0]) {
          exportNodesForRefs.push(expr.typeArguments.params[0]);
          const propsArg = slice(expr.typeArguments.params[0]);
          return `React.ComponentType<${propsArg}>`;
        }
        const firstArg = expr.arguments && expr.arguments[0];
        if (firstArg) {
          if (
            (firstArg.type === 'ArrowFunctionExpression' ||
              firstArg.type === 'FunctionExpression') &&
            !firstArg.typeParameters &&
            firstArg.params &&
            firstArg.params[0]
          ) {
            const p0 =
              firstArg.params[0].type === 'AssignmentPattern'
                ? firstArg.params[0].left
                : firstArg.params[0];
            if (p0 && p0.typeAnnotation) {
              exportNodesForRefs.push(p0.typeAnnotation);
              const propsArg = slice(p0.typeAnnotation).replace(/^:\s*/, '');
              return `React.ComponentType<${propsArg}>`;
            }
          } else if (
            firstArg.type === 'CallExpression' ||
            firstArg.type === 'Identifier' ||
            firstArg.type === 'TypeCastExpression'
          ) {
            const innerType = inferFlowComponentOrValueType(firstArg);
            if (innerType && innerType !== 'any') {
              return innerType;
            }
          }
        }
        return 'React.ComponentType<any>';
      }
    }
    if (
      expr.type === 'ArrowFunctionExpression' ||
      expr.type === 'FunctionExpression' ||
      expr.type === 'FunctionDeclaration'
    ) {
      const firstParam =
        expr.params && expr.params[0]
          ? expr.params[0].type === 'AssignmentPattern'
            ? expr.params[0].left
            : expr.params[0]
          : null;
      const retText = expr.returnType ? slice(expr.returnType) : '';
      if (
        !expr.typeParameters &&
        firstParam &&
        firstParam.typeAnnotation &&
        (retText.includes('React.Node') ||
          retText.includes('React.MixedElement') ||
          retText.includes('React.Element') ||
          /\bNode\b/.test(retText))
      ) {
        exportNodesForRefs.push(firstParam.typeAnnotation);
        typeRefNames.add('React');
        return `React.ComponentType<${slice(firstParam.typeAnnotation).replace(
          /^:\s*/,
          ''
        )}>`;
      }
      return formatFlowFunctionSignature(expr).fnTypeExpr;
    }
    if (expr.type === 'Identifier') {
      const local = localValuesByName.get(expr.name);
      if (local) {
        if (local.kind === 'var') {
          const d = local.node;
          if (d.id && d.id.typeAnnotation) {
            exportNodesForRefs.push(d.id.typeAnnotation);
            return slice(d.id.typeAnnotation).replace(/^:\s*/, '');
          }
          if (d.init) {
            return inferFlowComponentOrValueType(d.init);
          }
        } else if (local.kind === 'func') {
          return inferFlowComponentOrValueType(local.node);
        }
      }
    }
    return 'any';
  };

  const exportedValueNames = new Set();

  for (const stmt of flowAst.program.body) {
    if (stmt.type === 'ExportAllDeclaration') {
      exportSnippets.push(slice(stmt));
    } else if (stmt.type === 'ExportNamedDeclaration') {
      if (
        stmt.exportKind === 'type' ||
        (stmt.declaration &&
          (stmt.declaration.type === 'TypeAlias' ||
            stmt.declaration.type === 'OpaqueType' ||
            stmt.declaration.type === 'InterfaceDeclaration'))
      ) {
        if (stmt.declaration && stmt.declaration.id && stmt.declaration.id.name) {
          exportedTypeNames.add(stmt.declaration.id.name);
        }
        if (stmt.specifiers && !stmt.source) {
          for (const spec of stmt.specifiers) {
            const localName =
              spec.local && (spec.local.name || spec.local.value);
            if (localName) typeRefNames.add(localName);
          }
        }
        const suppPrefix = getSuppressionPrefix(stmt, '', stmt.declaration);
        exportSnippets.push(`${suppPrefix}${slice(stmt)}`);
        exportNodesForRefs.push(stmt);
      } else if (stmt.declaration) {
        const decl = stmt.declaration;
        if (decl.type === 'VariableDeclaration') {
          for (const declarator of decl.declarations) {
            if (declarator.id.type === 'Identifier') {
              const name = declarator.id.name;
              exportedValueNames.add(name);
              let typeAnnot = ': any';
              if (declarator.id.typeAnnotation) {
                typeAnnot = slice(declarator.id.typeAnnotation);
                exportNodesForRefs.push(declarator.id.typeAnnotation);
              } else if (
                declarator.init &&
                declarator.init.type === 'ObjectExpression'
              ) {
                const objType = inferObjectLiteralFlowType(declarator.init);
                if (objType) typeAnnot = `: ${objType}`;
              }
              const suppPrefix = getSuppressionPrefix(
                stmt,
                '',
                decl,
                declarator,
                declarator.id,
                declarator.id.typeAnnotation
              );
              exportSnippets.push(
                `${suppPrefix}declare export var ${name}${typeAnnot};`
              );
            }
          }
        } else if (decl.type === 'FunctionDeclaration' && decl.id) {
          exportedValueNames.add(decl.id.name);
          const sig = formatFlowFunctionSignature(decl);
          const suppPrefix = getSuppressionPrefix(
            stmt,
            '',
            ...getFunctionSuppressionNodes(decl)
          );
          exportSnippets.push(
            `${suppPrefix}declare export function ${decl.id.name}${sig.typeParams}(${sig.params})${sig.retAnn};`
          );
        } else if (decl.type === 'ClassDeclaration' && decl.id) {
          exportedValueNames.add(decl.id.name);
          const suppPrefix = getSuppressionPrefix(stmt, '', decl);
          exportSnippets.push(
            `${suppPrefix}${buildFlowClassDeclSnippet(decl, 'declare export class')}`
          );
        }
      } else if (stmt.specifiers && stmt.specifiers.length > 0) {
        if (stmt.source) {
          exportSnippets.push(slice(stmt));
        } else {
          for (const spec of stmt.specifiers) {
            if (spec.type !== 'ExportSpecifier') continue;
            const localName = spec.local.name || spec.local.value;
            const exportedName = spec.exported.name || spec.exported.value;
            if (spec.exportKind === 'type') {
              typeRefNames.add(localName);
              exportSnippets.push(
                exportedName !== localName
                  ? `export type { ${localName} as ${exportedName} };`
                  : `export type { ${localName} };`
              );
            } else {
              exportedValueNames.add(localName);
              exportedValueNames.add(exportedName);
              const inferred = inferFlowComponentOrValueType({
                type: 'Identifier',
                name: localName,
              });
              if (exportedName === 'default') {
                const formattedDefault = inferred.startsWith('<')
                  ? `(${inferred})`
                  : inferred;
                exportSnippets.push(`declare export default ${formattedDefault};`);
              } else {
                exportSnippets.push(
                  `declare export var ${exportedName}: ${inferred};`
                );
              }
            }
          }
        }
      }
    } else if (stmt.type === 'ExportDefaultDeclaration') {
      const decl = stmt.declaration;
      if (decl.type === 'FunctionDeclaration') {
        const fnName =
          decl.id && decl.id.name ? decl.id.name : 'anonymousDefaultFunction';
        if (decl.id && decl.id.name) exportedValueNames.add(decl.id.name);
        const sig = formatFlowFunctionSignature(decl);
        const suppPrefix = getSuppressionPrefix(
          stmt,
          '',
          ...getFunctionSuppressionNodes(decl)
        );
        exportSnippets.push(
          `${suppPrefix}declare export default function ${fnName}${sig.typeParams}(${sig.params})${sig.retAnn};`
        );
      } else if (decl.type === 'ClassDeclaration') {
        if (decl.id && decl.id.name) exportedValueNames.add(decl.id.name);
        const suppPrefix = getSuppressionPrefix(stmt, '', decl);
        if (
          isReactComponentSuperClass(decl.superClass) &&
          !decl.typeParameters
        ) {
          typeRefNames.add('React');
          let typeExpr = 'React.ComponentType<any>';
          if (
            decl.superTypeParameters &&
            decl.superTypeParameters.params &&
            decl.superTypeParameters.params[0]
          ) {
            const firstArg = decl.superTypeParameters.params[0];
            exportNodesForRefs.push(firstArg);
            typeExpr = `React.ComponentType<${slice(firstArg)}>`;
          }
          exportSnippets.push(`${suppPrefix}declare export default ${typeExpr};`);
        } else {
          exportSnippets.push(
            `${suppPrefix}${buildFlowClassDeclSnippet(
              decl,
              'declare export default class'
            )}`
          );
        }
      } else if (
        decl.type === 'Identifier' &&
        localValuesByName.get(decl.name)?.kind === 'class'
      ) {
        exportedValueNames.add(decl.name);
        const classNode = localValuesByName.get(decl.name).node;
        const suppPrefix = getSuppressionPrefix(stmt, '', classNode);
        if (
          isReactComponentSuperClass(classNode.superClass) &&
          !classNode.typeParameters
        ) {
          typeRefNames.add('React');
          let typeExpr = 'React.ComponentType<any>';
          if (
            classNode.superTypeParameters &&
            classNode.superTypeParameters.params &&
            classNode.superTypeParameters.params[0]
          ) {
            const firstArg = classNode.superTypeParameters.params[0];
            exportNodesForRefs.push(firstArg);
            typeExpr = `React.ComponentType<${slice(firstArg)}>`;
          }
          exportSnippets.push(`${suppPrefix}declare export default ${typeExpr};`);
        } else {
          exportSnippets.push(
            `${suppPrefix}${buildFlowClassDeclSnippet(
              classNode,
              'declare export default class'
            )}`
          );
        }
      } else if (
        decl.type === 'Identifier' &&
        localValuesByName.get(decl.name)?.kind === 'func'
      ) {
        exportedValueNames.add(decl.name);
        const fnNode = localValuesByName.get(decl.name).node;
        const suppPrefix = getSuppressionPrefix(
          stmt,
          '',
          ...getFunctionSuppressionNodes(fnNode)
        );
        const inferred = inferFlowComponentOrValueType(fnNode);
        if (inferred.startsWith('React.ComponentType<')) {
          exportSnippets.push(`${suppPrefix}declare export default ${inferred};`);
        } else {
          const sig = formatFlowFunctionSignature(fnNode);
          exportSnippets.push(
            `${suppPrefix}declare export default function ${decl.name}${sig.typeParams}(${sig.params})${sig.retAnn};`
          );
        }
      } else {
        let localSourceNodes = [decl];
        if (decl.type === 'Identifier' && localValuesByName.has(decl.name)) {
          exportedValueNames.add(decl.name);
          const localEntry = localValuesByName.get(decl.name);
          localSourceNodes.push(localEntry.node);
          if (localEntry.kind === 'var' && localEntry.node.init) {
            localSourceNodes.push(
              ...getFunctionSuppressionNodes(localEntry.node.init)
            );
          }
        }
        const suppPrefix = getSuppressionPrefix(stmt, '', ...localSourceNodes);
        const typeExpr = inferFlowComponentOrValueType(decl);
        const formattedDefault = typeExpr.startsWith('<')
          ? `(${typeExpr})`
          : typeExpr;
        exportSnippets.push(
          `${suppPrefix}declare export default ${formattedDefault};`
        );
      }
    }
  }

  for (const n of exportNodesForRefs) collectTypeRefs(n);

  // Transitively resolve local TypeAlias / OpaqueType / InterfaceDeclaration
  // as well as unexported local ClassDeclaration / VariableDeclaration / FunctionDeclaration
  // referenced by exported types or class members (e.g. via `typeof localConst` or property types).
  const neededLocalTypes = new Set();
  const neededLocalValues = new Map();
  let addedLocalDep = true;
  while (addedLocalDep) {
    addedLocalDep = false;
    for (const refName of [...typeRefNames]) {
      if (
        localTypesByName.has(refName) &&
        !exportedTypeNames.has(refName) &&
        !neededLocalTypes.has(refName)
      ) {
        neededLocalTypes.add(refName);
        collectTypeRefs(localTypesByName.get(refName));
        addedLocalDep = true;
      } else if (
        localValuesByName.has(refName) &&
        !exportedValueNames.has(refName) &&
        !neededLocalValues.has(refName)
      ) {
        const entry = localValuesByName.get(refName);
        const prevRefsLen = exportNodesForRefs.length;
        let snippet = null;
        if (entry.kind === 'class') {
          snippet = buildFlowClassDeclSnippet(entry.node, 'declare class');
        } else if (entry.kind === 'func') {
          const sig = formatFlowFunctionSignature(entry.node);
          snippet = `declare function ${refName}${sig.typeParams}(${sig.params})${sig.retAnn};`;
        } else if (entry.kind === 'var') {
          const d = entry.node;
          let typeExpr = 'any';
          if (d.id && d.id.typeAnnotation) {
            exportNodesForRefs.push(d.id.typeAnnotation);
            typeExpr = slice(d.id.typeAnnotation).replace(/^:\s*/, '');
          } else if (d.init) {
            typeExpr = inferFlowComponentOrValueType(d.init);
          }
          snippet = `declare var ${refName}: ${typeExpr};`;
        }
        if (snippet) {
          neededLocalValues.set(refName, snippet);
          for (let i = prevRefsLen; i < exportNodesForRefs.length; i++) {
            collectTypeRefs(exportNodesForRefs[i]);
          }
          addedLocalDep = true;
        }
      }
    }
  }

  const localTypeSnippets = [];
  for (const stmt of flowAst.program.body) {
    if (
      (stmt.type === 'TypeAlias' ||
        stmt.type === 'OpaqueType' ||
        stmt.type === 'InterfaceDeclaration') &&
      stmt.id &&
      neededLocalTypes.has(stmt.id.name)
    ) {
      const suppPrefix = getSuppressionPrefix(stmt);
      localTypeSnippets.push(`${suppPrefix}${slice(stmt)}`);
    } else if (stmt.type === 'ClassDeclaration' && stmt.id && neededLocalValues.has(stmt.id.name)) {
      localTypeSnippets.push(neededLocalValues.get(stmt.id.name));
    } else if (stmt.type === 'FunctionDeclaration' && stmt.id && neededLocalValues.has(stmt.id.name)) {
      localTypeSnippets.push(neededLocalValues.get(stmt.id.name));
    } else if (stmt.type === 'VariableDeclaration') {
      for (const d of stmt.declarations) {
        if (d.id && d.id.type === 'Identifier' && neededLocalValues.has(d.id.name)) {
          localTypeSnippets.push(neededLocalValues.get(d.id.name));
        }
      }
    }
  }

  const importLines = [];
  for (const stmt of flowAst.program.body) {
    if (stmt.type !== 'ImportDeclaration') continue;
    const keptSpecs = [];
    let keepWholeImport = false;
    for (const spec of stmt.specifiers) {
      if (typeRefNames.has(spec.local.name)) {
        keptSpecs.push(spec);
      }
    }
    if (keptSpecs.length === stmt.specifiers.length && stmt.specifiers.length > 0) {
      keepWholeImport = true;
    }
    if (keepWholeImport) {
      importLines.push(slice(stmt));
    } else if (keptSpecs.length > 0) {
      const named = keptSpecs
        .filter((s) => s.type === 'ImportSpecifier')
        .map((s) => {
          const isType = stmt.importKind === 'type' || s.importKind === 'type';
          const importedName = s.imported.name || s.imported.value;
          const alias =
            importedName !== s.local.name
              ? `${importedName} as ${s.local.name}`
              : importedName;
          return isType && stmt.importKind !== 'type' ? `type ${alias}` : alias;
        });
      const def = keptSpecs.find((s) => s.type === 'ImportDefaultSpecifier');
      const ns = keptSpecs.find((s) => s.type === 'ImportNamespaceSpecifier');
      if (ns) {
        importLines.push(
          `import * as ${ns.local.name} from '${stmt.source.value}';`
        );
      } else {
        const parts = [];
        if (def) parts.push(def.local.name);
        if (named.length > 0) parts.push(`{ ${named.join(', ')} }`);
        const prefix = stmt.importKind === 'type' ? 'import type ' : 'import ';
        importLines.push(`${prefix}${parts.join(', ')} from '${stmt.source.value}';`);
      }
    }
  }

  const parts = [...headerLines];
  if (importLines.length > 0) parts.push(...importLines);
  if (localTypeSnippets.length > 0) parts.push('', ...localTypeSnippets);
  if (exportSnippets.length > 0) parts.push('', ...exportSnippets);
  else parts.push('', 'declare export default any;');

  return {
    code: parts.join('\n') + '\n',
    exportsCount: exportSnippets.length,
  };
}

export function generateFlowStub(source, options = {}) {
  const { code: unwrapped } = unwrapFlowComments(source);
  const ast = parser.parse(unwrapped, {
    sourceType: 'unambiguous',
    tokens: true,
    plugins: FLOW_PARSER_PLUGINS,
  });
  return buildFlowStubFromAst(ast, unwrapped, options);
}

/**
 * Separates `<//` sequences where `<` (opening a type parameter list) is
 * immediately followed by an AST line comment `//`, which TypeScript's TSX
 * scanner otherwise lexes as `</` (LessThanSlashToken) followed by `/`.
 */
export function separateAngleBracketLineComments(
  source,
  parserPlugins = ['typescript', 'jsx']
) {
  if (!source.includes('<//')) return source;
  let comments = [];
  try {
    const parsed = parser.parse(source, {
      sourceType: 'unambiguous',
      tokens: false,
      plugins: parserPlugins,
    });
    comments = parsed.comments || [];
  } catch {
    return source;
  }

  const lineTerminator = source.includes('\r\n') ? '\r\n' : '\n';
  const insertPositions = [];
  for (const comment of comments) {
    if (
      comment.type === 'CommentLine' &&
      comment.start > 0 &&
      source[comment.start - 1] === '<'
    ) {
      insertPositions.push(comment.start);
    }
  }
  if (insertPositions.length === 0) return source;
  insertPositions.sort((a, b) => b - a);
  let out = source;
  for (const pos of insertPositions) {
    out = out.slice(0, pos) + lineTerminator + out.slice(pos);
  }
  return out;
}

/**
 * Converts Flow source code to TypeScript AST and prints with recast while
 * preserving comments and surrounding layout.
 */
export function convertFlowAstToTsAst(source, options = {}) {
  const { code: preparedSource, hadFlowComments } = unwrapFlowComments(source);
  const ast = parseFlowWithRecast(preparedSource);

  let hasJsx = false;
  let convertedNodes = 0;

  function convertFlowType(node, ctx = {}) {
    if (!node) return t.tsAnyKeyword();
    convertedNodes++;

    let result;
    switch (node.type) {
      case 'AnyTypeAnnotation':
        result = t.tsAnyKeyword();
        break;
      case 'VoidTypeAnnotation':
        result = t.tsVoidKeyword();
        break;
      case 'BooleanTypeAnnotation':
        result = t.tsBooleanKeyword();
        break;
      case 'StringTypeAnnotation':
        result = t.tsStringKeyword();
        break;
      case 'NumberTypeAnnotation':
        result = t.tsNumberKeyword();
        break;
      case 'SymbolTypeAnnotation':
        result = t.tsSymbolKeyword();
        break;
      case 'NullLiteralTypeAnnotation':
        result = t.tsNullKeyword();
        break;
      case 'MixedTypeAnnotation':
        result = t.tsUnknownKeyword();
        break;
      case 'EmptyTypeAnnotation':
        result = t.tsNeverKeyword();
        break;
      case 'ExistsTypeAnnotation':
        result = t.tsAnyKeyword();
        break;
      case 'ThisTypeAnnotation':
        result = t.tsThisType();
        break;
      case 'StringLiteralTypeAnnotation':
        result = t.tsLiteralType(t.stringLiteral(node.value));
        break;
      case 'BooleanLiteralTypeAnnotation':
        result = t.tsLiteralType(t.booleanLiteral(node.value));
        break;
      case 'NumberLiteralTypeAnnotation': {
        if (node.value < 0) {
          result = t.tsLiteralType(
            t.unaryExpression('-', t.numericLiteral(-node.value))
          );
        } else {
          result = t.tsLiteralType(t.numericLiteral(node.value));
        }
        break;
      }
      case 'ArrayTypeAnnotation': {
        const inner = wrapIfNeedsParensInArray(convertFlowType(node.elementType));
        result = t.tsArrayType(inner);
        break;
      }
      case 'TupleTypeAnnotation': {
        result = t.tsTupleType(node.types.map((m) => convertFlowType(m)));
        break;
      }
      case 'NullableTypeAnnotation': {
        const inner = convertFlowType(node.typeAnnotation);
        if (ctx.optionalSlot) {
          // Optional property or optional parameter: x?: ?T -> x?: T | null
          result = t.tsUnionType(flattenUnionMembers([inner, t.tsNullKeyword()]));
        } else {
          result = t.tsUnionType(
            flattenUnionMembers([inner, t.tsNullKeyword(), t.tsUndefinedKeyword()])
          );
        }
        break;
      }
      case 'UnionTypeAnnotation': {
        const members = flattenUnionMembers(
          node.types.map((m) => convertFlowType(m))
        );
        result =
          members.length === 1 ? members[0] : t.tsUnionType(members);
        break;
      }
      case 'IntersectionTypeAnnotation': {
        const members = node.types.map((m) =>
          wrapIfNeedsParensInUnionOrIntersection(convertFlowType(m), true)
        );
        result =
          members.length === 1 ? members[0] : t.tsIntersectionType(members);
        break;
      }
      case 'TypeofTypeAnnotation': {
        const arg = node.argument;
        if (t.isGenericTypeAnnotation(arg)) {
          const exprName = convertTypeId(arg.id);
          const typeParams = convertTypeParamInstantiation(arg.typeParameters);
          result = t.tsTypeQuery(exprName, typeParams);
        } else {
          result = t.tsAnyKeyword();
        }
        break;
      }
      case 'GenericTypeAnnotation': {
        const id = convertTypeId(node.id);
        const typeParams = convertTypeParamInstantiation(node.typeParameters);
        result = t.tsTypeReference(id, typeParams);
        break;
      }
      case 'FunctionTypeAnnotation': {
        const typeParams = convertTypeParamDeclaration(node.typeParameters);
        const usedNames = new Set();
        for (const p of node.params) {
          if (p.name && t.isIdentifier(p.name)) {
            usedNames.add(p.name.name);
          }
        }
        if (node.rest && node.rest.name && t.isIdentifier(node.rest.name)) {
          usedNames.add(node.rest.name.name);
        }

        const params = node.params.map((p, index) => {
          const tsType = convertFlowType(p.typeAnnotation, {
            optionalSlot: Boolean(p.optional),
          });
          const paramName =
            p.name && t.isIdentifier(p.name)
              ? p.name.name
              : synthesizeParamName(tsType, index, usedNames);
          const id = t.identifier(paramName);
          if (p.optional) id.optional = true;
          id.typeAnnotation = t.tsTypeAnnotation(tsType);
          copyComments(p, id);
          return id;
        });

        if (node.rest) {
          const restType = convertFlowType(node.rest.typeAnnotation);
          const restName =
            node.rest.name && t.isIdentifier(node.rest.name)
              ? node.rest.name.name
              : synthesizeParamName(restType, params.length, usedNames);
          const restEl = t.restElement(t.identifier(restName));
          restEl.typeAnnotation = t.tsTypeAnnotation(restType);
          copyComments(node.rest, restEl);
          params.push(restEl);
        }

        fixOptionalThenRequiredParams(params);
        const retType = t.tsTypeAnnotation(convertFlowType(node.returnType));
        result = t.tsFunctionType(typeParams, params, retType);
        break;
      }
      case 'ObjectTypeAnnotation': {
        result = convertObjectTypeAnnotation(node);
        break;
      }
      case 'InterfaceTypeAnnotation': {
        result = convertObjectTypeAnnotation(node.body);
        break;
      }
      default:
        result = t.tsAnyKeyword();
        break;
    }

    return copyComments(node, result);
  }

  function convertTypeId(id) {
    if (!id) return t.identifier('any');
    if (t.isIdentifier(id)) {
      return copyComments(id, t.identifier(id.name));
    }
    if (t.isQualifiedTypeIdentifier(id)) {
      return copyComments(
        id,
        t.tsQualifiedName(convertTypeId(id.qualification), t.identifier(id.id.name))
      );
    }
    return t.identifier('any');
  }

  function convertTypeParamInstantiation(inst) {
    if (!inst || !inst.params) return null;
    if (inst.params.length === 0) return null;
    return copyComments(
      inst,
      t.tsTypeParameterInstantiation(
        inst.params.map((p) => convertFlowType(p))
      )
    );
  }

  function convertTypeParamDeclaration(decl, optionsForDecl = {}) {
    if (!decl || !decl.params || decl.params.length === 0) return null;
    const params = decl.params.map((p) => {
      const constraint = p.bound
        ? convertFlowType(p.bound.typeAnnotation)
        : null;
      const defaultType = p.default ? convertFlowType(p.default) : null;
      const param = t.tsTypeParameter(constraint, defaultType, p.name);
      return copyComments(p, param);
    });
    if (
      optionsForDecl.tsxArrowGuard &&
      params.length === 1 &&
      !params[0].constraint &&
      !params[0].default
    ) {
      params[0].constraint = t.tsUnknownKeyword();
    }
    return copyComments(decl, t.tsTypeParameterDeclaration(params));
  }

  function convertObjectTypeAnnotation(objNode) {
    const members = [];
    const spreads = [];
    const mappedTypes = [];

    for (const prop of objNode.properties || []) {
      if (prop.type === 'ObjectTypeSpreadProperty') {
        spreads.push(convertFlowType(prop.argument));
        continue;
      }
      if (prop.type === 'ObjectTypeProperty') {
        const keyNode = t.isIdentifier(prop.key)
          ? t.identifier(prop.key.name)
          : t.stringLiteral(prop.key.value);

        if (prop.method && prop.value && prop.value.type === 'FunctionTypeAnnotation') {
          const fnType = convertFlowType(prop.value);
          const methodSig = t.tsMethodSignature(
            keyNode,
            fnType.typeParameters || null,
            fnType.parameters || [],
            fnType.typeAnnotation || null
          );
          if (prop.optional) methodSig.optional = true;
          members.push(copyComments(prop, methodSig));
        } else {
          const valueType = convertFlowType(prop.value, {
            optionalSlot: Boolean(prop.optional),
          });
          const propSig = t.tsPropertySignature(
            keyNode,
            t.tsTypeAnnotation(valueType)
          );
          if (prop.optional) propSig.optional = true;
          if (prop.variance && prop.variance.kind === 'plus') {
            propSig.readonly = true;
          }
          members.push(copyComments(prop, propSig));
        }
      }
    }

    for (const indexer of objNode.indexers || []) {
      const keyType = convertFlowType(indexer.key);
      const valType = convertFlowType(indexer.value);
      const keyName =
        indexer.id && t.isIdentifier(indexer.id) ? indexer.id.name : 'key';
      if (isPrimitiveIndexKey(keyType)) {
        const param = t.identifier(keyName);
        param.typeAnnotation = t.tsTypeAnnotation(keyType);
        const indexSig = t.tsIndexSignature(
          [param],
          t.tsTypeAnnotation(valType)
        );
        if (indexer.variance && indexer.variance.kind === 'plus') {
          indexSig.readonly = true;
        }
        members.push(copyComments(indexer, indexSig));
      } else {
        const tp = t.tsTypeParameter(keyType, null, keyName);
        const mapped = t.tsMappedType(tp, valType);
        if (indexer.variance && indexer.variance.kind === 'plus') {
          mapped.readonly = true;
        }
        mappedTypes.push(copyComments(indexer, mapped));
      }
    }

    for (const callProp of objNode.callProperties || []) {
      const fnType = convertFlowType(callProp.value);
      const callSig = t.tsCallSignatureDeclaration(
        fnType.typeParameters || null,
        fnType.parameters || [],
        fnType.typeAnnotation || null
      );
      members.push(copyComments(callProp, callSig));
    }

    const parts = [];
    for (const sp of spreads) {
      parts.push(wrapIfNeedsParensInUnionOrIntersection(sp, true));
    }
    if (members.length > 0 || (spreads.length === 0 && mappedTypes.length === 0)) {
      parts.push(t.tsTypeLiteral(members));
    }
    for (const mp of mappedTypes) {
      parts.push(mp);
    }

    if (parts.length === 1) {
      return parts[0];
    }
    return t.tsIntersectionType(parts);
  }

  function convertTypeAnnotationNode(typeAnnNode, ctx = {}) {
    if (!typeAnnNode) return null;
    if (typeAnnNode.type === 'TypeAnnotation') {
      const tsAnn = t.tsTypeAnnotation(
        convertFlowType(typeAnnNode.typeAnnotation, ctx)
      );
      return copyComments(typeAnnNode, tsAnn);
    }
    return typeAnnNode;
  }

  function convertPatternType(param) {
    if (!param) return;
    if (t.isAssignmentPattern(param)) {
      if (t.isIdentifier(param.left) && param.left.optional) {
        param.left.optional = false;
      }
      convertPatternType(param.left);
      return;
    }
    if (t.isRestElement(param)) {
      if (param.typeAnnotation) {
        param.typeAnnotation = convertTypeAnnotationNode(param.typeAnnotation);
      }
      convertPatternType(param.argument);
      return;
    }
    if (param.typeAnnotation) {
      param.typeAnnotation = convertTypeAnnotationNode(param.typeAnnotation, {
        optionalSlot: Boolean(param.optional),
      });
    }
  }

  const consumedCommentKeys = new Set();

  function getCommentKey(c) {
    return `${c.start}:${c.end}:${c.value}`;
  }

  function getMissingLocalAnnotCommentsOnNode(node) {
    if (!node) return [];
    const list = [
      ...(node.leadingComments || []),
      ...((node.comments || []).filter((c) => c.leading)),
    ];
    return list.filter((c) =>
      /\$Flow(?:FixMe|Ignore|ExpectedError)\[missing-local-annot\]/.test(
        c.value
      )
    );
  }

  function markCommentsConsumed(comments) {
    for (const c of comments) {
      if (
        /^\s*\$Flow(?:FixMe|Ignore|ExpectedError)\[missing-local-annot\]\s*$/.test(
          c.value
        )
      ) {
        consumedCommentKeys.add(getCommentKey(c));
      }
    }
  }

  function getFunctionMissingLocalAnnotComments(pathObj) {
    const found = [];
    let cur = pathObj;
    while (cur && cur.node) {
      found.push(...getMissingLocalAnnotCommentsOnNode(cur.node));
      const parentPath = cur.parentPath;
      if (!parentPath || !parentPath.node) break;
      const pNode = parentPath.node;
      if (
        t.isVariableDeclarator(pNode) ||
        t.isVariableDeclaration(pNode) ||
        t.isExportNamedDeclaration(pNode) ||
        t.isExportDefaultDeclaration(pNode) ||
        t.isObjectProperty(pNode) ||
        t.isClassProperty(pNode) ||
        t.isClassPrivateProperty(pNode) ||
        t.isAssignmentExpression(pNode) ||
        t.isExpressionStatement(pNode) ||
        t.isJSXExpressionContainer(pNode) ||
        t.isJSXAttribute(pNode) ||
        t.isCallExpression(pNode)
      ) {
        cur = parentPath;
        continue;
      }
      break;
    }
    return found;
  }

  // First pass: detect JSX so we know if TSX arrow generic disambiguation is needed
  traverse(ast, {
    JSXElement() {
      hasJsx = true;
    },
    JSXFragment() {
      hasJsx = true;
    },
  });

  // Main Flow -> TypeScript AST conversion pass
  traverse(ast, {
    ImportDeclaration(pathObj) {
      const node = pathObj.node;
      if (node.importKind === 'typeof') {
        node.importKind = 'type';
      }
      for (const spec of node.specifiers) {
        if (spec.importKind === 'typeof') {
          spec.importKind = 'type';
        }
      }
    },

    TypeAlias(pathObj) {
      const node = pathObj.node;
      const tsDecl = t.tsTypeAliasDeclaration(
        node.id,
        convertTypeParamDeclaration(node.typeParameters),
        convertFlowType(node.right)
      );
      copyComments(node, tsDecl);
      convertedNodes++;
      pathObj.replaceWith(tsDecl);
    },

    OpaqueType(pathObj) {
      const node = pathObj.node;
      const tsDecl = t.tsTypeAliasDeclaration(
        node.id,
        convertTypeParamDeclaration(node.typeParameters),
        convertFlowType(node.impltype || node.supertype)
      );
      copyComments(node, tsDecl);
      convertedNodes++;
      pathObj.replaceWith(tsDecl);
    },

    InterfaceDeclaration(pathObj) {
      const node = pathObj.node;
      const convertedBody = convertObjectTypeAnnotation(node.body);
      const ext = (node.extends || []).map((e) =>
        copyComments(
          e,
          t.tsExpressionWithTypeArguments(
            convertTypeId(e.id),
            convertTypeParamInstantiation(e.typeParameters)
          )
        )
      );
      const typeParams = convertTypeParamDeclaration(node.typeParameters);

      if (t.isTSTypeLiteral(convertedBody)) {
        const iface = t.tsInterfaceDeclaration(
          node.id,
          typeParams,
          ext.length > 0 ? ext : null,
          t.tsInterfaceBody(convertedBody.members)
        );
        copyComments(node, iface);
        convertedNodes++;
        pathObj.replaceWith(iface);
      } else {
        // Fallback to type alias when body uses mapped types or spreads
        const parts = ext.map((e) =>
          t.tsTypeReference(e.expression, e.typeParameters)
        );
        parts.push(convertedBody);
        const alias = t.tsTypeAliasDeclaration(
          node.id,
          typeParams,
          parts.length === 1 ? parts[0] : t.tsIntersectionType(parts)
        );
        copyComments(node, alias);
        convertedNodes++;
        pathObj.replaceWith(alias);
      }
    },

    DeclareTypeAlias(pathObj) {
      const node = pathObj.node;
      const tsDecl = t.tsTypeAliasDeclaration(
        node.id,
        convertTypeParamDeclaration(node.typeParameters),
        convertFlowType(node.right)
      );
      tsDecl.declare = true;
      copyComments(node, tsDecl);
      pathObj.replaceWith(tsDecl);
    },

    DeclareInterface(pathObj) {
      const node = pathObj.node;
      const convertedBody = convertObjectTypeAnnotation(node.body);
      if (t.isTSTypeLiteral(convertedBody)) {
        const iface = t.tsInterfaceDeclaration(
          node.id,
          convertTypeParamDeclaration(node.typeParameters),
          null,
          t.tsInterfaceBody(convertedBody.members)
        );
        iface.declare = true;
        copyComments(node, iface);
        pathObj.replaceWith(iface);
      }
    },

    TypeCastExpression(pathObj) {
      const node = pathObj.node;
      const tsType = convertFlowType(node.typeAnnotation.typeAnnotation);
      let expr = node.expression;
      if (t.isTypeCastExpression(expr)) {
        // Nested ((x: any): T) -> ((x as any) as T) handled bottom-up or keep recursion clean
      }
      const asExpr = t.tsAsExpression(expr, tsType);
      const needsParens = needsParensAroundAsExpression(pathObj);
      const replacement = needsParens ? t.parenthesizedExpression(asExpr) : asExpr;
      copyComments(node, replacement);
      convertedNodes++;
      pathObj.replaceWith(replacement);
    },

    ClassDeclaration(pathObj) {
      const node = pathObj.node;
      if (node.typeParameters) {
        node.typeParameters = convertTypeParamDeclaration(node.typeParameters);
      }
      if (node.superTypeParameters) {
        node.superTypeParameters = convertTypeParamInstantiation(
          node.superTypeParameters
        );
      }
      if (node.implements && node.implements.length > 0) {
        node.implements = node.implements.map((imp) =>
          copyComments(
            imp,
            t.tsExpressionWithTypeArguments(
              imp.id,
              convertTypeParamInstantiation(imp.typeParameters)
            )
          )
        );
      }
    },

    ClassExpression(pathObj) {
      const node = pathObj.node;
      if (node.typeParameters) {
        node.typeParameters = convertTypeParamDeclaration(node.typeParameters);
      }
      if (node.superTypeParameters) {
        node.superTypeParameters = convertTypeParamInstantiation(
          node.superTypeParameters
        );
      }
      if (node.implements && node.implements.length > 0) {
        node.implements = node.implements.map((imp) =>
          copyComments(
            imp,
            t.tsExpressionWithTypeArguments(
              imp.id,
              convertTypeParamInstantiation(imp.typeParameters)
            )
          )
        );
      }
    },

    ClassProperty(pathObj) {
      const node = pathObj.node;
      if (node.variance && node.variance.kind === 'plus') {
        node.readonly = true;
      }
      node.variance = null;
      if (node.typeAnnotation) {
        node.typeAnnotation = convertTypeAnnotationNode(node.typeAnnotation, {
          optionalSlot: Boolean(node.optional),
        });
      } else if (
        !(
          t.isArrowFunctionExpression(node.value) ||
          t.isFunctionExpression(node.value)
        )
      ) {
        const missingAnnotComments = getMissingLocalAnnotCommentsOnNode(node);
        if (missingAnnotComments.length > 0) {
          node.typeAnnotation = t.tsTypeAnnotation(t.tsAnyKeyword());
          node.original = null;
          markCommentsConsumed(missingAnnotComments);
        }
      }
    },

    ClassPrivateProperty(pathObj) {
      const node = pathObj.node;
      if (node.variance && node.variance.kind === 'plus') {
        node.readonly = true;
      }
      node.variance = null;
      if (node.typeAnnotation) {
        node.typeAnnotation = convertTypeAnnotationNode(node.typeAnnotation);
      } else if (
        !(
          t.isArrowFunctionExpression(node.value) ||
          t.isFunctionExpression(node.value)
        )
      ) {
        const missingAnnotComments = getMissingLocalAnnotCommentsOnNode(node);
        if (missingAnnotComments.length > 0) {
          node.typeAnnotation = t.tsTypeAnnotation(t.tsAnyKeyword());
          node.original = null;
          markCommentsConsumed(missingAnnotComments);
        }
      }
    },

    Function(pathObj) {
      const node = pathObj.node;
      if (node.predicate) node.predicate = null;
      if (node.typeParameters) {
        node.typeParameters = convertTypeParamDeclaration(node.typeParameters, {
          tsxArrowGuard: hasJsx && pathObj.isArrowFunctionExpression(),
        });
      }
      if (node.params) {
        const fnMissingAnnotComments =
          node.params.length > 0
            ? getFunctionMissingLocalAnnotComments(pathObj)
            : [];
        let usedFnMissingAnnot = false;

        for (const p of node.params) {
          convertPatternType(p);
          const target = t.isAssignmentPattern(p) ? p.left : p;
          if (target && !target.typeAnnotation) {
            const paramMissingComments = [
              ...getMissingLocalAnnotCommentsOnNode(p),
              ...(target !== p ? getMissingLocalAnnotCommentsOnNode(target) : []),
            ];
            if (
              paramMissingComments.length > 0 ||
              fnMissingAnnotComments.length > 0
            ) {
              target.typeAnnotation = t.isRestElement(target)
                ? t.tsTypeAnnotation(t.tsArrayType(t.tsAnyKeyword()))
                : t.tsTypeAnnotation(t.tsAnyKeyword());
              target.original = null;
              p.original = null;
              if (
                pathObj.isArrowFunctionExpression() &&
                node.params.length === 1 &&
                t.isIdentifier(target)
              ) {
                if (p.comments && p.comments.length > 0) {
                  node.comments = [...(node.comments || []), ...p.comments];
                  p.comments = null;
                }
                node.original = null;
              }
              if (paramMissingComments.length > 0) {
                markCommentsConsumed(paramMissingComments);
              }
              if (fnMissingAnnotComments.length > 0) {
                usedFnMissingAnnot = true;
              }
            }
          }
        }
        if (usedFnMissingAnnot) {
          markCommentsConsumed(fnMissingAnnotComments);
        }
        fixOptionalThenRequiredParams(node.params);
      }
      if (node.returnType) {
        node.returnType = convertTypeAnnotationNode(node.returnType);
      }
    },

    VariableDeclarator(pathObj) {
      convertPatternType(pathObj.node.id);
    },

    CallExpression(pathObj) {
      const node = pathObj.node;
      if (node.typeArguments) {
        node.typeParameters = convertTypeParamInstantiation(node.typeArguments);
        node.typeArguments = null;
      }
    },

    OptionalCallExpression(pathObj) {
      const node = pathObj.node;
      if (node.typeArguments) {
        node.typeParameters = convertTypeParamInstantiation(node.typeArguments);
        node.typeArguments = null;
      }
    },

    NewExpression(pathObj) {
      const node = pathObj.node;
      if (node.typeArguments) {
        node.typeParameters = convertTypeParamInstantiation(node.typeArguments);
        node.typeArguments = null;
      }
    },

    JSXOpeningElement(pathObj) {
      const node = pathObj.node;
      if (node.typeArguments) {
        node.typeParameters = convertTypeParamInstantiation(node.typeArguments);
        node.typeArguments = null;
      }
    },

    TypeAnnotation(pathObj) {
      // Catch-all for any remaining TypeAnnotation node (e.g. ObjectPattern / ArrayPattern / CatchClause)
      const parent = pathObj.parent;
      const optionalSlot = Boolean(parent && parent.optional);
      pathObj.replaceWith(convertTypeAnnotationNode(pathObj.node, { optionalSlot }));
    },
  });

  if (consumedCommentKeys.size > 0) {
    const filterList = (list) =>
      Array.isArray(list)
        ? list.filter((c) => !consumedCommentKeys.has(getCommentKey(c)))
        : list;
    const stripConsumed = (n) => {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) {
        for (const item of n) stripConsumed(item);
        return;
      }
      if (n.comments) n.comments = filterList(n.comments);
      if (n.leadingComments) n.leadingComments = filterList(n.leadingComments);
      if (n.trailingComments) n.trailingComments = filterList(n.trailingComments);
      if (n.innerComments) n.innerComments = filterList(n.innerComments);
      for (const k of Object.keys(n)) {
        if (
          k === 'loc' ||
          k === 'start' ||
          k === 'end' ||
          k === 'extra' ||
          k === 'original' ||
          k === 'tokens'
        ) {
          continue;
        }
        stripConsumed(n[k]);
      }
    };
    stripConsumed(ast);
  }

  const lineTerminator = source.includes('\r\n') ? '\r\n' : '\n';
  const rawPrinted = recast.print(ast, { lineTerminator }).code;
  const code = separateAngleBracketLineComments(rawPrinted, [
    'typescript',
    'jsx',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'exportDefaultFrom',
    'exportNamespaceFrom',
  ]);
  return {
    code,
    hasJsx,
    hadFlowComments,
    convertedNodes,
  };
}
