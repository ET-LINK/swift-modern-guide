// F19 broken —— @concurrent 意味着真正的并发上下文：
// 在里面同步调用 MainActor 函数，编译器拒绝。
// 诊断（Swift 6.2）：
//   error: main actor-isolated global function 'refreshList()' cannot be
//   called from outside of the actor
@MainActor func refreshList() {}

class Sync {
  @concurrent
  func badTouch() async {
    refreshList()   // ← @concurrent 不是魔法通行证
  }
}
