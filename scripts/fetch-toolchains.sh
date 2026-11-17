#!/usr/bin/env bash
# 独立复现脚本：下载三套官方工具链并解压到 .toolchains/（gitignore，不进 git 历史）。
# 平台：Ubuntu 24.04 x86_64。其他平台请参考 https://www.swift.org/install/linux/ 。
set -euo pipefail
cd "$(dirname "$0")/.."

fetch() {
  local ver="$1" url="$2"
  local dir=".toolchains/${ver}"
  if [ -x "${dir}/usr/bin/swift" ]; then
    echo "[skip] ${ver} 已存在"
    return
  fi
  echo "[download] ${ver}"
  mkdir -p "${dir}"
  curl --fail --location --retry 5 -C - "$url" --output ".toolchains/${ver}.tar.gz"
  echo "[extract] ${ver}"
  tar -xzf ".toolchains/${ver}.tar.gz" -C "${dir}" --strip-components=1
  rm ".toolchains/${ver}.tar.gz"
  "${dir}/usr/bin/swift" --version | head -1
}

fetch swift-6.2   "https://download.swift.org/swift-6.2-release/ubuntu2404/swift-6.2-RELEASE/swift-6.2-RELEASE-ubuntu24.04.tar.gz"
fetch swift-6.3.3 "https://download.swift.org/swift-6.3.3-release/ubuntu2404/swift-6.3.3-RELEASE/swift-6.3.3-RELEASE-ubuntu24.04.tar.gz"
fetch swift-6.4.2 "https://download.swift.org/swift-6.4.2-release/ubuntu2404/swift-6.4.2-RELEASE/swift-6.4.2-RELEASE-ubuntu24.04.tar.gz"

echo "全部工具链就绪。运行 'npm run verify:samples' 开始验证。"
