const fs = require('fs');
const path = require('path');
const {
  resolveCanonicalPathSync,
  isPathWithinCanonicalRoot,
  isSensitiveCanonicalPath,
} = require('./GdevelopFileProtocol');

/** Main-process capabilities. Never grant a path merely because a renderer names it. */
const createFileAccessPolicy = ({ readRoots = [], writeRoots = [] } = {}) => {
  const grants = [];
  const grant = (target, mode, recursive) => {
    if (typeof target !== 'string' || !path.isAbsolute(target)) return false;
    const canonical = resolveCanonicalPathSync(target);
    if (!canonical || isSensitiveCanonicalPath(canonical)) return false;
    if (
      !grants.some(
        g =>
          g.path === canonical && g.mode === mode && g.recursive === recursive
      )
    ) {
      grants.push({ path: canonical, mode, recursive });
    }
    return true;
  };
  const hasAccess = (target, mode = 'read') => {
    if (
      typeof target !== 'string' ||
      target.includes('\0') ||
      !path.isAbsolute(target)
    )
      return false;
    // Do not initiate SMB authentication while checking an ungranted UNC path.
    if (
      process.platform === 'win32' &&
      /^[\\/]{2}/.test(target) &&
      !grants.some(g => isPathWithinCanonicalRoot(target, g.path))
    )
      return false;
    const canonical = resolveCanonicalPathSync(target);
    if (!canonical || isSensitiveCanonicalPath(canonical)) return false;
    return grants.some(
      g =>
        (mode === 'read' || g.mode === 'write') &&
        (g.recursive
          ? isPathWithinCanonicalRoot(canonical, g.path)
          : path.relative(canonical, g.path) === '')
    );
  };
  const assertAccess = (target, mode = 'read') => {
    if (!hasAccess(target, mode)) {
      const error = new Error(
        `File ${mode} access is not authorized: ${String(target)}`
      );
      error.code = 'EACCES';
      throw error;
    }
    return target;
  };
  // Recursive operations must not follow a link into an ungranted directory.
  const assertTreeAccess = (target, mode = 'read', visited = new Set()) => {
    assertAccess(target, mode);
    if (!fs.existsSync(target)) return;
    const canonical = resolveCanonicalPathSync(target);
    if (visited.has(canonical)) return;
    visited.add(canonical);
    if (fs.statSync(target).isDirectory()) {
      for (const name of fs.readdirSync(target)) {
        assertTreeAccess(path.join(target, name), mode, visited);
      }
    }
  };
  const assertTreeAccessAsync = async (
    target,
    mode = 'read',
    visited = new Set()
  ) => {
    assertAccess(target, mode);
    let stat;
    try {
      stat = await fs.promises.stat(target);
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
    const canonical = await fs.promises.realpath(target);
    if (visited.has(canonical)) return;
    visited.add(canonical);
    if (stat.isDirectory()) {
      for (const name of await fs.promises.readdir(target)) {
        await assertTreeAccessAsync(path.join(target, name), mode, visited);
      }
    }
  };
  readRoots.filter(Boolean).forEach(p => grant(p, 'read', true));
  writeRoots.filter(Boolean).forEach(p => grant(p, 'write', true));
  const initialGrantCount = grants.length;
  return {
    hasAccess,
    assertAccess,
    assertTreeAccess,
    assertTreeAccessAsync,
    exportGrants: () => grants.slice(initialGrantCount).map(g => ({ ...g })),
    restoreGrants: saved => {
      if (!Array.isArray(saved)) return;
      saved.forEach(g => {
        if (
          g &&
          (g.mode === 'read' || g.mode === 'write') &&
          typeof g.recursive === 'boolean'
        ) {
          grant(g.path, g.mode, g.recursive);
        }
      });
    },
    grantRoot: (target, mode = 'read') => grant(target, mode, true),
    grantFile: (target, mode = 'read') => grant(target, mode, false),
  };
};

module.exports = { createFileAccessPolicy };
