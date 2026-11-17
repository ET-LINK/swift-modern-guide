// F19 after —— SE-0461：
//   @concurrent func       —— 显式声明“要并发执行”（跳到全局并发执行器）
//   nonisolated(nonsending) func —— 显式声明“不换执行器，留在调用方隔离域”
// 6.2 默认行为仍是老语义；加了
//   -enable-upcoming-feature NonisolatedNonsendingByDefault
// 之后，「未标注 nonisolated async」的函数默认变成 caller-isolated，
// 这两个写法就是迁移期标注例外的主要工具（本样例用 flag 后同样编译通过）。
@concurrent
func heavyWork() async -> Int {
  42
}

nonisolated(nonsending)
func sameThreadWork() async -> Int {
  1
}

func useBoth() async -> Int {
  let a = await heavyWork()       // 并发执行器上跑
  let b = await sameThreadWork()  // 不发生跨执行器转移
  return a + b
}
