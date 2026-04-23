import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const [labelArg, commandArg] = process.argv.slice(2);

if (!labelArg || !commandArg) {
  console.error('Usage: node scripts/run-with-temp-cleanup.mjs <label> <command>');
  process.exit(1);
}

const sanitizeLabel = (value) => value.replace(/[^a-zA-Z0-9_-]+/g, '-');
const label = sanitizeLabel(labelArg);

const cleanupTargets = [
  'packages/swissarmypm/dist',
  'packages/swissarmypm/tsconfig.tsbuildinfo',
  'packages/swissarmypm/.vite',
  'packages/swissarmypm/.cache',
  'packages/pmbrain/dist',
  'packages/pmbrain/tsconfig.tsbuildinfo',
].map((relativePath) => path.join(repoRoot, relativePath));

const extraCleanupTargets = (process.env.VERIFY_EXTRA_CLEANUP_PATHS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
  .map((relativePath) => path.resolve(repoRoot, relativePath));

const uniqueCleanupTargets = [...new Set([...cleanupTargets, ...extraCleanupTargets])];

let child = null;
let tempDir = null;
let shuttingDown = false;

async function removeIfSafe(targetPath) {
  const relative = path.relative(repoRoot, targetPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to remove path outside repo root: ${targetPath}`);
  }

  await rm(targetPath, { recursive: true, force: true, maxRetries: 2, retryDelay: 100 });
}

async function cleanupArtifacts() {
  if (process.env.VERIFY_KEEP_ARTIFACTS === '1') {
    console.log('[verify-cleanup] VERIFY_KEEP_ARTIFACTS=1, skip cleanup');
    return;
  }

  const targets = tempDir ? [tempDir, ...uniqueCleanupTargets] : uniqueCleanupTargets;

  for (const target of targets) {
    try {
      await removeIfSafe(target);
      console.log(`[verify-cleanup] removed ${target}`);
    } catch (error) {
      console.warn(`[verify-cleanup] failed to remove ${target}: ${error.message}`);
    }
  }
}

function forwardSignal(signal) {
  if (child && !child.killed) {
    child.kill(signal);
  }
}

async function shutdown(signal, exitCode = 1) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  if (signal) {
    console.warn(`[verify-cleanup] received ${signal}, stopping child process...`);
    forwardSignal(signal);
  }

  await cleanupArtifacts();
  process.exit(exitCode);
}

process.on('SIGINT', () => {
  shutdown('SIGINT', 130).catch((error) => {
    console.error(error);
    process.exit(130);
  });
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM', 143).catch((error) => {
    console.error(error);
    process.exit(143);
  });
});

process.on('uncaughtException', (error) => {
  console.error(error);
  shutdown('uncaughtException', 1).catch(() => process.exit(1));
});

process.on('unhandledRejection', (error) => {
  console.error(error);
  shutdown('unhandledRejection', 1).catch(() => process.exit(1));
});

try {
  tempDir = await mkdtemp(path.join(repoRoot, '.verify-tmp-'));
  console.log(`[verify-cleanup] using temp dir ${tempDir}`);

  const childEnv = {
    ...process.env,
    TMPDIR: tempDir,
    TMP: tempDir,
    TEMP: tempDir,
  };

  child = spawn(commandArg, {
    cwd: repoRoot,
    env: childEnv,
    shell: true,
    stdio: 'inherit',
  });

  const exitCode = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        resolve(1);
        return;
      }

      resolve(code ?? 0);
    });
  });

  await cleanupArtifacts();
  process.exit(exitCode);
} catch (error) {
  console.error(error);
  await cleanupArtifacts();
  process.exit(1);
}
