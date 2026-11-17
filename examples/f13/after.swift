// F13 after —— 6.1 起 trailing comma 允许的位置（SE-0439）：
// 集合字面量、元组、函数形参列表、调用实参列表、泛型形参/实参列表，
// 以及闭包捕获列表和插值中的函数调用。
struct Config {
  let a: Int
  let b: Int
  init(a: Int, b: Int,) {   // 形参列表
    self.a = a
    self.b = b
  }
}

let numbers = [1, 2, 3,]                    // 集合字面量
let pair = (x: 1, y: 2,)                   // 元组

func generic<T, U,>(a: T, b: U,) -> Int {  // 泛型形参列表 + 形参列表
  1
}

let c = Config(a: 1, b: 2,)                 // 调用实参列表
let n = generic(a: 1, b: "x",)              // 同上
let fallback = "\(generic(a: 1, b: "y",))"  // 插值里的调用同样适用

// 注意：不是“所有列表”——比如函数类型 (Int, Int) -> Void 的参数列表
// 在 6.2 仍未放开（见文章正文）。
