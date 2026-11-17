// F21 broken —— Span 是 ~Escapable：不能逃出 Getter 所在函数。
// 诊断（Swift 6.2）：
//   error: a function cannot return a ~Escapable result
func bad(_ values: [Int]) -> Span<Int> {
  values.span    // 想把借用视图带出去 → 编译失败
}
