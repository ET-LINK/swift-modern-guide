// F12 after —— 6.1 起：小写函数体推断 child task 结果类型，
// of: 参数可以省掉（SE 说明见 Swift 6.1 release notes · Concurrency）。
func downloadMessage(for id: Int) async -> String { "msg-\(id)" }

func fetchAfter() async -> [String] {
  let ids = [1, 2]
  return await withTaskGroup { group in    // 没有 of: 也能编了
    for id in ids {
      group.addTask { await downloadMessage(for: id) }
    }
    var messages: [String] = []
    for await message in group {
      messages.append(message)
    }
    return messages.sorted()
  }
}
