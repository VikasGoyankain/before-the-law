/* Publishes dist/ by putting its contents on the `gh-pages` branch, which
   GitHub Pages serves. The branch holds the finished site and nothing else, so
   GitHub's own "download this branch as a zip" link doubles as the offline
   copy that the teachers' page offers.

   It works in a temporary git worktree, so the files you are editing are never
   touched, and it adds an ordinary commit each time (no force-push).
   Run `node package.mjs` first.   Usage: node publish.mjs */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { SITE } from './site.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const dist = path.join(root, 'dist');
const BRANCH = 'gh-pages';
const git = (cmd, cwd = root) => execSync('git ' + cmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();

if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('dist/ is not built: run node package.mjs first');
const from = git('rev-parse --short HEAD') + (git('status --porcelain -- dist') ? ' (with uncommitted changes in dist)' : '');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pages-'));

try {
  const onRemote = git('ls-remote --heads origin ' + BRANCH) !== '';
  if (onRemote) {
    git('fetch origin ' + BRANCH);
    git(`worktree add --force -B ${BRANCH} "${tmp}" origin/${BRANCH}`);
  } else {
    /* first time: a branch with no history and no files of its own */
    git(`worktree add --force --detach "${tmp}"`);
    git('checkout --orphan ' + BRANCH, tmp);
    git('rm -rf --quiet .', tmp);
  }
  /* replace the branch's contents with dist/, keeping only the worktree's .git link */
  for (const f of fs.readdirSync(tmp)) if (f !== '.git') fs.rmSync(path.join(tmp, f), { recursive: true, force: true });
  fs.cpSync(dist, tmp, { recursive: true });
  git('add -A', tmp);
  if (!git('status --porcelain', tmp)) {
    console.log('Nothing to publish: ' + BRANCH + ' already matches dist/.');
  } else {
    git(`commit --quiet -m "Publish site from ${from}"`, tmp);
    git('push origin ' + BRANCH, tmp);
    console.log('Published ' + fs.readdirSync(dist).length + ' files from ' + from + ' to ' + BRANCH + '.');
    console.log('GitHub Pages takes a minute or two to update: ' + SITE);
  }
} finally {
  try { git(`worktree remove --force "${tmp}"`); } catch (e) { /* already gone */ }
  fs.rmSync(tmp, { recursive: true, force: true });
}
