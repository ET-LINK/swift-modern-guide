// swift-tools-version: 6.2
import PackageDescription

let package = Package(
  name: "F26ExitTests",
  targets: [
    .target(name: "Core", path: "Sources/Core"),
    .testTarget(
      name: "ExitTests",
      dependencies: ["Core"],
      path: "Tests/ExitTests"
    ),
  ]
)
