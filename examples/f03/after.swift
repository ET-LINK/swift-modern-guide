// F03 after —— struct + ~Copyable：所有权系统进了类型系统。
// consuming close() 把句柄“吃掉”，第二次 close 连编译都过不了；
// deinit 保证唯一一次清理，顺序可预期（先 body，后 deinit）。
struct FileHandle: ~Copyable {
  let path: String

  init(path: String) {
    self.path = path
    print("open \(path)")
  }

  consuming func close() {
    print("close \(path)")
  }

  deinit {
    print("deinit \(path)")
  }
}

do {
  let h = FileHandle(path: "a.txt")
  h.close()
  // 这里 h 已被消耗；任何再使用（包括再 close()）都无法通过编译。
}
print("scope ended")
