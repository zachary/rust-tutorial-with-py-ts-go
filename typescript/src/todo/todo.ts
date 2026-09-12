/**
 * 声明 todo 模块下的所有子模块.
 *
 * 对应 Rust 中的 src/todo.rs:
 *
 *     pub mod core;
 *     pub mod create;
 *     pub mod list;
 *     pub mod storage;
 *
 * TypeScript 中没有模块声明文件, 这里使用命名空间重导出,
 * 使其可以通过 todo.create.createTodo(...) 这样的路径访问,
 * 对应 Rust 的 todo::create::create_todo.
 */

export * as core from "./core.ts";
export * as create from "./create.ts";
export * as list from "./list.ts";
export * as storage from "./storage.ts";
