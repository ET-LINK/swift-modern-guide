// F06 before —— 没有 sending 参数的年代，跨隔离域移动数据只能靠
// @unchecked Sendable 包装（或干脆把结构体标成 Sendable 并假装它没有内部状态）。
// 现在仍合法——但每写一行都是在赌“没人再碰它”。
struct LegacyChunk: @unchecked Sendable {
  var bytes: [UInt8]
}

actor LegacySink {
  var storage: [LegacyChunk] = []
  func receive(_ c: LegacyChunk) { storage.append(c) }
}

func legacySend() async {
  let chunk = LegacyChunk(bytes: [1, 2, 3])
  await LegacySink().receive(chunk)
}
