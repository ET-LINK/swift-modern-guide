// F25 测试源 —— 两个警告：一个 deprecated（有诊断组 [#DeprecatedDeclaration]），
// 一个「'_' 忽略 Void 返回值冗余」（该警告不属于我们要放行的组）。
// f25 三种验证策略的对比：
//   -warnings-as-errors            → 连无辜警告一起挡，粒度太粗（before）
//   -Werror DeprecatedDeclaration  → 只升级 deprecated 组（after）
//   SwiftPM .treatWarning(.error)  → 给包级别配置同样能力（after）
@available(*, deprecated, message: "use newAPI()")
func oldAPI() {}

func caller() {
  oldAPI()
}

_ = caller()   // 产生「using '_' to ignore the result of a Void-returning function is redundant」
