// F05 broken —— region 黄金法则：区域一旦送进 actor，
// 区域里所有还活着的别名都不能再被调用方使用。
// 编译器诊断（Swift 6.2，-swift-version 6）：
//   error: sending 'first' risks causing data races [#SendingRisksDataRace]
//   note:sending 'first' to actor-isolated instance method 'register' ...
//   note:access can happen concurrently（下一行的 alias.seat）
final class Ticket {
  var seat: String
  init(seat: String) { self.seat = seat }
}

actor BoxOffice {
  private var booked: [String] = []
  func register(_ t: Ticket) {
    booked.append(t.seat)   // 参数被真正使用/留存，调用方区域随之锁定
  }
}

func buyTwo() async {
  let first = Ticket(seat: "1A")
  let alias = first            // alias 与 first 同属一个隔离区域
  await BoxOffice().register(first)  // 区域整体转移进 actor
  print(alias.seat)            // 还想用区域里的别名 → 数据竞争风险，编译失败
}

await buyTwo()
