// F14 before —— traits 之前的“土办法”：在 manifest 里读环境变量控制编译
// 是很多包的私货做法（SE-0450 的动机之一就是取代它）。
// 这里用运行时 ProcessInfo 模拟同样的“可选能力”，逻辑一样，但：
//   - 条件分支要自己写、容易漏；
//   - 与构建系统无关，无法像 --traits 一样进入构建计划。
import Foundation

func describeRuntime() -> String {
  let env = ProcessInfo.processInfo.environment
  return env["FEATURE_FAST_PATHS"] == "1" ? "fast" : "generic"
}

print("traits-style=\(describeRuntime())")
setenv("FEATURE_FAST_PATHS", "1", 1)
print("traits-style=\(describeRuntime())")
