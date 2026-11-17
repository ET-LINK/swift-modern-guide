// F29 after —— @c 函数与枚举（SE-0495，实现于 6.3）。
// 运行器还会：
//   1) 用 -emit-clang-header-path 生成 C 头文件并断言其中声明；
//   2) 用 6.2 工具链编译同一文件证伪“旧版已支持”：
//      error: unknown attribute 'c'。
@c
func addValues(_ a: CInt, _ b: CInt) -> CInt {
  a + b
}

// 可选参数：自定义 C 侧符号名
@c(CalculateFacade_multiply)
func multiply(_ a: CInt, _ b: CInt) -> CInt {
  a * b
}

// @c 枚举：raw 值类型必须是 C 兼容整数；case 名映射为 LevelLow / LevelHigh
@c
enum Level: CInt {
  case low
  case high
}
