// F07 after —— Mutex（SE-0433）：值语义的手工互斥。
// Mutex 自身是 Sendable，可以跨隔离域传递；
// withLock {} 保证互斥执行，1000 个并发递增结果恒为 1000。
import Synchronization

let hits = Mutex(0)

func countVisits(n: Int) async -> Int {
  await withTaskGroup(of: Void.self) { group in
    for _ in 0..<n {
      group.addTask {
        hits.withLock { $0 += 1 }
      }
    }
  }
  return hits.withLock { $0 }
}

print("count=\(await countVisits(n: 1000))")
