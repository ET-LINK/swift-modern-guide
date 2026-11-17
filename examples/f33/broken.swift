// F33 broken —— 组合（composition）后面跟 ? 仍然必须加括号：
// some Traced & Sendable? 的解析歧义被 6.4 明确拒绝。
// 诊断（Swift 6.4.2）：
//   error: confusing use of optional after a 'some' or 'any' composition;
//   use parentheses to clarify precedence
protocol Traced {
  func cost() -> Int
}

struct Rigid {
  func accept(_ v: some Traced & Sendable?) -> Int {
    v?.cost() ?? 0
  }
}
