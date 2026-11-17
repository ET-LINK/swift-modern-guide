// F06 broken —— sending 与所有权模型的实战“坑”：
// ~Copyable 类型的 sending 参数必须显式标注 ownership，
// 因为“交出去”意味着移动，编译器要求把借用/取走写明。
// 诊断（Swift 6.2，-swift-version 6）：
//   error: parameter of noncopyable type 'Peg' must specify ownership
//   note: add 'borrowing' for an immutable reference
//   note: add 'consuming' to take the value from the caller
struct Peg: ~Copyable, Sendable {
  let color = "red"
}

actor Board {
  var pinned = 0
  func pin(_ peg: sending Peg) {   // ← sending 一个非复制类型：ownership 必须显式
    pinned += 1
  }
}
