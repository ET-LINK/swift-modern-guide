// traits 与 #if 交互：构建系统把启用的 traits 变成编译条件
public func describe() -> String {
  #if FastPaths
  return "fast"
  #else
  return "generic"
  #endif
}

#if VerboseLogs
public func debugInfo() -> String { "verbose" }
#else
public func debugInfo() -> String { "quiet" }
#endif
