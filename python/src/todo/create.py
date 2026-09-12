"""create 子命令, 对应 Rust 中的 src/todo/create.rs."""

from .core import TodoItem


def read_line() -> str:
    """对应 Rust 中的 std::io::stdin().read_line(&mut buf).

    Rust 的 read_line 会把行尾的换行符一并读入, Python 的 input() 不会,
    因此这里直接返回不带换行符的一行内容, 由调用方使用 strip() 对应 trim().
    读取失败时 expect("read line failed") 会 panic, 这里以异常保持一致.
    """
    try:
        return input()
    except EOFError as error:
        raise RuntimeError("read line failed") from error


def create_todo(todos: list[TodoItem], title: str | None, content: str | None) -> None:
    """对应 Rust 中的 create_todo.

    Rust 中的 todos: &mut Vec<TodoItem> 表示可变借用列表,
    Python 中的列表是可变对象, 传入后原地修改即可达到相同效果.
    Option<String> 对应 str | None, None 即 None.
    """
    inputs: list[str] = []

    # 对应 Rust 中的 if let Some(arg_title) = title { if !arg_title.is_empty() { ... } }
    if title is not None:
        if title != "":
            inputs.append(title)

    if content is not None:
        if content != "":
            inputs.append(content)

    ok = len(inputs) == 0

    # 对应 Rust 中的 while ok { ... }
    while ok:
        length = len(inputs)

        if length == 0:
            print("Please input todo title")

            title = read_line()

            if title == "":
                continue

            inputs.append(title.strip())
        elif length == 1:
            print("Please input todo content")

            content = read_line()

            if content == "":
                continue

            inputs.append(content.strip())
        else:
            print(f"title:   [{inputs[0]}]")
            print(f"content: [{inputs[1]}]")
            print("Are you sure to create this todo? (y/n)")

            sure = read_line()

            if sure.strip().lower() != "n":
                ok = False
            else:
                inputs.clear()

    inputs_len = len(inputs)

    # Rust 中这里通过 let 遮蔽了参数 title, Python 中直接复用同名变量即可,
    # 但为避免与上面的参数混淆, 使用新的变量名.
    todo_title = inputs[0] if inputs_len > 0 else "default title"
    todo_content = inputs[1] if inputs_len > 1 else "default content"

    print(f"create todo title: {todo_title}, content: {todo_content}")

    todos.append(TodoItem.new(todo_title, todo_content))
