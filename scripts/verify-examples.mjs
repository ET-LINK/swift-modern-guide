#!/usr/bin/env node
// verification/manifest.json 驱动的示例验证运行器。
// 每条样本真实执行 Swift 工具链命令，落盘原始日志并校验退出码/诊断/期望输出。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MANIFEST_PATH = path.join(REPO, 'verification', 'manifest.json');
const LOG_DIR = path.join(REPO, 'verification', 'logs');

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const argOnly = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const listOnly = process.argv.includes('--list');

const toolchainCache = new Map();

function resolveToolchain(tcId) {
  const tc = manifest.toolchains.find((t) => t.id === tcId);
  if (!tc) throw new Error(`unknown toolchain ${tcId}`);
  const dir = path.join(REPO, tc.dir);
  if (tc.expectVersion) {
    const swift = path.join(dir, 'usr', 'bin', 'swift');
    const r = spawnSync(swift, ['--version'], { encoding: 'utf8' });
    const out = (r.stdout || '') + (r.stderr || '');
    if (!out.trim().startsWith(`Swift version ${tc.expectVersion.replace('Swift ', '')}`)) {
      throw new Error(`toolchain ${tcId} version mismatch: ${out.trim().split('\n')[0]}`);
    }
    if (!toolchainCache.has(tcId)) {
      toolchainCache.set(tcId, { bin: path.join(dir, 'usr', 'bin'), version: out.trim() });
    }
  } else {
    toolchainCache.set(tcId, { bin: path.join(dir, 'usr', 'bin'), version: '' });
  }
  return toolchainCache.get(tcId);
}

const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

function normalize(text) {
  return text.replace(/\r\n/g, '\n');
}
function tmpRoot() { return os.tmpdir(); }

function buildSteps(sample, feature) {
  const tcId = sample.toolchainId ?? feature.toolchain;
  const tc = resolveToolchain(tcId);
  const swiftc = path.join(tc.bin, 'swiftc');
  const swift = path.join(tc.bin, 'swift');
  const swiftFormat = path.join(tc.bin, 'swift-format');
  const extra = sample.extraArgs ?? [];
  const steps = [];
  const fileAbs = (sample.files ?? []).map((f) => path.join(REPO, f.path));
  const caseBin = path.join(tmpRoot(), `smg-${sample.id}-${process.pid}`);

  switch (sample.mode) {
    case 'typecheck':
      steps.push({ argv: [swiftc, '-typecheck', ...extra, ...fileAbs] });
      break;
    case 'typecheck5':
      steps.push({ argv: [swiftc, '-typecheck', '-swift-version', '5', ...extra, ...fileAbs] });
      break;
    case 'typecheck6':
      steps.push({ argv: [swiftc, '-typecheck', '-swift-version', '6', ...extra, ...fileAbs] });
      break;
    case 'compile6':
      steps.push({
        argv: [swiftc, '-swift-version', '6', ...extra, ...fileAbs, '-o', caseBin],
      });
      break;
    case 'run-swift':
      steps.push({ argv: [swift, ...extra, ...fileAbs], appStep: true });
      break;
    case 'compile-run6':
      steps.push({
        argv: [swiftc, '-swift-version', '6', ...extra, ...fileAbs, '-o', caseBin],
        label: 'compile',
      });
      steps.push({ argv: [caseBin], label: 'run', appStep: true });
      break;
    case 'embedded-run':
      steps.push({
        argv: [swiftc, '-swift-version', '6', '-enable-experimental-feature', 'Embedded', '-wmo', ...extra, ...fileAbs, '-o', caseBin],
        label: 'compile',
      });
      steps.push({ argv: [caseBin], label: 'run', appStep: true });
      break;
    case 'emit-module': {
      const out = path.join(REPO, sample.outputPath);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      steps.push({ argv: [swiftc, '-typecheck', '-module-name', sample.moduleName, '-emit-module', '-o', out, ...extra, ...fileAbs] });
      break;
    }
    case 'emit-clang-header': {
      const out = path.join(REPO, sample.outputPath);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      steps.push({ argv: [swiftc, '-typecheck', '-emit-clang-header-path', out, ...extra, ...fileAbs] });
      break;
    }
    case 'package-build': {
      const cwd = path.join(REPO, sample.package.dir);
      steps.push({ argv: [swift, 'build'], cwd });
      break;
    }
    case 'package-build-tests': {
      const cwd = path.join(REPO, sample.package.dir);
      steps.push({ argv: [swift, 'build', '--build-tests'], cwd });
      break;
    }
    case 'package-build-run': {
      const cwd = path.join(REPO, sample.package.dir);
      const scratch = sample.package.scratch
        ? ['--scratch-path', path.join(tmpRoot(), `smg-scratch-${sample.id}-${process.pid}`)]
        : [];
      const runArgs = sample.package.args ?? [];
      steps.push({
        argv: [swift, 'run', ...scratch, ...runArgs, sample.package.executable],
        cwd,
        appStep: true,
        label: 'run',
      });
      break;
    }
    case 'package-test': {
      const cwd = path.join(REPO, sample.package.dir);
      steps.push({ argv: [swift, 'test', ...(sample.package?.args ?? [])], cwd });
      break;
    }
    case 'package-test-attachments': {
      const cwd = path.join(REPO, sample.package.dir);
      const attachDir = fs.mkdtempSync(path.join(tmpRoot(), `smg-attach-`));
      steps.push({
        argv: [swift, 'test', ...(sample.package?.args ?? []), '--attachments-path', attachDir],
        cwd,
        appStep: true,
        attachmentsDir: attachDir,
      });
      break;
    }
    case 'docc-generate': {
      const cwd = path.join(REPO, sample.package.dir);
      steps.push({
        argv: [swift, 'package', 'generate-documentation', '--target', sample.package.target],
        cwd,
      });
      break;
    }
    case 'format': {
      const target = path.join(REPO, sample.files[0].path);
      steps.push({ argv: [swiftFormat, 'format', target], appStep: true });
      break;
    }
    case 'format-dump':
      steps.push({ argv: [swiftFormat, 'dump-configuration', '--effective'] });
      break;
    default:
      throw new Error(`unknown mode ${sample.mode}`);
  }
  return steps;
}

