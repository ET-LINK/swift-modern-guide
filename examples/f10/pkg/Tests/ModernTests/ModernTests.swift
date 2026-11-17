// after —— Swift Testing（随 6.0 工具链分发）：
// @Test 宏 + #expect 表达式断言；参数化测试直接给 arguments。
import Testing
@testable import Core

@Test func additionWorks() {
  #expect(add(2, 3) == 5)
}

@Test(arguments: [1, 2, 3]) func scalesWithZero(n: Int) {
  #expect(add(n, 0) == n)
}
