// F33 after —— SE-0521（实现于 6.4）：optional 的 some / any 不再强制加括号。
// 6.3 及以前：func audit(_ v: (some Traced)?)
// 6.4 开始：  func audit(_ v: some Traced?)
protocol Traced {
  func cost() -> Int
}

struct Plan: Traced {
  func cost() -> Int { 10 }
}

func audit(_ v: some Traced?) -> String {
  guard let v else { return "none" }
  return "cost=\(v.cost())"
}

struct Slot {
  var payload: any Traced? = nil      // optional any 同样免括号
}

func useAll() -> String {
  let a = audit(Plan())
  let empty = Slot().payload
  let hint = empty == nil ? "slot empty" : "slot filled"
  return "\(a) \(hint)"
}
