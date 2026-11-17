#!/usr/bin/env node
// 静态产物资源预算：对每个 HTML 页面统计其引用的本站资源（递归 CSS 内引用），单页 ≤ 1.5MB。
// 与 astro.config 的 base 一致：产物内资产链接带 /swift-modern-guide 前缀，
// 但物理文件在 dist 根（Pages 把 dist 根映射到 /swift-modern-guide/），
// 所以解析 href 时必须先剥掉 base 前缀再映射文件，否则外链 CSS 永远统计不到（假绿）。
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const REPO = process.cwd();
const DIST = path.join(REPO, 'dist');
const LIMIT = 1.5 * 1024 * 1024;
const BASE_PREFIX = '/swift-modern-guide';
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

if (!fs.existsSync(DIST)) {
  console.error('check-budget: dist 不存在，请先 npm run build');
  process.exit(1);
}

// href（页面或 CSS 内的 url()）→ dist 下的物理文件；返回 null 表示非本站资源
function resolveRef(href, fromDir) {
  if (!href || /^(https?:|data:|mailto:|#)/.test(href)) return null;
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean.endsWith('/')) return null;
  if (!/\.(css|js|woff2?|png|jpe?g|webp|svg|json)$/i.test(clean)) return null;
  let target;
  if (clean.startsWith('//')) return 'INVALID_PROTOCOL_RELATIVE';
  let cleanPath = clean;
  if (cleanPath === BASE_PREFIX) return null; // base 根，不是资源
  if (cleanPath.startsWith(`${BASE_PREFIX}/`)) cleanPath = cleanPath.slice(BASE_PREFIX.length);
  if (cleanPath.startsWith('/')) {
    target = path.join(DIST, cleanPath.slice(1));
  } else {
    target = path.join(fromDir, cleanPath);
  }
  target = path.normalize(target);
  if (!target.startsWith(DIST)) return null; // 越界（相对路径跳出 dist）
  if (!fs.existsSync(target)) return null;
  return target;
}

const htmlFiles = walk(DIST).filter((p) => p.endsWith('.html'));
for (const hf of htmlFiles) {
  const html = fs.readFileSync(hf, 'utf8');
  const found = new Set();

  const collect = (href) => {
    const t = resolveRef(href, path.dirname(hf));
    if (typeof t === 'string' && t === 'INVALID_PROTOCOL_RELATIVE') {
      problems.push(`${path.relative(DIST, hf)}: 出现 protocol-relative 资源链接 ${href}`);
      return;
    }
    if (t) found.add(t);
  };
  for (const m of [...html.matchAll(/<link[^>]+href="([^"]+)"/g)]) collect(m[1]);
  for (const m of [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]) collect(m[1]);
  for (const m of [...html.matchAll(/<img[^>]+src="([^"]+)"/g)]) collect(m[1]);
  for (const m of [...html.matchAll(/url\((['"]?)([^'")]+)\1\)/g)]) collect(m[2]);

  // 递归追 CSS 里的 url()（本站文件）
  const queue = [...found];
  const seen = new Set();
  while (queue.length) {
    const p = queue.pop();
    if (seen.has(p)) continue;
    seen.add(p);
    if (p.endsWith('.css')) {
      const css = fs.readFileSync(p, 'utf8');
      for (const m of [...css.matchAll(/url\((['"]?)([^'")]+)\1\)/g)]) {
        const t = resolveRef(m[2], path.dirname(p));
        if (t) {
          found.add(t);
          queue.push(t);
        }
      }
    }
  }

  let total = fs.statSync(hf).size;
  for (const ref of found) total += fs.statSync(ref).size;
  const page = path.relative(DIST, hf);
  const gz = gzipSync(fs.readFileSync(hf)).length;
  sizes.push({ page, total, gz, refs: found.size });
  if (total > LIMIT) problems.push(`${page}: ${(total / 1024).toFixed(1)}KB 超过 1.5MB 预算`);
}

sizes.sort((a, b) => b.total - a.total);
console.log('check-budget: 每 HTML 页引用本站资源合计（含页面自身，已解析 base 前缀）：');
for (const s of sizes.slice(0, 8)) {
  console.log(`  ${s.page.padEnd(52)} ${(s.total / 1024).toFixed(1).padStart(8)} KB  gzip(html) ${(s.gz / 1024).toFixed(1)}KB  refs=${s.refs}`);
}
const maxS = sizes[0];
console.log(`check-budget: 最大页 ${(maxS?.total / 1024).toFixed(1)}KB / 预算 1536KB`);

if (problems.length) {
  console.error('check-budget: FAIL');
  for (const p of problems) console.error(' - ' + p);
  process.exit(1);
}
console.log('check-budget: OK');
