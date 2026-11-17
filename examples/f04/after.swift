// F04 after —— SE-0427：泛型形参可以直接写 T: ~Copyable。
// 6.0 之前，所有泛型都隐式要求 Copyable，非复制类型根本进不了泛型世界；
// 这意味着你无法为 ~Copyable 资源写一个通用的“开/关”容器。
struct Resource: ~Copyable {
  var id = 1
}

// 容器本身也放弃复制能力
struct Box<T: ~Copyable>: ~Copyable {
  var value: T
}

// 泛型函数可以约束为“只借用、不取走”
func touch<R: ~Copyable>(_ r: borrowing R) {
  print("borrowed resource")
}

let box = Box(value: Resource())
touch(box.value)

// 交换两个非复制值（inout 语义不产生复制）
func swapNoncopyable<T: ~Copyable>(_ a: inout T, _ b: inout T) {
  let tmp = consume a
  a = consume b
  b = consume tmp
}

var r1 = Resource()
var r2 = Resource()
r1.id = 10
r2.id = 20
swapNoncopyable(&r1, &r2)