const fmtDate = () => new Date().toISOString();

function verifySample(sample, feature) {
  const tcId = sample.toolchainId ?? feature.toolchain;
  const tc = resolveToolchain(tcId);
  const steps = buildSteps(sample, feature);
  const record = {
    sampleId: sample.id,
    featureId: feature.id,
    kind: sample.kind,
    mode: sample.mode,
    toolchainId: tcId,
    expect: sample.expect,
    started: fmtDate(),
    steps: [],
    files: (sample.files ?? []).map((f) => ({
      path: f.path,
      sha256: sha256(path.join(REPO, f.path)),
    })),
  };
  let stdoutAll = '';
  let stderrAll = '';
  let appStdout = '';
  let lastExit = 0;
  const origFileContent = (sample.files ?? []).length ? fs.readFileSync(path.join(REPO, sample.files[0].path), 'utf8') : '';

  for (const step of steps) {
    const started = fmtDate();
    const r = spawnSync(step.argv[0], step.argv.slice(1), {
      encoding: 'utf8',
      cwd: step.cwd ?? REPO,
      maxBuffer: 64 * 1024 * 1024,
    });
    const ended = fmtDate();
    const stepInfo = {
      argv: step.argv,
      cwd: step.cwd ?? REPO,
      started,
      ended,
      stdout: r.stdout ?? '',
      stderr: r.stderr ?? '',
      exit: r.status,
      spawnError: r.error ? String(r.error) : null,
      attachmentsDir: step.attachmentsDir ?? null,
    };
    record.steps.push(stepInfo);
    stdoutAll += r.stdout ?? '';
    stderrAll += r.stderr ?? '';
    if (r.error) lastExit = -1;
    else if (r.status !== null && r.status !== undefined) lastExit = r.status;
    if (step.appStep) appStdout += r.stdout ?? '';
    if (r.status !== 0 && r.error === undefined && r.status !== null) {
      // 负例之外的失败也要记录完整过程，是否通过交给断言阶段
    }
    if (r.error) break;
  }
  record.finished = fmtDate();
  record.exit = lastExit;
  record.appStdout = appStdout;

  // ---- 断言 ----
  const problems = [];
  const ok = (cond, what) => { if (!cond) problems.push(what); };
  const cleaned = normalize((stderrAll));
  if (sample.expect === 'pass') {
    ok(lastExit === 0, `预期退出码 0，实际 ${lastExit}`);
  } else if (sample.expect === 'fail-with-diagnostic') {
    ok(lastExit !== 0, `预期非零退出码，实际 0`);
    ok(normalize(stderrAll + stdoutAll).includes(sample.diagnosticSubstring), `未匹配到诊断子串 “${sample.diagnosticSubstring}”`);
  }
  if (sample.diagnosticSubstring && sample.expect === 'pass') {
    // pass 样本不应出现该诊断子串，防止假阳性
    ok(!normalize(stderrAll).includes(sample.diagnosticSubstring), `pass 样本意外出现 “${sample.diagnosticSubstring}”`);
  }
  if (sample.stdoutGolden) {
    const actual = normalize(appStdout)
      .split('\n')
      .filter((l, idx, arr) => !(l === '' && idx === arr.length - 1));
    while (actual.length && actual[actual.length - 1] === '') actual.pop();
    const expected = sample.stdoutGolden.join('\n');
    ok(actual.join('\n') === expected, `stdout golden 不匹配：\n--- 期望 ---\n${expected}\n--- 实际 ---\n${actual.join('\n')}`);
  }
  for (const s of sample.stdoutSubstrings ?? []) {
    ok(normalize(stdoutAll).includes(s), `stdout 缺少子串 “${s}”`);
  }
  for (const s of sample.stderrSubstrings ?? []) {
    ok(normalize(stderrAll).includes(s), `stderr 缺少子串 “${s}”`);
  }
  if (sample.formatDiff) {
    const formatted = normalize(appStdout);
    ok(formatted !== normalize(origFileContent), '格式化输出应与原文件不同');
  }
  if (sample.artifactSubstrings) {
    const art = path.join(REPO, sample.outputPath);
    ok(fs.existsSync(art), `产物文件不存在：${sample.outputPath}`);
    if (fs.existsSync(art)) {
      const content = normalize(fs.readFileSync(art, 'utf8'));
      for (const s of sample.artifactSubstrings) {
        ok(content.includes(s), `产物缺少子串 “${s}”`);
      }
    }
  }
  if (sample.attachmentAssert) {
    const step = record.steps.find((s) => s.argv.includes('--attachments-path'));
    const dir = step?.attachmentsDir;
    if (!dir) problems.push('缺少 --attachments-path 步骤');
    else {
      record.attachmentsDir = dir;
      const files = fs.readdirSync(dir);
      const expectedName = sample.attachmentAssert.file;
      ok(files.includes(expectedName), `attachments 目录缺少 ${expectedName}（现有：${files.join(', ')}）`);
      if (files.includes(expectedName)) {
        const c = fs.readFileSync(path.join(dir, expectedName), 'utf8');
        ok(c.includes(sample.attachmentAssert.content), `attachment 内容应为 “${sample.attachmentAssert.content}”，实际 “${c.trim()}”`);
        record.savedAttachment = { file: expectedName, content: c };
      }
    }
  }
  record.problems = problems;
  record.status = problems.length === 0 ? 'pass' : 'fail';
  return record;
}

