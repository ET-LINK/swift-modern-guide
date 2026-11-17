// F21 after —— Span（SE-0447 + SE-0456）：对连续存储的只读“借视图”。
// values.span 的生命周期被限制在值的作用域内（~Escapable），
// 因此必须就地消费——这正是它安全的原因。
func spanSum(_ values: [Int]) -> Int {
  let span = values.span      // Span<Int>：对数组连续存储的借用视图
  var sum = 0
  for i in span.indices {
    sum += span[i]
  }
  return sum
}

print("span sum: \(spanSum([10, 20, 30]))")
