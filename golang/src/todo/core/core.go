package core

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

// Version 对应 Cargo.toml 中的 version 字段, 由 clap 的 --version 输出.
const Version = "0.1.0"

// About 对应 #[command(version, about, long_about = "Todo Cli")].
const About = "Todo Cli"

// Command 表示 TodoCommand 的枚举变体.
//
// Rust 中的枚举:
//
//	#[derive(Debug, Clone, Subcommand)]
//	pub enum TodoCommand {
//	    Create { title: Option<String>, content: Option<String> },
//	    List { title: Option<String>, content: Option<String> },
//	}
//
// Go 没有枚举, 因此使用具名常量来表示变体.
type Command string

const (
	// Create 对应 TodoCommand::Create.
	Create Command = "create"
	// List 对应 TodoCommand::List.
	List Command = "list"
)

// TodoCommand 对应 Rust 中的枚举 TodoCommand (clap 的 Subcommand 派生).
//
// Rust 的枚举变体可以直接携带数据, Go 中没有枚举, 因此使用 Command 字段
// 表示当前是哪个变体, 其余字段表示变体携带的数据.
// Rust 的 Option<String> 对应 Go 中的 *string, None 对应 nil.
type TodoCommand struct {
	// Command 对应枚举变体的名称.
	Command Command
	// Title 对应 #[arg(short, long)] title: Option<String>.
	Title *string
	// Content 对应 #[arg(short, long)] content: Option<String>.
	Content *string
}

// TodoItem 对应 Rust 中的结构体 TodoItem.
//
//	#[derive(Deserialize, Serialize)]
//	pub struct TodoItem {
//	    pub title: String,
//	    pub content: String,
//	}
type TodoItem struct {
	// Title 对应 pub title: String, json 标签对应 serde 的字段名.
	Title string `json:"title"`
	// Content 对应 pub content: String.
	Content string `json:"content"`
}

// CreateTodoItem 对应 Rust 中的函数 create_todo_item.
func CreateTodoItem(title string, content string) TodoItem {
	return TodoItem{
		Title:   title,
		Content: content,
	}
}

// NewTodoItem 对应 Rust 中的 TodoItem::new, 内部调用 create_todo_item.
func NewTodoItem(title string, content string) TodoItem {
	return CreateTodoItem(title, content)
}

// Serializer 对应 Rust 中的 trait Serializer.
//
//	pub trait Serializer where Self: Sized + Serialize + Deserialize {
//	    fn serialize(&self) -> String { ... }
//	    fn deserialize<S: Into<String>>(s: S) -> Self { ... }
//	}
//
// Rust 的 trait 可以为类型提供默认实现, Go 的接口不能, 因此接口只用来约束
// 类型, 默认实现放在下面的泛型函数里. Rust 的 impl Serializer for TodoItem {}
// 对应 Go 中的类型断言 var _ Serializer = TodoItem{}.
type Serializer interface {
	// Serialize 将当前实例转换为 JSON 字符串.
	Serialize() string
}

// impl Serializer for TodoItem {}
var _ Serializer = TodoItem{}

// Deserialize 对应 Serializer::deserialize.
//
// Rust: fn deserialize<S: Into<String>>(s: S) -> Self
// Go 无法从返回值推断类型, 因此需要显式指定泛型参数, 例如 Deserialize[TodoItem](s).
func Deserialize[T any](s string) T {
	var item T

	// 对应 serde_json::from_str(&s.into()).unwrap()
	if err := json.Unmarshal([]byte(s), &item); err != nil {
		panic(err)
	}

	return item
}

// Serialize 对应 Serializer::serialize.
func (item TodoItem) Serialize() string {
	// 对应 serde_json::to_string(self).unwrap()
	data, err := json.Marshal(item)
	if err != nil {
		panic(err)
	}

	return string(data)
}

// 以下为命令行解析部分, 对应 clap 通过 #[derive(Subcommand)] / #[derive(Parser)]
// 自动生成的代码.

// ErrHelpShown 表示帮助或版本信息已经输出, 程序应当以状态码 0 退出.
// 对应 clap 中 --help / --version 的行为.
var ErrHelpShown = errors.New("help shown")

const usageText = "Usage: cli <COMMAND>\n"

// helpText 对应 clap 自动生成的顶层帮助信息 (long_about = "Todo Cli").
const helpText = About + `

` + usageText + `
Commands:
  create  Create a new todo item
  list    List all todo items
  help    Print this message or the help of the given subcommand(s)

Options:
  -h, --help     Print help
  -V, --version  Print version
`

