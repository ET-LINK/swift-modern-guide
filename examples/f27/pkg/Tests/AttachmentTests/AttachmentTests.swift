import Testing
@testable import Core

// before/after 都在包内验证：旧 print 调试（仍完全合法）与新 attachment（ST-0009）
@Test func debugByPrint() {
  let trace = "value=1 source=checkpoint"
  print("debug \(trace)")            // ← 旧办法：混在测试日志里
  #expect(add(1, 1) == 2)
}

@Test func attachAndVerify() {
  // after —— ST-0009 attachments：附带给测试运行的带外数据
  Attachment.record("attachment-content-check", named: "note.txt")
  #expect(add(1, 1) == 2)
}
