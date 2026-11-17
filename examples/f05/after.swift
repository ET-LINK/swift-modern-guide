// F05 after —— region-based isolation（SE-0414）：
// 编译器分析“隔离区域”：新建的非 Sendable 值只要之后不再被调用方使用，
// 就可以直接转移进 actor——不需要 @unchecked Sendable，也不引入数据竞争。
final class Ticket {
  var seat: String
  init(seat: String) { self.seat = seat }
}

actor BoxOffice {
  private var booked: [String] = []

  func register(_ t: Ticket) {
    booked.append(t.seat)
  }
}

func buyOne() async {
  let ticket = Ticket(seat: "1A")
  // 转移后调用方不再使用 ticket —— 编译器能证明安全
  await BoxOffice().register(ticket)
  // 此处不能再碰 ticket（除非它所在区域后续再无 actor 使用）
}