const createHelpText = `Create a new todo item

Usage: cli create [OPTIONS]

Options:
  -t, --title <TITLE>
  -c, --content <CONTENT>
  -h, --help               Print help
`

const listHelpText = `List all todo items

Usage: cli list [OPTIONS]

Options:
  -t, --title <TITLE>
  -c, --content <CONTENT>
  -h, --help               Print help
`

// ParseTodoCommand 对应 clap 为 Program::parse() 生成的子命令解析逻辑.
//
// 与 clap 保持一致: --help / --version 打印信息并返回 ErrHelpShown,
// 参数错误则返回 error 由调用方输出并以状态码 2 退出.
func ParseTodoCommand(args []string) (TodoCommand, error) {
	if len(args) == 0 {
		return TodoCommand{}, fmt.Errorf(
			"error: 'cli' requires a subcommand but one was not provided\n\n%s\nFor more information, try '--help'.\n",
			usageText,
		)
	}

	switch args[0] {
	case "-h", "--help":
		fmt.Print(helpText)
		return TodoCommand{}, ErrHelpShown
	case "-V", "--version":
		fmt.Printf("cli %s\n", Version)
		return TodoCommand{}, ErrHelpShown
	case "help":
		return parseHelpCommand(args[1:])
	}

	var command Command

	switch args[0] {
	case string(Create):
		command = Create
	case string(List):
		command = List
	default:
		return TodoCommand{}, fmt.Errorf(
			"error: unrecognized subcommand '%s'\n\n%s\nFor more information, try '--help'.\n",
			args[0], usageText,
		)
	}

	return parseSubCommand(command, args[1:])
}

// parseHelpCommand 对应 clap 中的 help 子命令.
func parseHelpCommand(args []string) (TodoCommand, error) {
	if len(args) == 0 {
		fmt.Print(helpText)
		return TodoCommand{}, ErrHelpShown
	}

	switch args[0] {
	case string(Create):
		fmt.Print(createHelpText)
	case string(List):
		fmt.Print(listHelpText)
	default:
		return TodoCommand{}, fmt.Errorf(
			"error: unrecognized subcommand '%s'\n\n%s\nFor more information, try '--help'.\n",
			args[0], usageText,
		)
	}

	return TodoCommand{}, ErrHelpShown
}

// parseSubCommand 解析某个子命令后面的参数.
//
// 对应 clap 为 #[arg(short, long)] 生成的解析逻辑, 支持
// -t / --title / --title=value 三种写法.
func parseSubCommand(command Command, args []string) (TodoCommand, error) {
	result := TodoCommand{Command: command}

	for index := 0; index < len(args); index++ {
		arg := args[index]

		if arg == "-h" || arg == "--help" {
			printCommandHelp(command)
			return TodoCommand{}, ErrHelpShown
		}

		name, value, hasValue := splitFlag(arg)

		switch name {
		case "-t", "-title", "--title":
			if !hasValue {
				if index+1 >= len(args) {
					return TodoCommand{}, fmt.Errorf(
						"error: a value is required for '--title <TITLE>' but none was supplied\n\nFor more information, try '--help'.\n",
					)
				}

				index++
				value = args[index]
			}

			result.Title = &value
		case "-c", "-content", "--content":
			if !hasValue {
				if index+1 >= len(args) {
					return TodoCommand{}, fmt.Errorf(
						"error: a value is required for '--content <CONTENT>' but none was supplied\n\nFor more information, try '--help'.\n",
					)
				}

				index++
				value = args[index]
			}

			result.Content = &value
		default:
			return TodoCommand{}, fmt.Errorf(
				"error: unexpected argument '%s' found\n\nUsage: cli %s [OPTIONS]\n\nFor more information, try '--help'.\n",
				arg, command,
			)
		}
	}

	return result, nil
}

// printCommandHelp 输出指定子命令的帮助信息.
func printCommandHelp(command Command) {
	if command == Create {
		fmt.Print(createHelpText)
		return
	}

	fmt.Print(listHelpText)
}

// splitFlag 拆分 --title=value 形式的参数, 没有等号时 hasValue 为 false.
func splitFlag(arg string) (name string, value string, hasValue bool) {
	index := strings.Index(arg, "=")

	if index < 0 {
		return arg, "", false
	}

	return arg[:index], arg[index+1:], true
}
