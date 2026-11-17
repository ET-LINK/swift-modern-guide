// swift-tools-version: 6.2
import PackageDescription

// F14 —— SE-0450 package traits：
// 包作者声明可用 traits 与默认启用集合；
// 构建方用 --traits / --disable-default-traits / --enable-all-traits 自选。
let package = Package(
  name: "F14Traits",
  traits: [
    .default(enabledTraits: ["FastPaths"]),
    .trait(name: "FastPaths", description: "启用针对纯整数负载的快速路径"),
    .trait(name: "VerboseLogs", description: "打开结构化调试日志"),
  ],
  targets: [
    .target(name: "Core", path: "Sources/Core"),
    .executableTarget(
      name: "F14Runner",
      dependencies: ["Core"],
      path: "Sources/F14Runner"
    ),
  ]
)
