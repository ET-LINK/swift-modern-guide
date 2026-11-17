// F24 after —— named tasks（SE-0469，实现于 6.2）：
//   创建：Task(name:) / Task.detached(name:) / group.addTask(name:)
//   读取：Task.name（当前任务名，调试与观测用）
// 本样例只用 6.2 已实现的创建/当前任务名 API。
// handle 上的 t.name 属性属于后来对 SE-0469 的修订，不在本样例承诺范围。
func report() {
  if let n = Task.name {
    print("current task name: \(n)")
  } else {
    print("current task name: nil")
  }
}

let refresh = Task(name: "refresh-feed") {
  report()
}
_ = await refresh.value

await withTaskGroup(of: Void.self) { group in
  group.addTask(name: "child-worker") {
    report()
  }
}
