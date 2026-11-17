// ST-0008 exit tests：把闭包放进子进程执行并断言其退出方式。
// 注意约束：exit test 闭包不能捕获外部状态（跨进程边界），
// 嵌套 exit test 也不被允许。
import Testing
@testable import Core

@Test func validTicketPassesCheck() {
  #expect(Ticket(price: 10).price == 10)
}

@Test func badTicketTerminatesProcess() async {
  await #expect(processExitsWith: .failure) {
    Ticket(price: -1).check()
  }
}

@Test func uncaughtErrorIsAlsoProcessFailure() async {
  await #expect(processExitsWith: .failure) {
    struct Boom: Error {}
    throw Boom()
  }
}
