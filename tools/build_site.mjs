// Publish only the website and prepared public data, never local workbooks or Git files.
import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const files = ['index.html', 'main.css', 'load_data.js', 'line_chart.js', 'horizontal_bar_chart.js', 'main.js'];
for (const file of [...files, 'data', 'vendor']) await cp(path.join(root, file), path.join(output, file), { recursive: true });
console.log('Static website built in dist/');
