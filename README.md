# Swift 6.x 现代语言特性学习站

中文的 Swift 6.x（6.0 → 6.4）语言特性学习站。**每一条示例都由本机真实编译/运行验证**，
验证日志全文入库，站点构建时直接读日志渲染——页面上的输出没有一处是手写的。

- 覆盖：33 条特性（F01–F33），按时间线 + 主题双导航，支持版本筛选与搜索。
- 工具链：Swift **6.2**（6.0–6.2 特性）/ **6.3.3**（6.3）/ **6.4.2**（6.4），Ubuntu 24.04 x86_64。
- 验证类别：A（typecheck）/ B（Swift 6 mode typecheck）/ C（真实运行并记录输出）。负例必须「非零退出码 + 指定诊断子串」。

## 目录结构

```text
src/content/features/*.mdx      # 33 篇特性文章（正文引用 examples/ 源码，不复制第二份）
examples/<feature>/             # 每条特性的 before/after/broken 源码与 fixture
verification/manifest.json      # 验证清单（工具链、模式、期望、断言）
verification/logs/*.log         # 逐样本原始日志（argv、stdout/stderr、退出码、SHA256）
scripts/verify-examples.mjs     # manifest 驱动的验证运行器（verify:samples）
scripts/check-*.mjs             # 内容一致性 / 资源预算 / 站内链接检查
scripts/serve.mjs               # 无依赖静态服务器（预览 & Playwright）
tests/e2e.spec.ts               # 浏览器自测（390px、深色、搜索、复制、无外部请求）
.github/workflows/pages.yml     # 发布流水线（验证→构建→测试→部署）
```

## 快速开始

Node 要求：**>= 22.23.4**（Astro 7 的硬性下限）。本仓库验证机使用
`node v22.23.5`（可作为 tarball 解压到 `.toolchains/node`，与 Swift 工具链一样不进 git）。

```bash
npm install
bash scripts/fetch-toolchains.sh   # 下载并解压三套官方工具链到 .toolchains/（gitignore）
npm run verify:samples             # 73 个样本全量验证（任何断言失败即非零退出）
npm run verify:pilot               # 只跑 10 条试点特性（F01/F02/F03/F05/F07/F10/F20/F21/F29/F31）
                                    # --only 属「部分运行」：样本条目合并写入 results.json（未触碰样本保留），
                                    # toolchains 与 lastFullRunAt（最近一次全量的时间）同样保留、不刷新；
                                    # 验证总表会显式标注 partialRun。交付口径仍要求一次全量运行全绿。
npm run build                      # 构建静态站（含把验证日志拷入 dist/logs）
npm run preview                    # 本地起 dist（http://127.0.0.1:4173）
npm run test:e2e                   # Playwright 浏览器自测
npm run check:content              # 文章/manifest/日志一致性
npm run check:links                # 站内链接 + 产物无开发地址
npm run check:budget               # 单页引用本站资源 ≤ 1.5MB
```

一键全验：

```bash
npm run verify:all
```

## 验证体系说明

- `verification/manifest.json` 只提交**仓库相对路径**（`.toolchains/...`）；
  运行器在执行时解析成绝对路径并写入日志。日志里的 `/home/...` 是验证机路径，属预期。
- 每个样本记录：输入文件 SHA256、完整 argv、工作目录、stdout/stderr、退出码、起止时间。
- **负例（fail-with-diagnostic）**要求退出码非零 **且** stderr 匹配指定诊断子串；
  「编译失败」本身不算证据。锁定版本边界的负例（如 `@c` 在 6.2）用旧工具链直接实证。
- 部分诊断只出现在**完整编译**（SIL 阶段），对应样本的 mode 是 `compile6` 而非 typecheck——
  manifest 中如实标注（F03/F05/F06）。Swift 4.4.2 差异点参阅各样本 `notes` 字段。
- SwiftPM / swift test / DocC / swift-format 的日志包含耗时与并行顺序：对这些采用**结构化断言**
  （退出码 + 指定子串）；应用自身输出仍为精确 golden 对比。

## 站点口径

- 响应式（390px 实测无横向溢出）、深/浅色主题（偏好只存 localStorage）、构建期 Shiki 代码高亮、可复制、版本筛选、TOC 与搜索（本地索引 substring 匹配）。
- 零第三方脚本/字体/CDN；禁用 JS 时正文与验证内容完全可读。
- 首屏单页引用本站资源 ≤ 1.5MB（`npm run check:budget` 强制）。
- 页脚按版本分列验证声明，核验日期 2026-11-17。

## 已知不足

- 搜索不支持拼音/同义词/全文检索（本地索引 substring）。
- 只验证 Ubuntu host；Xcode/ObjC、iOS ABI、真实 MCU 均未验证（F08/F09/F16 有明确边界说明）。
- F16 的 DocC 生成依赖官方 swift-docc-plugin（首次构建需联网拉取）。
- Apple 平台部署可用性不由本站背书（InlineArray/Span/Mutex 等请查目标 OS 文档）。

## License

MIT — Copyright (c) 2026 ET-LINK
