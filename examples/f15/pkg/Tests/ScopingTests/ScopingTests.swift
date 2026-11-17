// ST-0007：自定义 trait 实现 TestScoping，给测试加共享 setup/teardown，
// 顺序可在 swift test 输出里观察：before: setup-counter → 测试体 → after: released。
import Testing
@testable import Core

struct OrderLogging: TestTrait, TestScoping {
  func provideScope(
    for test: Test,
    testCase: Test.Case?,
    performing function: @Sendable () async throws -> Void
  ) async throws {
    print("before: setup-counter for \(test.name)")
    try await function()
    print("after: released")
  }
}

extension Trait where Self == OrderLogging {
  static var orderLogging: Self { Self() }
}

@Test(.orderLogging)
func greetingScoping() {
  #expect(greet("swift") == "hello swift")
}
