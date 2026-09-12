"""todo 模块的核心逻辑.

对应 Rust 中的 src/todo/core.rs.
"""

from __future__ import annotations

import json
import sys
import unittest
from abc import ABC
from dataclasses import asdict, dataclass
from typing import Self

# 对应 Cargo.toml 中的 version 字段, 由 clap 的 --version 输出.
VERSION = "0.1.0"

# 对应 #[command(version, about, long_about = "Todo Cli")].
ABOUT = "Todo Cli"


# 对应 Rust 中的 trait Serializer:
#
#     pub trait Serializer where Self: Sized + Serialize + for<'a> Deserialize<'a> {
#         fn serialize(&self) -> String {
#             serde_json::to_string(self).unwrap()
#         }
#
#         fn deserialize<S: Into<String>>(s: S) -> Self {
#             serde_json::from_str(&s.into()).unwrap()
#         }
#     }
#
# Rust 的 trait 可以为类型提供默认实现, 对应 Python 中的抽象基类 (ABC);
# Rust 的 impl Serializer for TodoItem {} 对应 Python 中的继承.
#
# 注意: Rust 中类型与实现的声明顺序无关, Python 中父类必须先定义, 因此这里
# 将 trait 放在结构体之前.
class Serializer(ABC):
    def serialize(self) -> str:
        """对应 Serializer::serialize.

        serde_json::to_string 输出紧凑且不转义非 ASCII 字符的 JSON,
        这里使用相同的分隔符与 ensure_ascii=False 保持一致.
        """
        return json.dumps(asdict(self), separators=(",", ":"), ensure_ascii=False)

    @classmethod
    def deserialize(cls: type[Self], raw: str) -> Self:
        """对应 Serializer::deserialize.

        Rust 中通过 S: Into<String> 泛型简化调用, Python 天然支持鸭子类型,
        因此这里直接接收字符串.
        """
        return cls(**json.loads(raw))


# 对应 Rust 中的函数 create_todo_item.
def create_todo_item(title: str, content: str) -> TodoItem:
    return TodoItem(title=title, content=content)


# 对应 Rust 中的:
#
#     #[derive(Deserialize, Serialize)]
#     pub struct TodoItem {
#         pub title: String,
#         pub content: String,
#     }
#
# Rust 的结构体与 Python 的 dataclass 一一对应, serde 的派生宏对应 dataclass
# 自动生成的 __init__ / __eq__ / __repr__, 字段名与 JSON 的键名保持一致.
@dataclass
class TodoItem(Serializer):
    title: str
    content: str

    # 对应 impl TodoItem 中的 new:
    #
    #     pub fn new(title: &str, content: &str) -> Self {
    #         create_todo_item(title, content)
    #     }
    @classmethod
    def new(cls, title: str, content: str) -> Self:
        return create_todo_item(title, content)


# 以下是命令行解析部分, 对应 clap 通过 #[derive(Subcommand)] / #[derive(Parser)]
# 自动生成的代码.

# 对应 clap 中 --help 输出后以状态码 0 退出, 参数错误则以状态码 2 退出.
EXIT_SUCCESS = 0
EXIT_FAILURE = 2

USAGE_TEXT = "Usage: cli <COMMAND>\n"

# 对应 clap 自动生成的顶层帮助信息 (long_about = "Todo Cli").
HELP_TEXT = (
    ABOUT
    + "\n\n"
    + USAGE_TEXT
    + """
Commands:
  create  Create a new todo item
  list    List all todo items
  help    Print this message or the help of the given subcommand(s)

Options:
  -h, --help     Print help
  -V, --version  Print version
"""
)

CREATE_HELP_TEXT = """Create a new todo item

Usage: cli create [OPTIONS]

Options:
  -t, --title <TITLE>
  -c, --content <CONTENT>
  -h, --help               Print help
"""

LIST_HELP_TEXT = """List all todo items

Usage: cli list [OPTIONS]

Options:
  -t, --title <TITLE>
  -c, --content <CONTENT>
  -h, --help               Print help
"""


# 对应 Rust 中的枚举变体:
#
#     #[derive(Debug, Clone, Subcommand)]
#     pub enum TodoCommand {
#         /// Create a new todo item
#         Create {
#             #[arg(short, long)]
#             title: Option<String>,
#             #[arg(short, long)]
#             content: Option<String>,
#         },
#         /// List all todo items
#         List {
#             #[arg(short, long)]
#             title: Option<String>,
#             #[arg(short, long)]
#             content: Option<String>,
#         },
#     }
#
# Rust 的枚举变体可以携带数据, Python 中用一个 dataclass 表示一个变体,
# 再用联合类型表示整个枚举; Option<String> 对应 str | None.
@dataclass
class Create:
    """Create a new todo item"""

    title: str | None = None
    content: str | None = None


@dataclass
class List:
    """List all todo items"""

    title: str | None = None
    content: str | None = None


# 对应枚举类型 TodoCommand 本身.
TodoCommand = Create | List


