// F32 before —— 没有 cancellation shield 的年代：
// 想让清理逻辑无视父任务取消，只能跳出任务树、
// 用非结构化 detached 任务兜底（SE-0504 的 motivation 原样复刻）。
// 缺点：额外调度、语义上是“逃离结构化并发”，清理被推迟且无法内联表达。
func cleanup() {
  print("cleanup start")
  print("cleanup done")
}

func legacyGuardedCleanup() async {
  await withTaskGroup(of: Void.self) { group in
    group.addTask {
      // workaround：用 detached 任务让 cleanup 感知不到取消
      await Task.detached {
        cleanup()
      }.value
    }
    group.cancelAll()   // 子任务被取消，但 detached 的清理照样完成
  }
}

await legacyGuardedCleanup()
print("task cancelled: \(true)")
