import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const retired = ['hi', 've'].join('');
const forbidden = [new RegExp(`(^|[^A-Za-z0-9])${retired}([^A-Za-z0-9]|$)`, 'i'), new RegExp(`${retired}Adapter`, 'i'), /m34-m40/i];
const activeFiles = [
  'README.md',
  '.engineering/ARCHITECTURE.md',
  '.engineering/BACKLOG.md',
  '.engineering/DEFINITION-OF-DONE.md',
  '.engineering/DEPLOYMENT.md',
  '.engineering/PROJECT-OVERVIEW.md',
  '.engineering/REQUIREMENTS.md',
  '.engineering/SCOPE.md',
  'planning/MASTER-MODULE-INDEX.md',
  'docs/INSTALLATION.md',
  'docs/QUICKSTART.md',
];
function filesUnder(root) {
  if (!statSync(root).isDirectory()) return [root];
  return readdirSync(root, { withFileTypes: true }).flatMap(entry =>
    ['node_modules', 'dist', 'coverage', '.tsbuildinfo'].includes(entry.name) ? [] : filesUnder(join(root, entry.name))
  );
}
test('retired adapter is absent from active runtime, automation and current operator contracts', () => {
  for (const filename of [...filesUnder('packages'), ...filesUnder('.github'), ...activeFiles]) {
    if (!statSync(filename).isFile()) continue;
    const content = readFileSync(filename, 'utf8');
    for (const marker of forbidden) assert.equal(marker.test(content), false, `${filename}: retired integration marker ${marker}`);
  }
});
