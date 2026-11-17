// F07 before —— 共享可变变量 + 任务组并发递增。
// Swift 5 mode 下静默编译通过（存在数据竞争，故本样例只编译不运行）。
// 同一文件在 Swift 6 mode 下会得到：
//   error: mutation of captured var 'hits' in concurrently-executing code
var hits = 0

func countVisitsLegacy(n: Int) async {
  await withTaskGroup(of: Void.self) { group in
    for _ in 0..<n {
      group.addTask { hits += 1 }   // 昨天没人在意的竞态
    }
  }
}
