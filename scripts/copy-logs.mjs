#!/usr/bin/env node
// 构建后把验证日志与 manifest 快照拷入 dist/logs，供 /verification 与特性页的 .txt 链接使用。
import fs from 'node:fs';
import path from 'node:path';

const REPO = process.cwd();
const src = path.join(REPO, 'verification/logs');
const outDir = path.join(REPO, 'dist/logs');

fs.mkdirSync(outDir, { recursive: true });
let n = 0;
for (const f of fs.readdirSync(src)) {
  if (f.endsWith('.log')) {
    fs.copyFileSync(path.join(src, f), path.join(outDir, f));
    n++;
  }
}
console.log(`copy-logs: ${n} 个日志已拷入 dist/logs`);
