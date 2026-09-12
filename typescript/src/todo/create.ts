/**
 * create 子命令.
 *
 * 对应 Rust 中的 src/todo/create.rs.
 */

import * as fs from "node:fs";
import { TodoItem } from "./core.ts";

/** 每次从标准输入读取的字节数. */
const STDIN_CHUNK_SIZE = 1024;

/**
 * 对应 Rust 中的 std::io::stdin().
 *
 * Rust 的 read_line 是阻塞的按行读取, 而 Node 中读取标准输入通常是异步的,
 * 为了保持 create_todo 的同步流程, 这里使用 fs.readSync 并自行维护缓冲区.
 */
class Stdin {
    private buffer: Buffer = Buffer.alloc(0);
    private eof = false;

    /**
     * 对应 std::io::stdin().read_line(&mut buf).
     *
     * 与 Rust 一致, 返回的内容包含行尾的换行符; 读取到结尾时返回剩余内容,
     * 若已经没有内容可读则抛出异常 (对应 .expect("read line failed")).
     */
    readLine(): string {
        for (;;) {
            const newlineIndex = this.buffer.indexOf("\n");

            if (newlineIndex >= 0) {
                const line = this.buffer.subarray(0, newlineIndex + 1);
                this.buffer = this.buffer.subarray(newlineIndex + 1);

                return line.toString("utf8");
            }

            if (this.eof) {
                if (this.buffer.length > 0) {
                    const rest = this.buffer.toString("utf8");
                    this.buffer = Buffer.alloc(0);

                    return rest;
                }

                // Rust 中 read_line 在读取到结尾时返回 0 字节, 那会让 while 循环一直空转;
                // 这里改为抛出异常, 与 .expect("read line failed") 的失败行为一致.
                throw new Error("read line failed");
            }

            const chunk = Buffer.alloc(STDIN_CHUNK_SIZE);
            const bytes = fs.readSync(0, chunk, 0, chunk.length, null);

            if (bytes === 0) {
                this.eof = true;
            } else {
                this.buffer = Buffer.concat([this.buffer, chunk.subarray(0, bytes)]);
            }
        }
    }
}

/** 对应 Rust 中每次调用 std::io::stdin() 获取的标准输入. */
const stdin = new Stdin();

/** 对应 Rust 中读取一行输入的几行代码. */
function readLine(): string {
    return stdin.readLine();
}

/**
 * 对应 Rust 中的 create_todo.
 *
 * Rust 中的 todos: &mut Vec<TodoItem> 表示可变借用列表,
 * TypeScript 中的数组是引用类型, 传入后原地修改即可达到相同效果.
 * Option<String> 对应 string | null, None 对应 null.
 */
export function createTodo(
    todos: TodoItem[],
    title: string | null,
    content: string | null,
): void {
    const inputs: string[] = [];

    // 对应 Rust 中的 if let Some(arg_title) = title { if !arg_title.is_empty() { ... } }
    if (title !== null) {
        if (title !== "") {
            inputs.push(title);
        }
    }

    if (content !== null) {
        if (content !== "") {
            inputs.push(content);
        }
    }

    let ok = inputs.length === 0;

    // 对应 Rust 中的 while ok { ... }
    while (ok) {
        const length = inputs.length;

        if (length === 0) {
            console.log("Please input todo title");

            // 与 Rust 一样遮蔽外层的参数 title
            const title = readLine();

            if (title === "") {
                continue;
            }

            inputs.push(title.trim());
        } else if (length === 1) {
            console.log("Please input todo content");

            // 与 Rust 一样遮蔽外层的参数 content
            const content = readLine();

            if (content === "") {
                continue;
            }

            inputs.push(content.trim());
        } else {
            console.log(`title:   [${inputs[0]}]`);
            console.log(`content: [${inputs[1]}]`);
            console.log("Are you sure to create this todo? (y/n)");

            const sure = readLine();

            if (sure.trim().toLowerCase() !== "n") {
                ok = false;
            } else {
                // 对应 Rust 中的 inputs.clear()
                inputs.length = 0;
            }
        }
    }

    const inputsLength = inputs.length;

    const todoTitle = inputsLength > 0 ? inputs[0] : "default title";
    const todoContent = inputsLength > 1 ? inputs[1] : "default content";

    console.log(`create todo title: ${todoTitle}, content: ${todoContent}`);

    todos.push(TodoItem.new(todoTitle, todoContent));
}
