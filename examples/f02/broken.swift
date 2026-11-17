// F02 broken —— typed throws 之后，错误类型成为签名的一部分：
// 把 throws(ParseError) 的闭包传给要求 throws(AuthError) 的参数会直接编译失败。
enum ParseError: Error { case badSyntax }
enum AuthError: Error { case denied }

func parse() throws(ParseError) -> Int { throw ParseError.badSyntax }

func register(_ handler: () throws(AuthError) -> Void) {}

// 参数要求抛 AuthError，而 parse() 抛的是 ParseError：
// error: invalid conversion of thrown error type 'any Error' to 'AuthError'
register { try parse() }
