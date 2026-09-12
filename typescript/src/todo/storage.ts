/**
 * 数据持久化.
 *
 * 对应 Rust 中的 src/todo/storage.rs.
 */

import * as fs from "node:fs";
import { TodoItem, type TodoItemFields } from "./core.ts";

/**
 * 对应 serde 的反序列化: 字段缺失或类型不符时视为解析失败.
 *
 * TypeScript 的类型在运行时会被擦除, 因此需要显式校验,
 * 才能像 serde_json::from_str 那样在数据不合法时返回错误.
 */
function toTodoItem(value: unknown): TodoItem {
    const fields = value as Partial<TodoItemFields>;

    if (typeof fields?.title !== "string" || typeof fields?.content !== "string") {
        throw new TypeError("invalid todo item");
    }

    return new TodoItem(fields.title, fields.content);
}

/**
 * 对应 Rust 中的 read_todo_list.
 *
 * 注意: 与 Rust 版本一致, 读取失败时只向标准输出打印错误, 而不是向上传递错误.
 */
export function readTodoList(saveFile: string): TodoItem[] {
    const result: TodoItem[] = [];

    // 对应 Rust 中的:
    //
    //     match fs::read_to_string(save_file) {
    //         Ok(content) => match serde_json::from_str(content.as_str()) { ... },
    //         _ => println!("read file error"),
    //     }
    let content: string | null = null;

    try {
        content = fs.readFileSync(saveFile, "utf8");
    } catch {
        console.log("read file error");
    }

    if (content !== null) {
        try {
            // 对应 serde_json::from_str
            const list = JSON.parse(content) as unknown[];
            result.push(...list.map((value) => toTodoItem(value)));
        } catch {
            console.log("parse file error");
        }
    }

    // 如果没有读取到任何数据, 提供默认示例
    if (result.length === 0) {
        result.push(TodoItem.new("learn rust", "read rust book"));
        result.push(TodoItem.new("work", "complete required"));
        result.push(TodoItem.new("play", "play game"));
    }

    return result;
}

/**
 * 对应 Rust 中的 save_todo_list, 返回 Result<(), String>.
 *
 * TypeScript 中没有 Result, 与 Python 版本一致, 错误通过抛出异常表达.
 */
export function saveTodoList(saveFile: string, todos: TodoItem[]): void {
    // 对应 serde_json::to_string(todos)
    const data = JSON.stringify(todos);

    // 对应 fs::write(save_file, data)
    fs.writeFileSync(saveFile, data, "utf8");
}
