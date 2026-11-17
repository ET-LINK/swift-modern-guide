// F03 before —— 用 final class 手工管理“只能关一次”的资源。
// close() 万一被调两次，编译器拦不住（输出里第二次 close 也成功执行了）。
final class FileHandleOld {
  let path: String
  private var open = true

  init(path: String) {
    self.path = path
    print("open \(path)")
  }

  func close() {
    // 没有任何语言机制阻止重复调用
    print("close \(path) (can be called twice: 2)")
    open = false
  }

  func closeAgain() {
    // 旧模型里这是完全合法的——哪怕资源已经关过
    print("close \(path) (second call ok: 3)")
  }

  deinit { print("deinit \(path)") }
}

do {
  let h = FileHandleOld(path: "b.txt")
  h.close()
  h.closeAgain()
}
print("scope ended")
