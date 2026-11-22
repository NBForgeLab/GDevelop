// @ts-check
/**
 * Post (or update) a comment on the pull request of the current branch with
 * links to the Storybook published for it, and direct links to the stories
 * that the pull request adds or modifies.
 *
 * Used by the "Build Storybook" GitHub workflow, after the Storybook is
 * published. Requires the GitHub CLI (`gh`) authenticated with a token able to
 * comment on pull requests (`GH_TOKEN`).
 *
 * Usage: node scripts/comment-storybook-links-on-pull-request.js <branch> <commit sha>
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { toId, storyNameFromExport } = require('@storybook/csf');

const COMMENT_MARKER = '<!-- storybook-links -->';
const STORYBOOK_BASE_URL = 'https://gdevelop-storybook.s3.amazonaws.com';
const APP_PATH_IN_REPOSITORY = 'newIDE/app/';
const STORIES_PATH_IN_REPOSITORY = 'newIDE/app/src/stories/';

/** @param {string[]} args */
const gh = args => execFileSync('gh', args, { encoding: 'utf8' }).trim();

/**
 * Extract the top-level `title` string literal from an object literal starting
 * at `openBraceIndex` (`source[openBraceIndex] === '{'`).
 * @param {string} source
 * @param {number} openBraceIndex
 * @returns {string | null}
 */
