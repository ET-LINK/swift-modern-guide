// F11 after —— SE-0449：nonisolated 现在可以写在类型和 extension 上。
// 用途一：类型级 nonisolated 阻断 @MainActor 推断；
// 用途二：extension 级 nonisolated 一次性声明整个扩展不走全局 actor。
@MainActor
struct Profile {
  var id: Int
  var name: String

  // 其余成员自动推断为 @MainActor
}

// extension 整体 nonisolated：描述/相等这些纯计算不占用主线程
nonisolated extension Profile: Equatable {
  static func == (lhs: Profile, rhs: Profile) -> Bool {
    lhs.id == rhs.id
  }

  var debugLabel: String {
    "\(id)-\(name)"
  }
}

// 类型级 nonisolated：这个 struct 永远不会被推断成 @MainActor，
// API 可以被任何隔离域调用。
nonisolated struct GeoPoint {
  var lat: Double
  var lon: Double

  func distance(to other: GeoPoint) -> Double {
    let dlat = other.lat - lat
    let dlon = other.lon - lon
    (dlat * dlat + dlon * dlon).squareRoot()
  }
}

func useEverywhere() {
  let p = Profile(id: 1, name: "swift")
  let g = GeoPoint(lat: 0, lon: 0)
  _ = p == Profile(id: 1, name: "swift6")
  _ = p.debugLabel
  _ = g.distance(to: GeoPoint(lat: 3, lon: 4))
}
