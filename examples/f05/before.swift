// F05 before —— SE-0414 发布前的“官方杂技”：
// 想把非 Sendable 的值送进 actor，只能包一层 @unchecked Sendable 向编译器立军令状。
// 这段代码现在仍然合法——但所有安全性都成了你自己的口头承诺。
final class UncheckedBox<T>: @unchecked Sendable {
  var value: T
  init(value: T) { self.value = value }
}

actor BoxOfficeLegacy {
  private var tickets: [String] = []

  func record(_ box: UncheckedBox<String>) {
    tickets.append(box.value)
  }
}

func legacyBuy() async {
  let ticket = UncheckedBox(value: "1A")
  await BoxOfficeLegacy().record(ticket)
}
