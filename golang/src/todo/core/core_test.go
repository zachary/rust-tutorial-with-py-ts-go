package core

import (
	"testing"
)

// 对应 Rust 中的:
//
//	#[cfg(test)]
//	mod tests {
//	    use super::{Serializer, TodoItem};
//	    ...
//	}
//
// Go 的测试必须放在独立的 _test.go 文件中, 因此这里保留同包测试.

// TestTodoItemCreation 对应 Rust 中的 test_todo_item_creation.
func TestTodoItemCreation(t *testing.T) {
	item := NewTodoItem("test", "content")

	if item.Title != "test" {
		t.Fatalf("title = %q, want %q", item.Title, "test")
	}

	if item.Content != "content" {
		t.Fatalf("content = %q, want %q", item.Content, "content")
	}
}

// TestSerializationRoundtrip 对应 Rust 中的 test_serialization_roundtrip.
func TestSerializationRoundtrip(t *testing.T) {
	original := NewTodoItem("test", "content")
	serialized := original.Serialize()
	deserialized := Deserialize[TodoItem](serialized)

	if original.Title != deserialized.Title {
		t.Fatalf("title = %q, want %q", deserialized.Title, original.Title)
	}

	if original.Content != deserialized.Content {
		t.Fatalf("content = %q, want %q", deserialized.Content, original.Content)
	}
}
