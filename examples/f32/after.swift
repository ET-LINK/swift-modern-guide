// F32 after —— SE-0504 withTaskCancellationShield（实现于 6.4，不能 back-deploy）：
//   * 屏蔽区间内 Task.isCancelled 读到 false；
//   * 区间结束后恢复原状态（本例 outer task 已取消 → true）；
//   * 与 defer 组合（F31）就是“保证清理、无视取消”的两件套。
// 以下输出由 6.4.2 实机运行而来，顺序确定。
nonisolated func backgroundWork() async {
  defer {
    withTaskCancellationShield {
      print("cleanup: cancelled=\(Task.isCancelled)")   // false：屏蔽生效
    }
  }
  print("work start")
  while !Task.isCancelled { await Task.yield() }        // 等到取消送达
  print("observed cancellation: \(Task.isCancelled)")   // true：恢复观察
}

await withTaskGroup(of: Void.self) { group in
  group.addTask { await backgroundWork() }
  group.cancelAll()
}
print("main: still fine")

// 注意：hasActiveCancellationShield 等 UnsafeCurrentTask API 也属于该提案，
// 但超出本样例承诺（见文章正文）。
