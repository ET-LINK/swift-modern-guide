// swift-tools-version: 6.2
import PackageDescription

let package = Package(
  name: "F16DoccDemo",
  dependencies: [
    // DocC 生成能力来自这个官方插件（模板项目装好后本地构建无需网络，
    // 但全新 clone 首次解析依赖需要访问 github.com/swiftlang）。
    .package(url: "https://github.com/swiftlang/swift-docc-plugin", from: "1.0.0"),
  ],
  targets: [
    .target(name: "F16Docs", path: "Sources/F16Docs")
  ]
)
