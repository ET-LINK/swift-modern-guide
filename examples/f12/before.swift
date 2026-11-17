// F12 before —— 6.0 及以前：任务组必须显式写 of: Message.self。
// 现在仍然合法（推广用法没变，只是不再强制第二个参数）。
func downloadMessage(for id: Int) async -> String { "msg-\(id)" }

func fetchBefore() async -> [String] {
  let ids = [1, 2]
  return await withTaskGroup(of: String.self) { group in
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
