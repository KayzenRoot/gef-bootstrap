/// <reference types="node" />
/**
 * U12-05 local durable, single-host Delta ledger store.
 * Atomic mkdir locks serialize writers; abandoned locks are never reclaimed
 * automatically. A crash must NOT implicitly turn unknown test results PASS.
 * Unsuitable for network/cloud filesystems without an external fencing service.
 */
import { mkdir, open, readFile, rename, rmdir, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import type { DeltaLedger } from './v12-delta-assurance.js';
import type { DeltaLedgerStore } from './v12-delta-ledger-persistence.js';

const ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const SHA = /^[a-f0-9]{40}$/;

function storagePaths(root: string, workOrderId: string, headSha: string) {
  if (!ID.test(workOrderId) || !SHA.test(headSha))
    throw new Error('DELTA_INVALID_STORAGE_BINDING');
  const key = createHash('sha256').update(workOrderId + '\n' + headSha).digest('hex');
  return { file: join(root, key + '.json'), lock: join(root, key + '.lock') };
}

async function snapshot(file: string): Promise<DeltaLedger | null> {
  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('DELTA_STORAGE_CORRUPTED');
  return parsed as DeltaLedger;
}

async function flushDir(directory: string): Promise<void> {
  if (process.platform === 'win32') return;
  const handle = await open(directory, 'r');
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function writeDurable(directory: string, file: string, ledger: DeltaLedger): Promise<void> {
  const temp = join(directory, '.' + randomUUID() + '.tmp');
  let installed = false;
  try {
    const handle = await open(temp, 'wx', 0o600);
    try {
      await handle.writeFile(JSON.stringify(ledger), 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temp, file);
    installed = true;
    await flushDir(directory);
  } finally {
    if (!installed) await unlink(temp).catch(() => undefined);
  }
}

/**
 * Concrete trusted-local storage. Storage keys bind WORK ORDER and exact HEAD.
 * This supplies durability, NOT evidence authority or provider access.
 */
export function createFileBackedDeltaLedgerStore(directoryPath: string): DeltaLedgerStore {
  if (typeof directoryPath !== 'string' || !directoryPath.trim())
    throw new Error('DELTA_STORAGE_ROOT_REQUIRED');
  const root = resolve(directoryPath);

  async function withLock(lock: string, op: () => Promise<boolean>): Promise<boolean> {
    await mkdir(root, { recursive: true });
    try {
      await mkdir(lock);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') return false;
      throw error;
    }
    try {
      return await op();
    } finally {
      await rmdir(lock);
    }
  }

  return {
    async read(workOrderId: string, headSha: string): Promise<DeltaLedger | null> {
      const { file } = storagePaths(root, workOrderId, headSha);
      const ledger = await snapshot(file);
      if (ledger && (ledger.workOrderId !== workOrderId || ledger.headSha !== headSha))
        throw new Error('DELTA_STORAGE_KEY_MISMATCH');
      return ledger;
    },
    async createIfAbsent(workOrderId: string, headSha: string, initial: DeltaLedger): Promise<boolean> {
      const { file, lock } = storagePaths(root, workOrderId, headSha);
      if (initial.workOrderId !== workOrderId || initial.headSha !== headSha)
        throw new Error('DELTA_STORAGE_KEY_MISMATCH');
      return withLock(lock, async () => {
        if (await snapshot(file)) return false;
        await writeDurable(root, file, initial);
        return true;
      });
    },
    async compareAndSwap(
      workOrderId: string, headSha: string, expectedDigest: string, next: DeltaLedger,
    ): Promise<boolean> {
      const { file, lock } = storagePaths(root, workOrderId, headSha);
      if (next.workOrderId !== workOrderId || next.headSha !== headSha)
        throw new Error('DELTA_STORAGE_KEY_MISMATCH');
      return withLock(lock, async () => {
        const prior = await snapshot(file);
        if (!prior || prior.workOrderId !== workOrderId ||
            prior.headSha !== headSha || prior.ledgerDigest !== expectedDigest) return false;
        await writeDurable(root, file, next);
        return true;
      });
    },
  };
}
