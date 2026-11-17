@available(*, deprecated, message: "use fresh()")
func stale() {}

public func work() {
  stale()   // ↑ manifest 里 treatWarning("DeprecatedDeclaration", as: .error) ⇒ 构建失败
}
