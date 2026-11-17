// swift-tools-version: 6.2
import PackageDescription
import Foundation

// 定位工具链头文件目录：`.toolchains/` 固定位于仓库根目录
// （scripts/fetch-toolchains.sh 保证这个布局），Package.swift 通过
// #filepath 相对推导，不在 manifest 中提交任何机器相关的绝对路径。
let manifestDir = URL(fileURLWithPath: #filePath, isDirectory: false).deletingLastPathComponent()
let repoRoot = manifestDir.deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
let toolchainInclude = repoRoot
  .appendingPathComponent(".toolchains", isDirectory: true)
  .appendingPathComponent("swift-6.2", isDirectory: true)
  .appendingPathComponent("usr", isDirectory: true)
  .appendingPathComponent("include", isDirectory: true)
  .path
let interopIncludes: [CXXSetting] = FileManager.default.fileExists(atPath: toolchainInclude)
  ? [.unsafeFlags(["-I", toolchainInclude])]
  : []
let swiftImporterIncludes: [SwiftSetting] = FileManager.default.fileExists(atPath: toolchainInclude)
  ? [.unsafeFlags(["-Xcc", "-I\(toolchainInclude)"])]
  : []

let package = Package(
  name: "F08Interop",
  targets: [
    .target(
      name: "CppLib",
      path: "Sources/CppLib",
      cxxSettings: interopIncludes
    ),
    .executableTarget(
      name: "F08Runner",
      dependencies: ["CppLib"],
      path: "Sources/F08Runner",
      swiftSettings: [
        .interoperabilityMode(.Cxx),
      ] + swiftImporterIncludes
    ),
  ],
  cxxLanguageStandard: .gnucxx17
)
