// swift-tools-version: 6.2
import PackageDescription

let package = Package(
  name: "F25Warn",
  targets: [
    .target(
      name: "Core",
      path: "Sources/Core",
      swiftSettings: [
        // SE-0480：manifest 级告警控制——把 DeprecatedDeclaration 组升级为错误
        .treatWarning("DeprecatedDeclaration", as: .error),
      ]
    )
  ]
)
