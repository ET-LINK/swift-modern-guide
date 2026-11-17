#!/usr/bin/env node
// 极简静态文件服务器（无依赖），供本地预览与 Playwright 测试使用。
// 用法: node scripts/serve.mjs <root> <port>
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const root = path.resolve(process.argv[2] ?? 'dist');
const port = Number(process.argv[3] ?? 4173);
// 与 astro.config.mjs 的 base 保持一致：
// 构建产物在 dist 根，Pages/预览通过 URL 前缀 /swift-modern-guide/ 访问。
const BASE_PREFIX = '/swift-modern-guide';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.log': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url?.split('?')[0] ?? '/');
  if (urlPath.startsWith(BASE_PREFIX + '/')) urlPath = urlPath.slice(BASE_PREFIX.length);
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  let file = path.join(root, urlPath);
  if (!file.startsWith(root)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  let notFound = false;
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(root, '404.html');
    notFound = true;
  }
  if (!fs.existsSync(file)) {
    res.writeHead(404).end('not found');
    return;
  }
  const ext = path.extname(file).toLowerCase();
  res.writeHead(notFound ? 404 : 200, { 'Content-Type': types[ext] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`serving ${root} at http://127.0.0.1:${port}/`);
});
