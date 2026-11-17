// F01 after —— 把可变状态收进 actor（或标注 @MainActor）后，同一职责在 Swift 6 mode 下合法。
actor StatusStore {
  private var value = 0
  func bump() -> Int {
    value += 1
    return value
  }
}

struct ContentView {
  var store = StatusStore()
  func render() async -> String {
    let current = await store.bump()
    return "status: \(current)"
  }
}
