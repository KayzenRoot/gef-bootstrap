/// <reference types="node" />
/**
 * U12-03 / durable Node 22 filesystem storage implementation.
 *
 * Atomic directory locks serialize writers across local processes. A crash
 * while holding a lock refuses subsequent writes until independent recovery;
 * this implementation intentionally NEVER steals or ages out a lock.
 * State files are replaced via write+fsync+rename; consumers still verify
 * plan/source/actor bindings and trusted provider evidence.
 *
 * This is for trusted, local, single-host filesystems. Network/shared/cloud
 * storage must supply its own correctly fenced MarathonStateStore.
 */
import { mkdir, open, readFile, rename, rmdir, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { MarathonState } from './v12-marathon.js';
import type { MarathonStateStore } from './v12-marathon-persistence.js';

const KEY = /^sha256:[0-9a-f]{64}$/;

function names(directory: string, digest: string): { file: string; lock: string } {
  if (!KEY.test(digest)) throw new Error('MARATHON_INVALID_STORAGE_KEY');
  const stem = digest.slice(7);
  return { file: join(directory, stem + '.json'), lock: join(directory, stem + '.lock') };
}

async function readState(file: string): Promise<MarathonState | null> {
  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('MARATHON_STORAGE_CORRUPTED');
  }
  return value as MarathonState;
}

async function flushDirectory(directory: string): Promise<void> {
  if (process.platform === 'win32') return; // Directory fsync is not portable on Windows.
  const dir = await open(directory, 'r');
  try {
    await dir.sync();
  } finally {
    await dir.close();
  }
}

async function replaceState(directory: string, file: string, state: MarathonState): Promise<void> {
  const temp = join(directory, '.' + randomUUID() + '.tmp');
  let installed = false;
  try {
    const handle = await open(temp, 'wx', 0o600);
    try {
      await handle.writeFile(JSON.stringify(state), 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
    // Windows readers can transiently lock the destination. A bounded retry
    // preserves atomic replace semantics; never unlink an existing snapshot.
    for (let attempt = 0; ; attempt++) {
      try {
        await rename(temp, file);
        break;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (process.platform !== 'win32' || attempt >= 5 ||
            !['EPERM', 'EACCES', 'EBUSY'].includes(code ?? '')) throw error;
        await new Promise<void>(done => setTimeout(done, 10 * (attempt + 1)));
      }
    }
    installed = true;
    await flushDirectory(directory);
  } finally {
    if (!installed) await unlink(temp).catch(() => undefined);
  }
}

/** Durable local store. Caller must supply a trusted, isolated directory. */
export function createFileBackedMarathonStore(root: string): MarathonStateStore {
  if (typeof root !== 'string' || root.trim() === '')
    throw new Error('MARATHON_STORAGE_ROOT_REQUIRED');
  const directory = resolve(root);

  async function withLock(lock: string, operation: () => Promise<boolean>): Promise<boolean> {
    await mkdir(directory, { recursive: true });
    // A held lock is a CAS conflict, including after a crash. Never reclaim it.
    try {
      await mkdir(lock);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') return false;
      throw error;
    }
    try {
      return await operation();
    } finally {
      await rmdir(lock);
    }
  }

  return {
    async read(planDigest: string): Promise<MarathonState | null> {
      const { file } = names(directory, planDigest);
      const state = await readState(file);
      if (state && state.planDigest !== planDigest)
        throw new Error('MARATHON_STORAGE_KEY_MISMATCH');
      return state;
    },
    async createIfAbsent(planDigest: string, initial: MarathonState): Promise<boolean> {
      const { file, lock } = names(directory, planDigest);
      if (initial.planDigest !== planDigest) throw new Error('MARATHON_STORAGE_KEY_MISMATCH');
      return withLock(lock, async () => {
        if (await readState(file)) return false;
        await replaceState(directory, file, initial);
        return true;
      });
    },
    async compareAndSwap(
      planDigest: string, expectedStateDigest: string, next: MarathonState,
    ): Promise<boolean> {
      const { file, lock } = names(directory, planDigest);
      if (next.planDigest !== planDigest) throw new Error('MARATHON_STORAGE_KEY_MISMATCH');
      return withLock(lock, async () => {
        const previous = await readState(file);
        if (!previous || previous.planDigest !== planDigest ||
            previous.stateDigest !== expectedStateDigest) return false;
        await replaceState(directory, file, next);
        return true;
      });
    },
  };
}
