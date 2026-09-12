/**
 * 程序入口.
 *
 * 对应 Rust 中的 src/main.rs.
 */

import * as todo from "./todo/todo.ts";
import { Program } from "./todo/core.ts";
import { readTodoList, saveTodoList } from "./todo/storage.ts";

/** 对应 Rust 中的 fn main(). */
function main(): void {
    // 对应 let args = Program::parse();
    const program = Program.parse();

    const saveFile = "todo.json";
    const todos = readTodoList(saveFile);

    const command = program.command;

    // 对应 Rust 中的:
    //
    //     match args.command {
    //         TodoCommand::Create { title, content } => todo::create::create_todo(&mut todos, title, content),
    //         TodoCommand::List { title, content } => todo::list::list_todo(&todos, title, content),
    //     }
    switch (command.kind) {
        case "create": {
            const { title, content } = command;

            todo.create.createTodo(todos, title, content);
            break;
        }
        case "list": {
            const { title, content } = command;

            todo.list.listTodo(todos, title, content);
            break;
        }
    }

    // 对应 save_todo_list(save_file, &todos);
    try {
        saveTodoList(saveFile, todos);
    } catch (error) {
        console.log(error);
    }
}

main();
