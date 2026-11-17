#!/usr/bin/env node
// 静态产物资源预算：对每个 HTML 页面统计其引用的本站资源（递归 CSS），单页 ≤ 1.5MB。
// 再报 gzip 体积供参考。搜索索引/日志不进首屏（按需 fetch / 点击打开），不计入。
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const REPO = process.cwd();
const DIST = path.join(REPO, 'dist');
const LIMIT = 1.5 * 1024 * 1024;
const problems = [];
const sizes = [];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function refsOf(htmlPath, baseDir) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const out = new Set();
  const add = (href) => {
    if (!href || href.startsWith('http') || href.startsWith('data:') || href.startsWith('#')) return;
    const clean = href.split('#')[0].split('?')[0];
    if (!clean) return;
    const isAssetLike = /\.(css|js|woff2?|png|jpe?g|webp|svg|json)$/i.test(clean) || /_astro\/.*\.(css|js)$/.test(clean);
    if (!isAssetLike) return; // 站内页面链接不算“本页加载资源”
    const p = path.join(baseDir, clean.replace(/^\//, ''));
    if (fs.existsSync(p)) out.add(p);
  };
  for (const m of [...html.matchAll(/<link[^>]+href="([^"]+)"/g)]) add(m[1]);
  for (const m of [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]) add(m[1]);
  for (const m of [...html.matchAll(/<img[^>]+src="([^"]+)"/g)]) add(m[1]);
  for (const m of [...html.matchAll(/url\((['"]?)([^'")]+)\1\)/g)]) add(m[2]);
  return out;
}

if (!fs.existsSync(DIST)) {
  console.error('check-budget: dist 不存在，请先 npm run build');
  process.exit(1);
}

const htmlFiles = walk(DIST).filter((p) => p.endsWith('.html'));
for (const hf of htmlFiles) {
  const baseDir = DIST;
  // 相对路径引用按 HTML 所在目录解析再折回
  const html = fs.readFileSync(hf, 'utf8');
  const refs = new Set();
  const add = (href) => {
    if (!href || /^(https?:|data:|#|mailto:)/.test(href)) return;
    const clean = href.split('#')[0].split('?')[0];
    if (!clean || clean.endsWith('/')) return;
    if (!/\.(css|js|woff2?|png|jpe?g|webp|svg|json)$/i.test(clean)) return;
    let p;
    if (clean.startsWith('/')) p = path.join(DIST, clean.slice(1));
    else {
      const rel = path.relative(DIST, path.dirname(hf));
      p = path.join(DIST, rel, clean);
    }
    if (fs.existsSync(p)) refs.add(p);
  };
  for (const m of [...html.matchAll(/<link[^>]+href="([^"]+)"/g)]) add(m[1]);
  for (const m of [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]) add(m[1]);
  for (const m of [...html.matchAll(/<img[^>]+src="([^"]+)"/g)]) add(m[1]);
  for (const m of [...html.matchAll(/url\((['"]?)([^'")]+)\1\)/g)]) add(m[2]);

  // 递归追 CSS 里的 url()（本站文件）
  const queue = [...refs];
  const seen = new Set();
  while (queue.length) {
    const p = queue.pop();
    if (seen.has(p)) continue;
    seen.add(p);
    if (p.endsWith('.css')) {
      const css = fs.readFileSync(p, 'utf8');
      const cssDir = path.dirname(p);
      for (const m of [...css.matchAll(/url\((['"]?)([^'")]+)\1\)/g)]) {
        const href = m[2];
        if (/^(https?:|data:)/.test(href)) continue;
        const target = href.startsWith('/') ? path.join(DIST, href.slice(1)) : path.join(cssDir, href);
        if (fs.existsSync(target)) {
          refs.add(target);
          queue.push(target);
        }
      }
    }
  }

  let total = fs.statSync(hf).size;
  for (const ref of refs) total += fs.statSync(ref).size;
  const page = path.relative(DIST, hf);
  const gz = gzipSync(fs.readFileSync(hf)).length;
  sizes.push({ page, total, gz, refs: refs.size });
  if (total > LIMIT) problems.push(`${page}: ${(total / 1024).toFixed(1)}KB 超过 1.5MB 预算`);
}

sizes.sort((a, b) => b.total - a.total);
console.log('check-budget: 每 HTML 页引用本站资源合计（含页面自身）：');
for (const s of sizes.slice(0, 8)) {
  console.log(`  ${s.page.padEnd(52)} ${(s.total / 1024).toFixed(1).padStart(8)} KB  gzip(html) ${(s.gz / 1024).toFixed(1)}KB  refs=${s.refs}`);
}
const maxS = sizes[0];
console.log(`check-budget: 最大页 ${(maxS.total / 1024).toFixed(1)}KB / 预算 1536KB`);

if (problems.length) {
  console.error('check-budget: FAIL');
  for (const p of problems) console.error(' - ' + p);
  process.exit(1);
}
console.log('check-budget: OK');
