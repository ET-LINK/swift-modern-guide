// swift-tools-version: 6.2
import PackageDescription

let package = Package(
  name: "F15Scoping",
  targets: [
    .target(name: "Core", path: "Sources/Core"),
    .testTarget(
      name: "ScopingTests",
      dependencies: ["Core"],
      path: "Tests/ScopingTests"
    ),
  ]
)
