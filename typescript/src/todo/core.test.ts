/**
 * 对应 Rust 中的:
 *
 *     #[cfg(test)]
 *     mod tests {
 *         use super::{Serializer, TodoItem};
 *         ...
 *     }
 *
 * 运行测试 (在 typescript 目录下):
 *     node --test src/todo/core.test.ts
 *     npm test
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { TodoItem } from "./core.ts";

/** 对应 Rust 中的 test_todo_item_creation. */
test("test_todo_item_creation", () => {
    const item = TodoItem.new("test", "content");

    assert.equal(item.title, "test");
    assert.equal(item.content, "content");
});

/** 对应 Rust 中的 test_serialization_roundtrip. */
test("test_serialization_roundtrip", () => {
    const original = TodoItem.new("test", "content");
    const serialized = original.serialize();
    const deserialized = TodoItem.deserialize(serialized);

    assert.equal(original.title, deserialized.title);
    assert.equal(original.content, deserialized.content);
});
