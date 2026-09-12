"""数据持久化, 对应 Rust 中的 src/todo/storage.rs."""

import json
from dataclasses import asdict

from .core import TodoItem


def read_todo_list(save_file: str) -> list[TodoItem]:
    """对应 Rust 中的 read_todo_list.

    注意: 与 Rust 版本一致, 读取失败时只向标准输出打印错误, 而不是向上传递错误.
    """
    result: list[TodoItem] = []

    # 对应 Rust 中的:
    #
    #     match fs::read_to_string(save_file) {
    #         Ok(content) => match serde_json::from_str(content.as_str()) { ... },
    #         _ => println!("read file error"),
    #     }
    try:
        with open(save_file, encoding="utf-8") as file:
            content = file.read()
    except OSError:
        print("read file error")
    else:
        try:
            # 对应 serde_json::from_str, 逐个构造 TodoItem 以保持字段校验
            result = [TodoItem(**item) for item in json.loads(content)]
        except (json.JSONDecodeError, TypeError):
            print("parse file error")

    # 如果没有读取到任何数据, 提供默认示例
    if len(result) == 0:
        result.append(TodoItem.new("learn rust", "read rust book"))
        result.append(TodoItem.new("work", "complete required"))
        result.append(TodoItem.new("play", "play game"))

    return result


def save_todo_list(save_file: str, todos: list[TodoItem]) -> None:
    """对应 Rust 中的 save_todo_list, 返回 Result<(), String>.

    Python 中没有 Result, 错误通过抛出 OSError 表达, 由调用方处理
    (对应 Rust 中的 map_err(|e| e.to_string())).
    """
    # 对应 serde_json::to_string(todos), 保持与 Rust 相同的紧凑 JSON 输出
    data = json.dumps(
        [asdict(todo) for todo in todos],
        separators=(",", ":"),
        ensure_ascii=False,
    )

    # 对应 fs::write(save_file, data)
    with open(save_file, "w", encoding="utf-8") as file:
        file.write(data)
