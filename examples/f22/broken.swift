// F22 broken —— 悬垂指针：把隐式转换出来的指针存到变量里。
// 编译日志里可以看到诊断组标签：[#TemporaryPointers]。
// 本特性 [].log 里体现三个层次：
//   1) 无 flag（before 样本）：产生 dangling pointer 警告，退出码 0；
//   2) -strict-memory-safety -Werror TemporaryPointers（broken 样本）：升级为错误；
//   3) after 样本给出安全改写。
var values = [1, 2, 3]
let p = UnsafeMutablePointer(&values)    // 指针只在这次调用期间有效
_ = p.pointee                              // ← 已经悬垂
