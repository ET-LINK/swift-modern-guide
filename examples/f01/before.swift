// F01 before —— 这份代码在 Swift 5 language mode 下编译通过、无任何诊断。
// 同一文件切换到 Swift 6 language mode（-parse-as-library）后会得到
// “var 'status' is not concurrency-safe because it is nonisolated global shared mutable state”。
var status = 0

struct Syncer {
  static func bump() { status += 1 }
}
