// F02 before —— throws 一律是 any Error：调用方只能拿到擦除类型的 error，
// 想穷举错误种类必须写 default，编译器帮不上忙。
enum NetworkError: Error {
  case offline
  case timeout
}

func fetchLegacy(_ id: Int) throws -> String {
  if id == 0 { throw NetworkError.offline }
  return "user-\(id)"
}

func describeLegacy(_ id: Int) -> String {
  do {
    let s = try fetchLegacy(id)
    return "ok: \(s)"
  } catch {
    // 这里 error 是 any Error（除非手动 as? 拆箱），
    // 意味着新增错误种类时编译器不会提醒这里漏掉分支。
    print("caught any Error: \(error)")
    return "exhaustive switch over any Error 不可行，只能 default"
  }
}

print(describeLegacy(0))
