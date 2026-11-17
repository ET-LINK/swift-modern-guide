// F06 after —— sending 参数（SE-0430）把“交出去就别再碰”写进函数签名：
// 数据跨隔离域的移动点从隐式约定变成显式 API 契约，
// 被 send 的值之后禁止在该隔离域内再被访问。
struct Chunk {
  var bytes: [UInt8]
}

actor Sink {
  var storage: [Chunk] = []
  func receive(_ chunk: sending Chunk) {
    storage.append(chunk)
  }
}

func process() async {
  let chunk = Chunk(bytes: [1, 2, 3])
  await Sink().receive(chunk)  // chunk 从这里开始属于 Sink 所在隔离域
}
