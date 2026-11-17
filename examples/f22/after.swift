// F22 after —— 在 -strict-memory-safety（SE-0458，6.2 起，逐步演进的 opt-in）
// 下按“安全方式”书写内存访问：作用域化 API + 借用视图。
// 这份代码在开启 flag 时干净通过（无警告）。
var values = [10, 20, 30]
var sum = 0
values.withUnsafeMutableBufferPointer { buf in   // 生命周期被 closure 圈住
  buf[0] += 5
  for i in buf.indices {
    sum += buf[i]
  }
}
let span = values.span        // 只读借视图，就地消费
_ = span.count
