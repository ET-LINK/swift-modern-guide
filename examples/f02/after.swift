// F02 after —— throws(NetworkError) 把错误类型写进签名，
// catch 拿到的就是精确类型的 error，switch 不需要 default；
// 泛型函数还能用 throws(E) 透明转发错误类型。
enum NetworkError: Error, Sendable {
  case offline
  case timeout
}

func fetch(_ id: Int) throws(NetworkError) -> String {
  if id == 0 { throw NetworkError.offline }
  if id < 0 { throw NetworkError.timeout }
  return "user-\(id)"
}

func describe(_ id: Int) -> String {
  do {
    return "ok: \(try fetch(id))"
  } catch {
    // error 已是 NetworkError：这个 switch 是穷举的，
    // 给 NetworkError 加新 case 时这里会编译报错，逼你补分支。
    switch error {
    case .offline: return "offline"
    case .timeout: return "timeout"
    }
  }
}

// 泛型转发：错误类型 E 是类型参数的一部分。具名函数值 risky 的
// “() throws(NetworkError) -> Int”签名把 E 固定为 NetworkError，
// forward 的错误类型随之在 rethrowTyped 的签名里继续精确——
// 而不是像 6.0 以前那样一律摊平成 any Error。
func forward<E: Error & Sendable>(_ body: () throws(E) -> Int) throws(E) -> Int {
  try body()
}

func risky() throws(NetworkError) -> Int {
  throw NetworkError.timeout
}

func rethrowTyped() throws(NetworkError) -> Int {
  try forward(risky)
}

print(describe(7))
print(describe(0))
print(describe(-1))

func demoForward() -> String {
  do {
    _ = try rethrowTyped()
    return "unreachable"
  } catch {
    // 不带 case 的 catch 直接绑定精确类型 error: NetworkError，
    // switch 因此穷举、无需 default——这是 typed throws 的核心收益。
    switch error {
    case .offline: return "forwarded offline"
    case .timeout: return "forwarded timeout"
    }
  }
}
print(demoForward())
