// swift-tools-version: 6.2
import PackageDescription

let package = Package(
  name: "F27Attachments",
  targets: [
    .target(name: "Core", path: "Sources/Core"),
    .testTarget(
      name: "AttachmentTests",
      dependencies: ["Core"],
      path: "Tests/AttachmentTests"
    ),
  ]
)
