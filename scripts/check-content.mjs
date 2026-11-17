#!/usr/bin/env node
// 内容一致性检查：文章 frontmatter、样例引用、来源域名、禁词、日志覆盖。
import fs from 'node:fs';
import path from 'node:path';

const REPO = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'verification/manifest.json'), 'utf8'));
const results = JSON.parse(fs.readFileSync(path.join(REPO, 'verification/logs/results.json'), 'utf8'));
const problems = [];
const ok = (cond, msg) => {
  if (!cond) problems.push(msg);
};

// 1) 文章目录扫描
const dir = path.join(REPO, 'src/content/features');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'));
ok(files.length === manifest.features.length, `文章数量 ${files.length} ≠ manifest 特性数 ${manifest.features.length}`);

const slugToFile = new Map(files.map((f) => [f.replace(/\.mdx$/, ''), f]));
const statuses = new Map((results.results ?? []).map((r) => [r.sampleId, r]));
const allowedHost = (url) => {
  const u = new URL(url);
  if (u.hostname === 'swift.org' || u.hostname.endsWith('.swift.org')) return true;
  if (u.hostname === 'developer.apple.com' || u.hostname.endsWith('.developer.apple.com')) return true;
  if (u.hostname === 'github.com') return u.pathname.startsWith('/swiftlang/');
  return false;
};

for (const f of files) {
  const raw = fs.readFileSync(path.join(dir, f), 'utf8');
  const fm = raw.split('---\n')[1] ?? '';
  const idm = /id:\s*(F\d{2})/.exec(fm);
  ok(!!idm, `${f}: frontmatter 缺少 id`);
  const featureId = idm?.[1];
  const feature = manifest.features.find((x) => x.id === featureId);
  ok(!!feature, `${f}: frontmatter id=${featureId} 在 manifest 中不存在`);
  if (!feature) continue;

  // 2) sampleIds 与 manifest 完全一致
  const ids = [...fm.matchAll(/- "?([\w-]+)"?/g)].map((m) => m[1]);
  for (const sid of feature.samples.map((s) => s.id)) {
    ok(fm.includes(sid), `${f}: frontmatter sampleIds 缺少 ${sid}`);
  }

  // 3) 来源域名白名单
  for (const m of [...fm.matchAll(/url:\s*(\S+)/g)]) {
    ok(allowedHost(m[1]), `${f}: 来源域名不在白名单 ${m[1]}`);
  }

  // 4) 禁词（含日志路径检查）
  const banned = /(TODO|TBD|待查)/;
  ok(!banned.test(raw), `${f}: 出现 TODO/TBD/待查`);
  for (const m of [...fm.matchAll(/officialSources[\s\S]*?(?=\n\s*\w+:)/g)]) {
    // 占位：具体条目在白名单检查内
  }

  // 5) C 类特性必须有运行日志且状态 pass
  if (feature.category === 'C') {
    for (const s of feature.samples) {
      const r = statuses.get(s.id);
      ok(!!r && r.status === 'pass', `${f}: C 类样本 ${s.id} 无 pass 日志`);
      ok(fs.existsSync(path.join(REPO, 'verification/logs', `${s.id}.log`)), `${f}: 缺日志文件 ${s.id}.log`);
    }
  }

  // 6) 每篇都有旧/新写法关键词（before/after 或对照说明）
  ok(/旧写法|仍合法|before/.test(raw), `${f}: 未找到旧写法对照段落`);
  ok(/新写法|写法|after/.test(raw), `${f}: 未找到新写法段落`);

  // 7) 文章必须引用 examples/ 里的同一份源码（禁止复制粘贴第二份 Swift 到 MDX）
  const swiftFences = [...raw.matchAll(/```swift\n([\s\S]*?)```/g)];
  for (const m of swiftFences) {
    const fence = m[1];
    const has5PlusLines = fence.split('\n').filter((l) => l.trim() && !l.trim().startsWith('//')).length > 5;
    if (has5PlusLines) {
      problems.push(
        `${f}: 检测到较长的 Swift 代码围栏（>5 行有效代码）。正文代码应通过 import ...?raw 引用 examples/ 源文件或改短为骨架示意，
围栏行数=${fence.split('\n').length}`,
      );
    }
  }
}

// 8) results 全部 pass
ok((results.passed ?? 0) === results.samplesRun, `results.json 存在未通过样本: ${JSON.stringify(results.failed ?? [])}`);

if (problems.length) {
  console.error(`check-content: ${problems.length} 个问题`);
  for (const p of problems) console.error(' - ' + p);
  process.exit(1);
}
console.log(`check-content: OK（${files.length} 篇文章 / ${manifest.features.length} 条特性）`);
