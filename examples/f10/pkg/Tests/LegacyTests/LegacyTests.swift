// before —— 同一断言的 XCTest 写法（仍然合法可用）：
// final class + 无参数化 + XCTAssert 系列前缀。
// Swift Testing 已随工具链默认可用，新特性（见 F15/F26/F27）不再回填 XCTest。
import XCTest
@testable import Core

final class LegacyAddTests: XCTestCase {
  func testAdditionWorks() {
    XCTAssertEqual(add(2, 3), 5)
  }

  func testScalesWithZero() {
    [1, 2, 3].forEach { n in
      XCTAssertEqual(add(n, 0), n)
    }
  }
}
