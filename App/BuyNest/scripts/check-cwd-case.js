#!/usr/bin/env node

/**
 * Windows paths are case-insensitive, but Metro treats module paths as case-sensitive.
 * Starting Expo from a folder typed with different casing than on disk (e.g. `app\buynest`
 * instead of `App\BuyNest`) bundles React twice and causes "Invalid hook call" errors.
 * This guard stops the dev server before that can happen.
 */

const fs = require('fs');

const stripDrive = (p) => p.replace(/^[a-zA-Z]:/, '');

const cwd = process.cwd();
const realPath = fs.realpathSync.native(cwd);

if (stripDrive(cwd) !== stripDrive(realPath)) {
  console.error(
    [
      '',
      'BuyNest: the current folder path does not match the casing on disk.',
      `  current: ${cwd}`,
      `  on disk: ${realPath}`,
      '',
      'Run this and start again:',
      `  cd "${realPath}"`,
      '',
    ].join('\n')
  );
  process.exit(1);
}
