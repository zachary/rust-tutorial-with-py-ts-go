/**
 * todo 模块的核心逻辑.
 *
 * 对应 Rust 中的 src/todo/core.rs.
 */

import * as process from "node:process";

/** 对应 Cargo.toml 中的 version 字段, 由 clap 的 --version 输出. */
export const VERSION = "0.1.0";

/** 对应 #[command(version, about, long_about = "Todo Cli")]. */
export const ABOUT = "Todo Cli";

/**
 * 对应 Rust 中的 trait Serializer:
 *
 *     pub trait Serializer where Self: Sized + Serialize + for<'a> Deserialize<'a> {
 *         fn serialize(&self) -> String {
 *             serde_json::to_string(self).unwrap()
 *         }
 *
 *         fn deserialize<S: Into<String>>(s: S) -> Self {
 *             serde_json::from_str(&s.into()).unwrap()
 *         }
 *     }
 *
 * TypeScript 的 interface 只能声明类型, 无法提供默认实现, 因此这里使用抽象基类:
 * Rust 的 trait 默认方法对应基类的具体方法, Rust 的 impl Serializer for TodoItem {}
 * 对应 TypeScript 中的 extends.
 */
export abstract class Serializer {
    /** 对应 Serializer::serialize 的默认实现. */
    serialize(): string {
        // JSON.stringify 的输出与 serde_json::to_string 一致:
        // 紧凑格式 (逗号与冒号后没有空格), 且不转义非 ASCII 字符.
        return JSON.stringify(this);
    }
}

/** 对应 Rust 中的结构体 TodoItem 的字段. */
export interface TodoItemFields {
    title: string;
    content: string;
}

/** 对应 Rust 中的函数 create_todo_item. */
export function createTodoItem(title: string, content: string): TodoItem {
    return new TodoItem(title, content);
}

/**
 * 对应 Rust 中的结构体 TodoItem:
 *
 *     #[derive(Deserialize, Serialize)]
 *     pub struct TodoItem {
 *         pub title: String,
 *         pub content: String,
 *     }
 *
 * 以及 impl TodoItem 与 impl Serializer for TodoItem {}.
 */
export class TodoItem extends Serializer {
    /** 对应 pub title: String. */
    title: string;

    /** 对应 pub content: String. */
    content: string;

    constructor(title: string, content: string) {
        super();

        this.title = title;
        this.content = content;
    }

    /** 对应 TodoItem::new. */
    static new(title: string, content: string): TodoItem {
        return createTodoItem(title, content);
    }

    /** 对应 Serializer::deserialize. */
    static deserialize(raw: string): TodoItem {
        const fields = JSON.parse(raw) as TodoItemFields;

        return new TodoItem(fields.title, fields.content);
    }
}

/**
 * 对应 Rust 中的枚举变体:
 *
 *     #[derive(Debug, Clone, Subcommand)]
 *     pub enum TodoCommand {
 *         /// Create a new todo item
 *         Create {
 *             #[arg(short, long)]
 *             title: Option<String>,
 *             #[arg(short, long)]
 *             content: Option<String>,
 *         },
 *         /// List all todo items
 *         List {
 *             #[arg(short, long)]
 *             title: Option<String>,
 *             #[arg(short, long)]
 *             content: Option<String>,
 *         },
 *     }
 *
 * TypeScript 中没有枚举变体携带数据的语法, 惯用的做法是使用带判别字段的联合类型
 * (discriminated union): 每个变体是一个 interface, kind 字段即变体的名称.
 * Rust 的 Option<String> 对应 string | null, None 对应 null.
 */
export interface Create {
    /** Create a new todo item */
    kind: "create";
    title: string | null;
    content: string | null;
}

export interface List {
    /** List all todo items */
    kind: "list";
    title: string | null;
    content: string | null;
}

/** 对应枚举类型 TodoCommand 本身. */
export type TodoCommand = Create | List;

// 以下是命令行解析部分, 对应 clap 通过 #[derive(Subcommand)] / #[derive(Parser)]
// 自动生成的代码.

/** 对应 clap 中 --help 输出后以状态码 0 退出. */
export const EXIT_SUCCESS = 0;

/** 对应 clap 中参数错误时以状态码 2 退出. */
export const EXIT_FAILURE = 2;

export const USAGE_TEXT = "Usage: cli <COMMAND>\n";

/** 对应 clap 自动生成的顶层帮助信息 (long_about = "Todo Cli"). */
export const HELP_TEXT = `${ABOUT}

${USAGE_TEXT}
Commands:
  create  Create a new todo item
  list    List all todo items
  help    Print this message or the help of the given subcommand(s)

Options:
  -h, --help     Print help
  -V, --version  Print version
`;

export const CREATE_HELP_TEXT = `Create a new todo item

Usage: cli create [OPTIONS]

Options:
  -t, --title <TITLE>
  -c, --content <CONTENT>
  -h, --help               Print help
`;

export const LIST_HELP_TEXT = `List all todo items

Usage: cli list [OPTIONS]

Options:
  -t, --title <TITLE>
  -c, --content <CONTENT>
  -h, --help               Print help
`;

