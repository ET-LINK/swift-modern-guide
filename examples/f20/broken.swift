// F20 broken —— 长度是类型的一部分：字面量元素个数与 [N of T] 不符即编译失败。
// 诊断（Swift 6.2）：
//   error: expected '3' elements in inline array literal, but got '4'
let a: [3 of Int] = [1, 2, 3, 4]
