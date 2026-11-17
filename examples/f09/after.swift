// F09 after —— Embedded Swift：host 构建。
// swiftc -enable-experimental-feature Embedded -wmo 把这段代码编译为
// 不依赖 Swift 运行时的可执行文件——泛型通过特化消除、无反射、无元数据。
// 官方定位是“preview/experimental”；这里只验证 host 构建 + 运行，
// 不宣称任何 MCU/固件/硬件验证。
struct Reading {
  let celsius: Int
  func adjusted(_ delta: Int) -> Int { celsius + delta }
  func describe() -> String { "reading: \(celsius)C" }
}

func measure() -> Reading {
  let r = Reading(celsius: 21)
  print("embedded total=\(r.adjusted(3))")
  return r
}

let r = measure()
print(r.describe())
