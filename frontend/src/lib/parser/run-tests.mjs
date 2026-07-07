// Run TypeScript test file via esbuild on the fly
import { build } from 'esbuild';
import { writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const inputFile = './orderParser.test.ts';
const tmpFile = join(tmpdir(), 'orderParser-test-' + Date.now() + '.mjs');

await build({
  entryPoints: [inputFile],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: tmpFile,
  external: [],
});

// Execute
const url = 'file://' + tmpFile;
await import(url);
