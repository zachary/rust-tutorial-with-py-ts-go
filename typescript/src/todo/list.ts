/**
 * list 子命令.
 *
 * 对应 Rust 中的 src/todo/list.rs.
 */

import { TodoItem } from "./core.ts";

/** 对应 Rust 中的结构体 TodoItemFilter. */
export class TodoItemFilter {
    /** 对应 pub title: Option<String>. */
    title: string | null;

    /** 对应 pub content: Option<String>. */
    content: string | null;

    /** 对应 TodoItemFilter::new, TypeScript 中由构造函数承担. */
    constructor() {
        this.title = null;
        this.content = null;
    }

    /** 对应 set_title<T: Into<String>>. */
    setTitle(title: string): void {
        this.title = title;
    }

    /** 对应 set_content<T: Into<String>>. */
    setContent(content: string): void {
        this.content = content;
    }

    /** 对应 TodoItemFilter::filter. TypeScript 中可以直接沿用 Rust 的参数名 list. */
    filter(list: TodoItem[]): void {
        const filteredList: TodoItem[] = [];

        if (this.title === null && this.content === null) {
            for (const item of list) {
                filteredList.push(item);
            }
        } else {
            for (const item of list) {
                // 对应 Rust 中的 let mut flag: (bool, bool) = (false, false);
                const flag: [boolean, boolean] = [false, false];

                if (this.title === null) {
                    flag[0] = true;
                } else {
                    flag[0] = item.title.includes(this.title);
                }

                if (this.content === null) {
                    flag[1] = true;
                } else {
                    flag[1] = item.content.includes(this.content);
                }

                if (flag[0] && flag[1]) {
                    filteredList.push(item);
                }
            }
        }

        for (const item of filteredList) {
            console.log(`todo title: ${item.title}, content: ${item.content}`);
        }
    }
}

/** 对应 Rust 中的 list_todo. */
export function listTodo(
    todos: TodoItem[],
    title: string | null,
    content: string | null,
): void {
    const filter = new TodoItemFilter();

    // 对应 Rust 中的 if let Some(title) = title { filter.set_title(title); }
    if (title !== null) {
        filter.setTitle(title);
    }

    if (content !== null) {
        filter.setContent(content);
    }

    filter.filter(todos);
}
