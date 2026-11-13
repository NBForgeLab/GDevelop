#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { DEFAULT_GDEVELOP_JS_ROOT, getBuildPaths } = require('./build');

/**
 * Parse CLI arguments for the clean script.
 * @param {string[]} [argv]
 */
function parseCleanArgs(argv = process.argv.slice(2)) {
  let dryRun = false;
  let help = false;

  for (const arg of argv) {
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { dryRun, help };
}

/**
 * Return the exact list of paths removed by `clean`, matching the former Gruntfile.js.
 * @param {string} [gdevelopJsRoot]
 */
function getCleanTargets(gdevelopJsRoot = DEFAULT_GDEVELOP_JS_ROOT) {
  const { buildPath, buildOutputPath, glueCppPath, glueJsPath } =
    getBuildPaths(gdevelopJsRoot);

  return [
    buildPath,
    glueCppPath,
    glueJsPath,
    path.join(buildOutputPath, 'libGD.js'),
    path.join(buildOutputPath, 'libGD.wasm'),
  ];
}

/**
 * Remove GDevelop.js build artifacts and generated bindings.
 * @param {object} [options]
 */
function cleanBuildArtifacts({
  gdevelopJsRoot = DEFAULT_GDEVELOP_JS_ROOT,
  dryRun = false,
  rmSync = fs.rmSync,
  existsSync = fs.existsSync,
  log = console.log,
} = {}) {
  const targets = getCleanTargets(gdevelopJsRoot);
  const removedTargets = [];

  for (const target of targets) {
    const existed = existsSync(target);
    if (dryRun) {
      log(
        `[dry-run] Would remove ${target}${
          existed ? '' : ' (not currently present)'
        }`
      );
      if (existed) {
        removedTargets.push(target);
      }
    } else {
      rmSync(target, { recursive: true, force: true });
      if (existed) {
        log(`🧹 Removed ${target}`);
        removedTargets.push(target);
      }
    }
  }

  if (!dryRun && removedTargets.length === 0) {
    log('ℹ️ Nothing to clean.');
  }

  return {
    targets,
    removedTargets,
    dryRun,
  };
}

function printHelp() {
  console.log(`Usage: node scripts/clean.js [options]

Options:
  --dry-run   Print the paths that would be removed without deleting them
  -h, --help  Show this help message`);
}

function main(argv = process.argv.slice(2)) {
  try {
    const options = parseCleanArgs(argv);
    if (options.help) {
      printHelp();
      return;
    }

    cleanBuildArtifacts({ dryRun: options.dryRun });
  } catch (error) {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseCleanArgs,
  getCleanTargets,
  cleanBuildArtifacts,
  main,
};
