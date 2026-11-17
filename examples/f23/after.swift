// F23 after —— SE-0451 raw identifiers：反引号里可以放空格、数字开头等
// 「非标识符」字符；成员访问处也必须继续用反引号。
struct Palette {
  enum Variant {
    case `50`        // 数字开头
    case `100`
    case `200`
  }

  static var `accent color`: String = "red"

  func `render with style`(_ s: String) -> String { s }
}

let tint = Palette.Variant.`100`
print(Palette.`accent color`)
let p = Palette()
print(p.`render with style`("hi"))
