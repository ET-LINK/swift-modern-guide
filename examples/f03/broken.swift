// F03 broken —— 消耗之后再使用。
// 所有权诊断由编译器 SIL 阶段发出（单纯 -typecheck 看不到），需要完整编译。
// 实际诊断（Swift 6.2）：
//   error: 'conn' used after consume
//   note: consumed here
struct Connection: ~Copyable {
  let id: Int
  init(id: Int) { self.id = id }
}

func handoff(_ c: consuming Connection) {
  print("handed off #\(c.id)")
}

func run() {
  let conn = Connection(id: 3)
  handoff(conn)            // consuming 参数：隐式 consume
  print("after handoff: \(conn.id)")  // ← conn 已经没了，这里必然报错
}