const extractTitleFromObjectLiteral = (source, openBraceIndex) => {
  if (openBraceIndex < 0 || source[openBraceIndex] !== '{') return null;

  let depth = 0;
  let topLevelContent = '';
  for (let i = openBraceIndex; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];

    // Skip single-line comments.
    if (ch === '/' && next === '/') {
      i += 2;
      while (i < source.length && source[i] !== '\n') i++;
      if (depth === 1) topLevelContent += '\n';
      continue;
    }
    // Skip block comments.
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        i++;
      }
      i++;
      if (depth === 1) topLevelContent += ' ';
      continue;
    }
    // Preserve string literals at depth 1 and skip them at deeper levels.
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      let literal = quote;
      i++;
      while (i < source.length) {
        const c = source[i];
        literal += c;
        if (c === '\\' && i + 1 < source.length) {
          i++;
          literal += source[i];
        } else if (c === quote) {
          break;
        }
        i++;
      }
      if (depth === 1) topLevelContent += literal;
      continue;
    }

    if (ch === '{') {
      depth++;
      if (depth === 1) topLevelContent += '{';
      continue;
    }
    if (ch === '}') {
      depth--;
      if (depth === 0) break;
      if (depth === 1) topLevelContent += ' ';
      continue;
    }

    if (depth === 1) {
      topLevelContent += ch;
    }
  }

  const titleMatch = topLevelContent.match(
    /(?:^|[{,\s])title\s*:\s*(['"`])((?:\\.|(?!\1).)+)\1/
  );
  return titleMatch ? titleMatch[2] : null;
};

/**
 * Extract the story title from JS or TS Storybook default exports:
 * - `export default { title: '...' }` (including `satisfies Meta<...>`)
 * - `export default ({ title: '...' } as Meta<...>)`
 * - `const meta: Meta<...> = { title: '...' }; export default meta;`
 * @param {string} source
 * @returns {string | null}
 */
const extractStoryTitle = source => {
  const inlineDefaultExportMatch = /export\s+default\s*\(?\s*\{/.exec(source);
  if (inlineDefaultExportMatch) {
    const openBraceIndex =
      inlineDefaultExportMatch.index + inlineDefaultExportMatch[0].length - 1;
    const inlineTitle = extractTitleFromObjectLiteral(source, openBraceIndex);
    if (inlineTitle) return inlineTitle;
  }

  const identifierDefaultExportMatch = /export\s+default\s+([A-Za-z_$][A-Za-z0-9_$]*)\b/.exec(
    source
  );
  if (identifierDefaultExportMatch) {
    const metaIdentifier = identifierDefaultExportMatch[1];
    const declRegex = new RegExp(
      `(?:const|let|var)\\s+${metaIdentifier}\\b(?:\\s*:[\\s\\S]*?)?\\s*=\\s*\\(?\\s*\\{`
    );
    const declMatch = declRegex.exec(source);
    if (declMatch) {
      const openBraceIndex = declMatch.index + declMatch[0].length - 1;
      const declTitle = extractTitleFromObjectLiteral(source, openBraceIndex);
      if (declTitle) return declTitle;
    }
  }

  return null;
};

/**
 * @param {string} storyFilePath
 * @returns {Array<{ id: string, title: string, name: string }>}
 */
const getStoriesOfFile = storyFilePath => {
  const absolutePath = path.join(
    __dirname,
    '..',
    storyFilePath.substring(APP_PATH_IN_REPOSITORY.length)
  );
  if (!fs.existsSync(absolutePath)) return []; // The file was deleted.

  const source = fs.readFileSync(absolutePath, 'utf8');
  const title = extractStoryTitle(source);
  if (!title) return [];

  const stories = [];
  const exportRegex = /^export\s+(?:const|function)\s+([A-Za-z0-9_$]+)/gm;
  let match;
  while ((match = exportRegex.exec(source))) {
    const name = storyNameFromExport(match[1]);
    stories.push({ id: toId(title, name), title, name });
  }
  return stories;
};

/**
 * @param {string} branch
 * @param {string} commitSha
 */
const main = (branch, commitSha) => {
  const pullRequests = JSON.parse(
    gh(['pr', 'list', '--head', branch, '--state', 'open', '--json', 'number'])
  );
  if (!pullRequests.length) {
    console.log(`No open pull request for branch "${branch}", nothing to do.`);
    return;
  }
  const { number } = pullRequests[0];
  /** @type {string[]} */
  const changedFilePaths = JSON.parse(
    gh(['pr', 'view', String(number), '--json', 'files'])
  ).files.map(file => file.path);

  const commentIds = gh([
    'api',
    `repos/{owner}/{repo}/issues/${number}/comments`,
    '--paginate',
    '--jq',
    `.[] | select(.body | contains("${COMMENT_MARKER}")) | .id`,
  ])
    .split('\n')
    .filter(Boolean);
  const existingCommentId = commentIds[0] || null;

  // Avoid commenting on pull requests that don't touch the editor at all,
  // but always keep an existing comment up to date.
  const isEditorChanged = changedFilePaths.some(filePath =>
    filePath.startsWith(APP_PATH_IN_REPOSITORY)
  );
  if (!isEditorChanged && !existingCommentId) {
    console.log('The pull request does not change the editor, nothing to do.');
    return;
  }

  const branchUrl = `${STORYBOOK_BASE_URL}/${branch}/latest/index.html`;
  const commitUrl = `${STORYBOOK_BASE_URL}/${branch}/commit/${commitSha}/index.html`;
  const stories = changedFilePaths
    .filter(
      filePath =>
        filePath.startsWith(STORIES_PATH_IN_REPOSITORY) &&
        /\.stories\.(js|jsx|ts|tsx)$/.test(filePath)
    )
    .flatMap(getStoriesOfFile);

  const lines = [
    COMMENT_MARKER,
    `**Storybook** for this branch: [latest](${branchUrl}) · [commit ${commitSha.substring(
      0,
      7
    )}](${commitUrl})`,
  ];
  if (stories.length) {
    lines.push('', 'Stories added or modified by this pull request:');
    for (const story of stories) {
      lines.push(
        `- [${story.title} › ${story.name}](${branchUrl}?path=/story/${
          story.id
        })`
      );
    }
  }
  lines.push(
    '',
    '<sub>Updated automatically after each Storybook build.</sub>'
  );
  const body = lines.join('\n');

  if (existingCommentId) {
    gh([
      'api',
      '--method',
      'PATCH',
      `repos/{owner}/{repo}/issues/comments/${existingCommentId}`,
      '-f',
      `body=${body}`,
    ]);
    console.log(`Updated the Storybook comment on pull request #${number}.`);
  } else {
    gh(['pr', 'comment', String(number), '--body', body]);
    console.log(`Commented the Storybook links on pull request #${number}.`);
  }
};

if (require.main === module) {
  const [branch, commitSha] = process.argv.slice(2);
  if (!branch || !commitSha) {
    console.error(
      'Usage: comment-storybook-links-on-pull-request.js <branch> <commit sha>'
    );
    process.exit(1);
  }
  main(branch, commitSha);
}

module.exports = { getStoriesOfFile };
