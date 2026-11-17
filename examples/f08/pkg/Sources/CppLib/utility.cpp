#include "lib.hpp"

namespace {
// C++ 侧的 Circle 子类：area() 覆写基类默认实现。
// Swift 拿到的是 CppShape 引用 —— 调 area() 时走 C++ 虚派发。
class Circle final : public CppShape {
public:
  Circle(double r) : CppShape(r) {}
  double area() const override {
    return 3.14159265358979 * radius_ * radius_;
  }
};

Circle demoCircle{7.0};   // 静态存储：与 SWIFT_IMMORTAL_REFERENCE 语义一致
} // namespace

CppShape &makeDemoCircle() { return demoCircle; }

int roundedArea(const CppShape &shape) {
  return static_cast<int>(shape.area() + 0.5);   // 走虚派发后取整
}

int withDefaultArgument(int base, int delta) { return base + delta; }
