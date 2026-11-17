// F08Runner —— 在 Swift 里使用 C++：move-only 类型、virtual method、默认实参。
// 注意：这验证的是 Ubuntu host 上的 SwiftPM C++ 互操作构建，
// 不代表 iOS ABI / Objective-C 环境。

import CppLib

func moveOnlyDemo() -> Int {
  // AuthToken 复制构造已删除 → Swift 侧呈现为不可复制导入；
  // 工厂函数按移动语义返回。C++ 的 int 在 Swift 侧导入为 Int32。
  func makeToken() -> AuthToken {
    AuthToken(42)
  }
  let token = makeToken()
  return Int(token.value())
}

func virtualDispatchDemo() -> Int {
  // makeDemoCircle 返回 Circle 子类的实例（C++ 侧实现），
  // Swift 拿到 CppShape；area() 经 C++ 虚派发命中 Circle 实现。
  // 半径 7 → π·49 ≈ 153.94 → rounded = 154。
  let shape: CppShape = makeDemoCircle()
  return Int(roundedArea(shape))
}

func defaultArgumentDemo() -> Int {
  // C++ 里 withDefaultArgument(base, delta = 12)：
  // Swift 侧把默认实参展开成重载，可以直接省略第二个参数。
  let full = withDefaultArgument(0, 12)
  let omitted = withDefaultArgument(0)
  precondition(full == omitted, "default argument expansion mismatch")
  return Int(omitted)
}

print("token moved, value=\(moveOnlyDemo())")
print("virtual dispatch: area of r=7 circle = \(virtualDispatchDemo())")
print("cpp default arg: \(defaultArgumentDemo())")
