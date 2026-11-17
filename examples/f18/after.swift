// F18 after —— 这份“app 式”代码在 -default-isolation MainActor 下整体被推断为
// MainActor：全局可变状态、ViewModel、方法调用彼此可见，无需逐个标注。
// 同一文件在没有该 flag 时会编译失败（见 f18-broken-no-flag 样本）。
// 注意边界：-default-isolation 是编译器 flag；Xcode 26 的“新 App 默认 MainActor”
// 是模板为 App target 写入同一构建设置，两者并不等同“6.2 的所有模块”。
var count = 0

class ViewModel {
  func increment() {
    count += 1        // 没有 flag 时：main actor-isolated var 不能在 nonisolated 上下文改
  }
}

let vm = ViewModel()
vm.increment()
print("count=\(count)")
