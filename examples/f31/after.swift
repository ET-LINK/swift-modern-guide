// F31 after —— SE-0493（实现于 6.4）：defer 块里可以 await。
// 所有出口（return、throw、正常结束）都保证执行清理并被 await 完：
// 输出顺序：open → body done → flush logs → 返回值。
// 运行器会用 6.2 编译同一文件证伪：
//   error: 'async' call cannot occur in a defer body
struct Session {
  let id: Int
  init(id: Int) {
    self.id = id
    print("open session \(id)")
  }
  func work() async -> String { "work-\(id)" }
}

func flushLogs(_ id: Int) async {
  print("flush logs for \(id)")
}

func run() async -> String {
  let session = Session(id: 7)
  defer {
    await flushLogs(session.id)   // ← 6.4 才能这样写
  }
  let result = await session.work()
  print("body done")
  return result
}

print(await run())
