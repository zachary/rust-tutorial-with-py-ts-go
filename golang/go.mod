// 对应 Rust 项目中的 Cargo.toml
//
//	name = "cli"
//	version = "0.1.0"
//	edition = "2021"
//
// Rust 依赖的 clap / serde / serde_json 在 Go 中由标准库的
// 参数解析与 encoding/json 替代, 因此这里没有任何第三方依赖.
//
// 需要 go 1.27 及以上: list.TodoItemFilter 中的泛型方法对应 Rust 的
// set_title<T: Into<String>>, 而 Go 1.27 才开始支持泛型方法.
module cli

go 1.27
