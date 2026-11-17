// F11 broken —— nonisolated extension 的成员真的在非隔离域执行：
// 在里面同步调用 @MainActor 函数，编译器拒绝。
// 诊断（Swift 6.2）：
//   error: call to main actor-isolated global function 'refresh()' in a
//   synchronous nonisolated context [#ActorIsolatedCall]
@MainActor func refresh() {}

@MainActor struct Model { var id = 1 }

nonisolated extension Model {
  func describe() -> String {
    refresh()          // ← 这里在非隔离上下文，不能同步进 MainActor
    return "model \(id)"
  }
}
