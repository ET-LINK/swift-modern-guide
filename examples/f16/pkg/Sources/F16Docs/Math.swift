/// 把整数翻倍。
///
/// 旧式链接 ``combine(_:)`` 会在两个同参数个数的重载之间产生歧义警告；
/// 新式按类型消歧 ``combine(_:)->Double`` 则静默命中目标。
public func combine(_ first: Int) -> Int { first + first }

/// 把浮点数翻倍。
///
/// 对整数版本请用 ``combine(_:)->Int``。
public func combine(_ first: Double) -> Double { first + first }
