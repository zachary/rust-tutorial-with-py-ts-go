package storage

import (
	"encoding/json"
	"fmt"
	"os"

	"cli/src/todo/core"
)

// ReadTodoList 对应 Rust 中的 read_todo_list.
//
// 注意: 与 Rust 版本一致, 读取失败时只向标准输出打印错误, 而不是向上传递错误.
func ReadTodoList(saveFile string) []core.TodoItem {
	result := []core.TodoItem{}

	content, err := os.ReadFile(saveFile)

	if err == nil {
		list := []core.TodoItem{}

		if err := json.Unmarshal(content, &list); err == nil {
			result = append(result, list...)
		} else {
			fmt.Println("parse file error")
		}
	} else {
		fmt.Println("read file error")
	}

	// 如果没有读取到任何数据, 提供默认示例
	if len(result) == 0 {
		result = append(result, core.NewTodoItem("learn rust", "read rust book"))
		result = append(result, core.NewTodoItem("work", "complete required"))
		result = append(result, core.NewTodoItem("play", "play game"))
	}

	return result
}

// SaveTodoList 对应 Rust 中的 save_todo_list, 返回 Result<(), String>.
//
// Rust 中的错误通过 map_err(|e| e.to_string()) 转为 String, Go 中直接返回 error.
func SaveTodoList(saveFile string, todos *[]core.TodoItem) error {
	if todos == nil {
		empty := []core.TodoItem{}
		todos = &empty
	}

	// 对应 serde_json::to_string(todos)
	data, err := json.Marshal(*todos)

	if err != nil {
		return err
	}

	// 对应 fs::write(save_file, data)
	return os.WriteFile(saveFile, data, 0o644)
}
