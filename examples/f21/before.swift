// F21 before —— Span 之前想“零拷贝读数组一段”，
// 手写法基本就是 withUnsafeBufferPointer + 下标算术。
// 合法，但每一行都在可信边界外。
let values = [10, 20, 30]
var sum = 0
values.withUnsafeBufferPointer { buf in
  for i in buf.indices {
    sum += buf[i]
  }
}
print("unsafe sum: \(sum)")
