// F23 broken —— raw identifier 不能“裸用”：
// 空格会让解析器把 .with a space 拆成多条语句。
// 诊断（Swift 6.2）：
//   error: consecutive statements on a line must be separated by ';'
struct S {
  var `with a space` = 1
}
let s = S()
print(s.with a space)    // ← 必须写 s.`with a space`