# 对应 Rust 中的结构体 Program (clap 的 Parser 派生):
#
#     #[derive(Debug, Parser)]
#     #[command(version, about, long_about = "Todo Cli")]
#     struct Program {
#         #[command(subcommand)]
#         pub command: TodoCommand,
#     }
class Program:
    def __init__(self, command: TodoCommand) -> None:
        self.command = command

    @classmethod
    def parse(cls: type[Self], args: list[str] | None = None) -> Self:
        """对应 clap 的 Program::parse()."""
        argv = sys.argv[1:] if args is None else args

        return cls(parse_todo_command(argv))


def parse_todo_command(args: list[str]) -> TodoCommand:
    """解析命令行参数, 对应 clap 为 Subcommand 生成的解析逻辑."""
    if not args:
        error(
            "error: 'cli' requires a subcommand but one was not provided\n\n"
            f"{USAGE_TEXT}\nFor more information, try '--help'.\n"
        )

    head, rest = args[0], args[1:]

    match head:
        case "-h" | "--help":
            # 帮助文本本身以换行结尾, 因此使用 write 而不是 print, 与 clap 的输出保持一致
            sys.stdout.write(HELP_TEXT)
            raise SystemExit(EXIT_SUCCESS)
        case "-V" | "--version":
            print(f"cli {VERSION}")
            raise SystemExit(EXIT_SUCCESS)
        case "help":
            parse_help_command(rest)

    match head:
        case "create":
            title, content = parse_flags("create", rest)
            return Create(title=title, content=content)
        case "list":
            title, content = parse_flags("list", rest)
            return List(title=title, content=content)
        case _:
            error(
                f"error: unrecognized subcommand '{head}'\n\n"
                f"{USAGE_TEXT}\nFor more information, try '--help'.\n"
            )


def parse_help_command(args: list[str]) -> None:
    """对应 clap 中的 help 子命令."""
    if not args:
        sys.stdout.write(HELP_TEXT)
        raise SystemExit(EXIT_SUCCESS)

    match args[0]:
        case "create":
            sys.stdout.write(CREATE_HELP_TEXT)
        case "list":
            sys.stdout.write(LIST_HELP_TEXT)
        case _:
            error(
                f"error: unrecognized subcommand '{args[0]}'\n\n"
                f"{USAGE_TEXT}\nFor more information, try '--help'.\n"
            )

    raise SystemExit(EXIT_SUCCESS)


def parse_flags(command: str, args: list[str]) -> tuple[str | None, str | None]:
    """解析子命令后面的参数.

    对应 clap 为 #[arg(short, long)] 生成的解析逻辑,
    支持 -t / --title / --title=value 三种写法.
    """
    title: str | None = None
    content: str | None = None
    index = 0

    while index < len(args):
        arg = args[index]

        match arg:
            case "-h" | "--help":
                sys.stdout.write(CREATE_HELP_TEXT if command == "create" else LIST_HELP_TEXT)
                raise SystemExit(EXIT_SUCCESS)

        name, value, has_value = split_flag(arg)

        match name:
            case "-t" | "-title" | "--title":
                if not has_value:
                    if index + 1 >= len(args):
                        error(
                            "error: a value is required for '--title <TITLE>' but none was supplied\n\n"
                            "For more information, try '--help'.\n"
                        )

                    index += 1
                    value = args[index]

                title = value
            case "-c" | "-content" | "--content":
                if not has_value:
                    if index + 1 >= len(args):
                        error(
                            "error: a value is required for '--content <CONTENT>' but none was supplied\n\n"
                            "For more information, try '--help'.\n"
                        )

                    index += 1
                    value = args[index]

                content = value
            case _:
                error(
                    f"error: unexpected argument '{arg}' found\n\n"
                    f"Usage: cli {command} [OPTIONS]\n\nFor more information, try '--help'.\n"
                )

        index += 1

    return title, content


def split_flag(arg: str) -> tuple[str, str, bool]:
    """拆分 --title=value 形式的参数, 没有等号时 has_value 为 False."""
    name, separator, value = arg.partition("=")

    if not separator:
        return arg, "", False

    return name, value, True


def error(message: str) -> None:
    """输出错误信息并以状态码 2 退出, 对应 clap 的错误处理."""
    print(message, end="", file=sys.stderr)
    raise SystemExit(EXIT_FAILURE)


# 对应 Rust 中的:
#
#     #[cfg(test)]
#     mod tests {
#         use super::{Serializer, TodoItem};
#         ...
#     }
#
# Python 的测试同样可以与源码写在同一文件中, 因此这里保持相同的文件结构.
#
# 运行测试 (在 python 目录下):
#     python3 src/todo/core.py
#     PYTHONPATH=src python3 -m unittest todo.core
class TodoItemTest(unittest.TestCase):
    # 对应 Rust 中的 test_todo_item_creation.
    def test_todo_item_creation(self) -> None:
        item = TodoItem.new("test", "content")

        self.assertEqual(item.title, "test")
        self.assertEqual(item.content, "content")

    # 对应 Rust 中的 test_serialization_roundtrip.
    def test_serialization_roundtrip(self) -> None:
        original = TodoItem.new("test", "content")
        serialized = original.serialize()
        deserialized = TodoItem.deserialize(serialized)

        self.assertEqual(original.title, deserialized.title)
        self.assertEqual(original.content, deserialized.content)


if __name__ == "__main__":
    unittest.main()
