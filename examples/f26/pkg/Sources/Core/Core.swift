public struct Ticket {
  public var price = 0
  public init(price: Int) { self.price = price }

  public func check() {
    // 在 0 或负价格上应当“进程级失败”——
    // 这类 API 正是 exit tests 的靶子。
    precondition(price > 0, "price must be positive")
  }
}
