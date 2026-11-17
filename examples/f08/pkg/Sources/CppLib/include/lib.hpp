#ifndef CPPLIB_LIB_HPP
#define CPPLIB_LIB_HPP

// C++ 互操作三类典型场景（Swift 6 增强项）：
//   1. move-only 类型导入为 ~Copyable（复制构造删除的 AuthToken）
//   2. virtual method 动态派发：SWIFT_IMMORTAL_REFERENCE 标注的 CppShape
//      及其 C++ 子类实现，Swift 侧调用虚函数走 C++ 动态派发
//   3. 带默认实参的自由函数（withDefaultArgument）
#include <swift/bridging>

class AuthToken {
public:
  explicit AuthToken(int value) : value_(value) {}
  AuthToken(const AuthToken &) = delete;             // 不可复制：move-only
  AuthToken &operator=(const AuthToken &) = delete;
  AuthToken(AuthToken &&other) noexcept : value_(other.value_) { other.value_ = -1; }
  AuthToken &operator=(AuthToken &&other) noexcept {
    value_ = other.value_;
    other.value_ = -1;
    return *this;
  }
  ~AuthToken() = default;
  int value() const { return value_; }
private:
  int value_;
};

// 让 Swift 能把 CppShape 当引用类型使用的官方标注。
// 实例由 C++ 侧静态持有、生命周期与进程一致 → SWIFT_IMMORTAL_REFERENCE。
class SWIFT_IMMORTAL_REFERENCE CppShape {
public:
  CppShape(double radius) : radius_(radius) {}
  virtual ~CppShape() = default;
  virtual double area() const { return 0.0; }        // 基类默认：无面积
  double describeRadius() const { return radius_; }
protected:
  double radius_;
};

// 工厂：返回 C++ 侧 Circle 子类的静态实例（体现虚函数动态派发）
CppShape &makeDemoCircle();

// 取 CppShape 的四舍五入面积（避免在 Swift 侧引入浮点取整的链接依赖）
int roundedArea(const CppShape &shape);

// 默认实参：Swift 侧可见两个重载形状
int withDefaultArgument(int base, int delta = 12);

#endif
