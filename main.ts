// main.ts — hands Turkey Run in: copies game/ and screenshots/ from
// this repository to $MAKEFUN_OUTPUT_DIR and writes
// $MAKEFUN_OUTPUT_DIR/dossier.json with buildDossier from
// vendor/makefun-game.ts. Node 22 standard library only, no build step.
//
// It writes ONLY to $MAKEFUN_OUTPUT_DIR (throwing when it is unset),
// never to ./output, and never chmods the output directory itself:
// the grader runs as uid 65534 while /output belongs to root, so a
// bare chmod of the directory would fail with EPERM. Every chmod is
// wrapped (safeChmod) and applied to output files only, 0644.

import { buildDossier } from './vendor/makefun-game.ts';
import {
  cpSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
  chmodSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = process.env.MAKEFUN_OUTPUT_DIR;
if (!outDir) {
  throw new Error('MAKEFUN_OUTPUT_DIR is not set: this program writes only there');
}

const repoRoot = dirname(fileURLToPath(import.meta.url));

// A chmod that never kills the run: the grader's /output is owned by
// root and the grader runs as another user, so chmod can fail EPERM
// there. Files are chmodded for tidiness; the content is what matters.
function safeChmod(path: string, mode: number): void {
  try {
    chmodSync(path, mode);
  } catch {
    // Best effort only: a file the run cannot chmod is still handed in.
  }
}

// Copy one tree of plain files and directories, nothing else.
function copyTree(src: string, dest: string): void {
  const st = statSync(src);
  if (!st.isDirectory()) throw new Error(`${src}: not a directory`);
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyTree(from, to);
    } else if (entry.isFile()) {
      cpSync(from, to);
      safeChmod(to, 0o644);
    } else {
      throw new Error(`${from}: game/ and screenshots/ hold plain files and directories only`);
    }
  }
}

// Start from a clean output directory so a stale file can never leak in.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

copyTree(join(repoRoot, 'game'), join(outDir, 'game'));
copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));

// Fail fast, before buildDossier, when the copy left the entry
// incomplete: the page the gate requires, and at least one shot.
const indexHtml = join(outDir, 'game', 'index.html');
if (!statSync(indexHtml, { throwIfNoEntry: false })?.isFile()) {
  throw new Error('game/index.html missing after copy');
}
if (readdirSync(join(outDir, 'screenshots')).length === 0) {
  throw new Error('screenshots/ is empty after copy');
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
const dossierPath = join(outDir, 'dossier.json');
writeFileSync(dossierPath, dossier);
safeChmod(dossierPath, 0o644);

console.log(`turkey-run-game-01: wrote ${outDir} (dossier ${dossier.length} bytes)`);
