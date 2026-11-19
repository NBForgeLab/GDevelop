const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
const { getLocales, getLocalePath } = require('./lib/Locales');
const isWin = /^win/.test(process.platform);

const gdScriptsPath = path.join(__dirname, '../../../scripts');
const newIdeAppPath = path.join(__dirname, '..');

const run = async () => {
  let hasErrors = false;

  // Clean existing English messages catalog, if any
  const enMessagesJsPath = path.join(
    newIdeAppPath,
    'src/locales/en/messages.js'
  );
  if (fs.existsSync(enMessagesJsPath)) {
    shell.echo(
      `ℹ️ Removing ${enMessagesJsPath} as "en" should not have any translations ("pot" file)`
    );
    const rmJsResult = shell.rm(enMessagesJsPath);
    if (rmJsResult.code !== 0 || rmJsResult.stderr) {
      shell.echo(
        `❌ Error while removing ${enMessagesJsPath}: ${rmJsResult.stderr ||
          `exit code ${rmJsResult.code}`}`
      );
      hasErrors = true;
    }
  }
  const enIdeMessagesPotPath = path.join(
    newIdeAppPath,
    'src/locales/en/ide-messages.pot'
  );
  if (fs.existsSync(enIdeMessagesPotPath)) {
    shell.echo(
      `ℹ️ Removing ${enIdeMessagesPotPath} as "en" should not have any translations ("pot" file)`
    );
    const rmPotResult = shell.rm(enIdeMessagesPotPath);
    if (rmPotResult.code !== 0 || rmPotResult.stderr) {
      shell.echo(
        `❌ Error while removing ${enIdeMessagesPotPath}: ${rmPotResult.stderr ||
          `exit code ${rmPotResult.code}`}`
      );
      hasErrors = true;
    }
  }

  // Launch "lingui extract" for extracting newIDE translations
  shell.echo('ℹ️ Extracting translations for newIDE...');

  if (
    shell.exec('node node_modules/.bin/lingui extract --clean --overwrite', {
      cwd: newIdeAppPath,
    }).code !== 0
  ) {
    hasErrors = true;
  }

  shell.echo('ℹ️ Renaming extracted translations to ide-messages.po...');
  const locales = await getLocales();
  for (const locale of locales) {
    const localePath = getLocalePath(locale);
    const sourceCatalogPath = path.join(localePath, 'messages.po');
    const targetCatalogPath = path.join(
      localePath,
      locale === 'en' || locale === 'pseudo_LOCALE'
        ? 'ide-messages.pot'
        : 'ide-messages.po'
    );
    const mvResult = shell.mv(sourceCatalogPath, targetCatalogPath);
    if (mvResult.code !== 0 || mvResult.stderr) {
      shell.echo(
        `❌ Error while renaming ${sourceCatalogPath} to ${targetCatalogPath}: ${mvResult.stderr ||
          `exit code ${mvResult.code}`}`
      );
      hasErrors = true;
    }
  }

  // Launch extractions of translations in GDCore/GDJS
  // and extensions with gettext.
  shell.echo(
    'ℹ️ Extracting translations for GDCore/GDJS/Extensions to scripts/gdcore-gdcpp-gdjs-extensions-messages.pot...'
  );
  const gdExtractCommand = isWin
    ? 'ExtractTranslations.bat'
    : './ExtractTranslations.sh ';
  if (
    shell.exec(gdExtractCommand, {
      cwd: gdScriptsPath,
    }).code !== 0
  ) {
    hasErrors = true;
  }

  if (!hasErrors) {
    shell.echo('✅ Translations extracted');
  } else {
    shell.echo('❌ Error(s) occurred while extracting translations');
    process.exitCode = 1;
  }
};

run().catch(error => {
  shell.echo(
    '❌ Error(s) occurred while extracting translations:',
    error instanceof Error ? error.message : String(error)
  );
  process.exitCode = 1;
});
