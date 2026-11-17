// swift-tools-version: 6.0
import PackageDescription

let package = Package(
  name: "F10Testing",
  targets: [
    .target(name: "Core", path: "Sources/Core"),
    .testTarget(
      name: "ModernTests",
      dependencies: ["Core"],
      path: "Tests/ModernTests"
    ),
    .testTarget(
      name: "LegacyTests",
      dependencies: ["Core"],
      path: "Tests/LegacyTests"
    ),
  ]
)
