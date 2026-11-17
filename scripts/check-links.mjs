#!/usr/bin/env node
// 站内链接检查：dist 内所有 HTML 引用的本站 URL 必须有对应文件（目录页需存在 index.html）。
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist');
const problems = [];
// 与 astro.config.mjs 的 base 保持一致：URL 前缀不对应 dist 下的物理目录
const BASE_PREFIX = '/swift-modern-guide';

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

if (!fs.existsSync(DIST)) {
  console.error('check-links: dist 不存在，请先 npm run build');
  process.exit(1);
}
const htmlFiles = walk(DIST).filter((p) => p.endsWith('.html'));

for (const hf of htmlFiles) {
  const rawHtml = fs.readFileSync(hf, 'utf8');
  // 排除 <script> 内部模板字符串中的 href（那是客户端运行时拼接的）
  const html = rawHtml.replace(/<script[\s\S]*?<\/script>/g, (m) => m.replace(/href=/g, 'data-href-skip='));
  const rel = path.relative(DIST, hf);
  for (const m of [...html.matchAll(/href="([^"]+)"/g)]) {
    const href = m[1];
    // protocol-relative 链接（//features/）会被浏览器解析为 http://features/，
    // 一律视为断链——这类缺陷曾让全站导航失效
    if (href.startsWith('//')) {
      problems.push(`${rel} → ${href}（protocol-relative 站内链接，浏览器会解析为外部主机）`);
      continue;
    }
    // base 后的连续斜杠（/swift-modern-guide//）依赖服务器 normalize 才能 200，
    // GitHub Pages 不保证该行为：一律视为断链
    if (href === `${BASE_PREFIX}//` || href.startsWith(`${BASE_PREFIX}//`)) {
      problems.push(`${rel} → ${href}（base 前缀后出现连续斜杠）`);
      continue;
    }
    if (/^(https?:|data:|mailto:|#)/.test(href)) continue;
    const [clean, hash] = href.split('#');
    if (!clean) continue;
    let target;
    let cleanPath = clean;
    if (cleanPath === BASE_PREFIX) clean = clean + '/';
    else if (cleanPath.startsWith(BASE_PREFIX + '/')) cleanPath = cleanPath.slice(BASE_PREFIX.length);
    if (cleanPath.startsWith('/')) target = path.join(DIST, cleanPath.slice(1));
    else target = path.join(path.dirname(hf), clean);
    // 目录链接 → index.html
    if (target.endsWith('/') || fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      target = path.join(target, 'index.html');
    }
    if (!fs.existsSync(target)) {
      problems.push(`${rel} → ${href}（目标不存在）`);
      continue;
    }
    if (hash) {
      const th = fs.readFileSync(target, 'utf8');
      if (!th.includes(`id="${hash}"`)) problems.push(`${rel} → ${href}（锚点 #${hash} 在目标中不存在）`);
    }
  }
  // 开发服务器地址不得出现在产物中
  if (/localhost|127\.0\.0\.1|4173|4321/.test(html)) problems.push(`${rel}: 产物中出现开发服务器地址`);
}

if (problems.length) {
  console.error(`check-links: ${problems.length} 个问题`);
  for (const p of problems.slice(0, 40)) console.error(' - ' + p);
  process.exit(1);
}
console.log(`check-links: OK（${htmlFiles.length} 个页面）`);
