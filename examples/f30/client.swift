// F30 client —— module selectors（SE-0491，实现于 6.3）：
//   ModuleA::getValue() 而不是“改名/加类型别名”绕开冲突；
//   Swift:: 前缀还能显式点亮标准库符号。
// 运行器同样会用 6.2 编译此文件，得到解析级错误：
//   error: consecutive statements on a line must be separated by ';'
import ModuleA
import ModuleB

func picked() -> (Int, Int) {
  let x = ModuleA::getValue()
  let y = ModuleB::getValue()
  return (x, y)
}

nonisolated func concurrencySelector() {
  let named = Swift::Task { 1 }
  _ = named
}
