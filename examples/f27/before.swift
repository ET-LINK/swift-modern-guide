// before：失败上下文只能 print()——测试报告里没有结构化痕迹。
// after（见 attachAndVerify sample）：Attachment.record 落到测试产物里，
// --attachments-path 把文件写到磁盘，工具链可读取。
import Testing
@testable import Core

@Test func debugByPrint() {
  let trace = "value=1 source=checkpoint"
  print("debug \(trace)")            // ← 旧办法：混在测试日志里
  #expect(add(1, 1) == 2)
}