// ---- 日志落盘 ----
function renderLog(record, sample) {
  const lines = [];
  const t = toolchainCache.get(record.toolchainId);
  lines.push(`# sample: ${record.sampleId}`);
  lines.push(`# feature: ${record.featureId} (${manifest.features.find((f) => f.id === record.featureId).title})`);
  lines.push(`# kind: ${record.kind} | mode: ${record.mode} | toolchain: ${record.toolchainId}`);
  lines.push(`# started: ${record.started} finished: ${record.finished}`);
  if (t?.version) lines.push(`# swift --version: ${t.version.replace(/\n/g, ' | ')}`);
  for (const f of record.files) lines.push(`# input: ${f.path} sha256=${f.sha256}`);
  lines.push('# expectations:');
  lines.push(`#   expect: ${record.expect}${sample.diagnosticSubstring ? ` (diagnosticSubstring: ${JSON.stringify(sample.diagnosticSubstring)})` : ''}`);
  lines.push('# ----');
  let n = 0;
  for (const step of record.steps) {
    n += 1;
    lines.push(`$ ${step.argv.map((a) => (/[\s"']/.test(a) ? JSON.stringify(a) : a)).join(' ')}`);
    lines.push(`# step ${n} | cwd: ${step.cwd} | exit: ${step.exit}${step.spawnError ? ` | spawnError: ${step.spawnError}` : ''}`);
    const so = step.stdout ?? '';
    const se = step.stderr ?? '';
    lines.push('--- stdout ---');
    lines.push(so.length ? so : '(空)');
    lines.push('--- stderr ---');
    lines.push(se.length ? se : '(空)');
    lines.push('--- end ---');
  }
  lines.push(`exit: ${record.exit}`);
  lines.push(`result: ${record.status.toUpperCase()}`);
  if (record.problems.length) {
    lines.push('problems:');
    for (const p of record.problems) lines.push(`  - ${p}`);
  }
  return lines.join('\n') + '\n';
}

