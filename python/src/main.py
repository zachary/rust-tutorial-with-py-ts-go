"""程序入口, 对应 Rust 中的 src/main.rs."""

import todo
from todo.core import Create, List, Program
from todo.storage import read_todo_list, save_todo_list


def main() -> None:
    """对应 Rust 中的 fn main()."""
    # 对应 let args = Program::parse();
    program = Program.parse()

    save_file = "todo.json"
    todos = read_todo_list(save_file)

    # 对应 Rust 中的:
    #
    #     match args.command {
    #         TodoCommand::Create { title, content } => todo::create::create_todo(&mut todos, title, content),
    #         TodoCommand::List { title, content } => todo::list::list_todo(&todos, title, content),
    #     }
    match program.command:
        case Create(title=title, content=content):
            todo.create.create_todo(todos, title, content)
        case List(title=title, content=content):
            todo.list.list_todo(todos, title, content)

    # 对应 save_todo_list(save_file, &todos);
    try:
        save_todo_list(save_file, todos)
    except OSError as error:
        print(error)


if __name__ == "__main__":
    main()
