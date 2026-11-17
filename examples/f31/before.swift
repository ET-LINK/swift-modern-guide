// F31 before —— defer 不能 await 的年代：真正的异步清理只有两条路。
// 这里用“每个出口手工补 await 清理”展示旧行为（仍可运行，输出顺序一致）；
// 危险在于一旦函数变复杂（早退、throw），忘掉任意一处就是泄漏。
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

func runOld() async -> String {
  let session = Session(id: 9)
  let result = await session.work()
  print("body done")
  // 只有一条成功路径，所以“看起来”没事——throw 一旦加入这里就会漏
  await flushLogs(session.id)
  return result
}

print(await runOld())