// ---- main ----
if (listOnly) {
  for (const f of manifest.features) {
    for (const s of f.samples) console.log(`${f.id}\t${s.id}\t${s.mode}\t${f.toolchain}`);
  }
  process.exit(0);
}

const wantedFeatures = argOnly === 'pilot' ? manifest.pilotFeatures : argOnly ? argOnly.split(',').map((s) => s.trim()) : null;
const isPartial = !!wantedFeatures;
const resultsPath = path.join(LOG_DIR, 'results.json');

// 全量运行覆盖 results.json；部分运行（--only pilot / --only F01）合并进已有结果：
// 样本条目、toolchains、lastFullRunAt（最近一次全量的时间）都保留全量状态——
// 不允许 partial run 破坏已提交的验证状态（否则 /verification 页会出现「swift-6.3.3（?）」这类降级）。
const results = [];
let prevToolchains = {};
let lastFullRunAt = null;
if (isPartial && fs.existsSync(resultsPath)) {
  try {
    const prev = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    results.push(...(prev.results ?? []));
    prevToolchains = prev.toolchains ?? {};
    lastFullRunAt = prev.lastFullRunAt ?? (prev.partialRun ? null : prev.finishedAt ?? null);
  } catch {
    /* 旧的 results.json 损坏时按空集处理 */
  }
}
if (!isPartial) fs.rmSync(resultsPath, { force: true });
const targetFeatures = manifest.features.filter((f) => !wantedFeatures || wantedFeatures.includes(f.id));
const ranIds = targetFeatures.flatMap((f) => f.samples.map((s) => s.id));
for (let i = results.length - 1; i >= 0; i--) {
  if (ranIds.includes(results[i].sampleId)) results.splice(i, 1);
}
for (const feature of targetFeatures) {
  for (const sample of feature.samples) {
    process.stdout.write(`▶ ${feature.id} ${sample.id} (${sample.mode}) ... `);
    const record = verifySample(sample, feature);
    results.push({
      sampleId: record.sampleId,
      featureId: record.featureId,
      kind: record.kind,
      mode: record.mode,
      toolchainId: record.toolchainId,
      expect: record.expect,
      exit: record.exit,
      status: record.status,
      problems: record.problems,
    });
    fs.writeFileSync(path.join(LOG_DIR, `${sample.id}.log`), renderLog(record, sample));
    console.log(record.status === 'pass' ? 'PASS' : `FAIL (${record.problems.join('; ')})`);
  }
}
const summary = {
  finishedAt: fmtDate(),
  // 最近一次全量运行的时间：partial run 不更新此字段；全量运行时与 finishedAt 相同
  lastFullRunAt: isPartial ? lastFullRunAt : undefined,
  partialRun: isPartial ? (wantedFeatures ?? []) : false,
  // toolchains 合并：本次实际解析的工具链覆盖同名项，其余保留 partial 前的记录
  toolchains: {
    ...prevToolchains,
    ...Object.fromEntries([...toolchainCache.entries()].map(([k, v]) => [k, { bin: v.bin, version: v.version.split('\n')[0] }])),
  },
  samplesRun: results.length,
  passed: results.filter((r) => r.status === 'pass').length,
  failed: results.filter((r) => r.status !== 'pass').map((r) => ({ sampleId: r.sampleId, problems: r.problems })),
  results: results,
};
// 全量运行时显式写 lastFullRunAt（避免 undefined 序列化歧义）
if (!isPartial) summary.lastFullRunAt = summary.finishedAt;
fs.writeFileSync(path.join(LOG_DIR, 'results.json'), JSON.stringify(summary, null, 2));

const ranRecords = targetFeatures.flatMap((f) => /* 本次真实执行的样本 */ f.samples.map(() => null)).length
  ? results.filter((r) => ranIds.includes(r.sampleId))
  : [];
if (isPartial) {
  console.log(
    `\n=== 本次运行 ${ranRecords.filter((r) => r.status === 'pass').length}/${ranRecords.length} pass；` +
      `合并后 results.json 共 ${results.length} 条、${results.filter((r) => r.status === 'pass').length} pass（--only 保留未触碰样本） ===`,
  );
} else {
  console.log(`\n=== ${results.filter((r) => r.status === 'pass').length}/${results.length} PASS ===`);
}
if (results.some((r) => r.status !== 'pass')) process.exit(1);