/**
 * 对应 Rust 中的结构体 Program (clap 的 Parser 派生):
 *
 *     #[derive(Debug, Parser)]
 *     #[command(version, about, long_about = "Todo Cli")]
 *     struct Program {
 *         #[command(subcommand)]
 *         pub command: TodoCommand,
 *     }
 */
export class Program {
    /** 对应 pub command: TodoCommand. */
    command: TodoCommand;

    constructor(command: TodoCommand) {
        this.command = command;
    }

    /** 对应 clap 的 Program::parse(). */
    static parse(args: string[] = process.argv.slice(2)): Program {
        return new Program(parseTodoCommand(args));
    }
}

/** 解析命令行参数, 对应 clap 为 Subcommand 生成的解析逻辑. */
export function parseTodoCommand(args: string[]): TodoCommand {
    if (args.length === 0) {
        exitWithError(
            "error: 'cli' requires a subcommand but one was not provided\n\n" +
                `${USAGE_TEXT}\nFor more information, try '--help'.\n`,
        );
    }

    const head = args[0];
    const rest = args.slice(1);

    switch (head) {
        case "-h":
        case "--help":
            process.stdout.write(HELP_TEXT);
            process.exit(EXIT_SUCCESS);
        case "-V":
        case "--version":
            process.stdout.write(`cli ${VERSION}\n`);
            process.exit(EXIT_SUCCESS);
        case "help":
            parseHelpCommand(rest);
    }

    switch (head) {
        case "create": {
            const { title, content } = parseFlags("create", rest);

            return { kind: "create", title, content };
        }
        case "list": {
            const { title, content } = parseFlags("list", rest);

            return { kind: "list", title, content };
        }
        default:
            return exitWithError(
                `error: unrecognized subcommand '${head}'\n\n` +
                    `${USAGE_TEXT}\nFor more information, try '--help'.\n`,
            );
    }
}

/** 对应 clap 中的 help 子命令. */
export function parseHelpCommand(args: string[]): never {
    if (args.length === 0) {
        process.stdout.write(HELP_TEXT);
        process.exit(EXIT_SUCCESS);
    }

    switch (args[0]) {
        case "create":
            process.stdout.write(CREATE_HELP_TEXT);
            break;
        case "list":
            process.stdout.write(LIST_HELP_TEXT);
            break;
        default:
            exitWithError(
                `error: unrecognized subcommand '${args[0]}'\n\n` +
                    `${USAGE_TEXT}\nFor more information, try '--help'.\n`,
            );
    }

    return process.exit(EXIT_SUCCESS);
}

/**
 * 解析子命令后面的参数.
 *
 * 对应 clap 为 #[arg(short, long)] 生成的解析逻辑,
 * 支持 -t / --title / --title=value 三种写法.
 */
export function parseFlags(
    command: string,
    args: string[],
): { title: string | null; content: string | null } {
    let title: string | null = null;
    let content: string | null = null;
    let index = 0;

    while (index < args.length) {
        const arg = args[index];

        if (arg === "-h" || arg === "--help") {
            process.stdout.write(command === "create" ? CREATE_HELP_TEXT : LIST_HELP_TEXT);
            process.exit(EXIT_SUCCESS);
        }

        const { name, value, hasValue } = splitFlag(arg);

        switch (name) {
            case "-t":
            case "-title":
            case "--title": {
                let flagValue = value;

                if (!hasValue) {
                    if (index + 1 >= args.length) {
                        exitWithError(
                            "error: a value is required for '--title <TITLE>' but none was supplied\n\n" +
                                "For more information, try '--help'.\n",
                        );
                    }

                    index += 1;
                    flagValue = args[index];
                }

                title = flagValue;
                break;
            }
            case "-c":
            case "-content":
            case "--content": {
                let flagValue = value;

                if (!hasValue) {
                    if (index + 1 >= args.length) {
                        exitWithError(
                            "error: a value is required for '--content <CONTENT>' but none was supplied\n\n" +
                                "For more information, try '--help'.\n",
                        );
                    }

                    index += 1;
                    flagValue = args[index];
                }

                content = flagValue;
                break;
            }
            default:
                exitWithError(
                    `error: unexpected argument '${arg}' found\n\n` +
                        `Usage: cli ${command} [OPTIONS]\n\nFor more information, try '--help'.\n`,
                );
        }

        index += 1;
    }

    return { title, content };
}

/** 拆分 --title=value 形式的参数, 没有等号时 hasValue 为 false. */
export function splitFlag(arg: string): { name: string; value: string; hasValue: boolean } {
    const separatorIndex = arg.indexOf("=");

    if (separatorIndex < 0) {
        return { name: arg, value: "", hasValue: false };
    }

    return {
        name: arg.slice(0, separatorIndex),
        value: arg.slice(separatorIndex + 1),
        hasValue: true,
    };
}

/** 输出错误信息并以状态码 2 退出, 对应 clap 的错误处理. */
function exitWithError(message: string): never {
    process.stderr.write(message);
    process.exit(EXIT_FAILURE);
}
