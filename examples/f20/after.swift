// F20 after —— InlineArray（SE-0453）+ [N of T] 语法糖（SE-0483）：
// 长度进类型、栈上连续存储、无 COW。
// 两种写法等价：[4 of Int] 是 InlineArray<4, Int> 的糖。
let a: [4 of Int] = [1, 2, 3, 4]   // 语法糖
var sum = 0
for i in a.indices { sum += a[i] }
print("sum=\(sum), count=\(a.count)")

var arr = InlineArray<3, Int>(repeating: 0)   // 显式泛型形参
arr[0] = 7
arr[1] = 3
arr[2] = 1
var total = 0
for i in arr.indices { total += arr[i] }
print("total=\(total)")
