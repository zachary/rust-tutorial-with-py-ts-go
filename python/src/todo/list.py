"""list 子命令, 对应 Rust 中的 src/todo/list.rs."""

from .core import TodoItem


# 对应 Rust 中的结构体 TodoItemFilter.
class TodoItemFilter:
    def __init__(self) -> None:
        # 对应 Rust 中的:
        #     Self { title: Option::None, content: Option::None }
        self.title: str | None = None
        self.content: str | None = None

    # 对应 Rust 中的 set_title<T: Into<String>>.
    # Python 中没有泛型约束, 字符串天然可以互相转换, 因此直接接收 str.
    def set_title(self, title: str) -> None:
        self.title = title

    # 对应 Rust 中的 set_content<T: Into<String>>.
    def set_content(self, content: str) -> None:
        self.content = content

    # 对应 Rust 中的 TodoItemFilter::filter.
    # Rust 中的参数名为 list, 为不遮蔽 Python 内置的 list 而重命名为 todos.
    def filter(self, todos: list[TodoItem]) -> None:
        filtered_list: list[TodoItem] = []

        if self.title is None and self.content is None:
            for item in todos:
                filtered_list.append(item)
        else:
            for item in todos:
                # 对应 Rust 中的 let mut flag: (bool, bool) = (false, false);
                # Python 中的元组不可变, 因此使用列表模拟, 下标与元组的 .0 / .1 一一对应.
                flag = [False, False]

                if self.title is not None:
                    flag[0] = self.title in item.title
                else:
                    flag[0] = True

                if self.content is not None:
                    flag[1] = self.content in item.content
                else:
                    flag[1] = True

                if flag[0] and flag[1]:
                    filtered_list.append(item)

        for item in filtered_list:
            print(f"todo title: {item.title}, content: {item.content}")


def list_todo(todos: list[TodoItem], title: str | None, content: str | None) -> None:
    """对应 Rust 中的 list_todo."""
    # Rust 中的变量名为 filter, 为不遮蔽 Python 内置的 filter 而重命名为 item_filter.
    item_filter = TodoItemFilter()

    # 对应 Rust 中的 if let Some(title) = title { filter.set_title(title); }
    if title is not None:
        item_filter.set_title(title)

    if content is not None:
        item_filter.set_content(content)

    item_filter.filter(todos)
