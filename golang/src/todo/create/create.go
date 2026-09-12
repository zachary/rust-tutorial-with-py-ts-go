package create

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"strings"

	"cli/src/todo/core"
)

// reader 对应 Rust 中的 std::io::stdin().
// Rust 每次调用都重新获取句柄, Go 复用同一个 bufio.Reader 以免丢失缓冲区中的数据.
var reader = bufio.NewReader(os.Stdin)

// readLine 对应 Rust 中的 std::io::stdin().read_line(&mut buf).
//
// Rust 的 read_line 会把行尾的换行符一并读入, 因此只有在到达输入结尾时才返回空字符串.
// 读取失败时 expect("read line failed") 会 panic, 这里保持一致.
func readLine() string {
	line, err := reader.ReadString('\n')

	if err != nil {
		if err == io.EOF {
			// Rust 中 read_line 在读取到结尾时返回 0 字节, 那会让 create_todo 的
			// while 循环一直空转; 这里改为 panic, 与 .expect("read line failed") 的失败行为一致.
			if line == "" {
				panic("read line failed: EOF")
			}

			return line
		}

		// 对应 .expect("read line failed")
		panic("read line failed: " + err.Error())
	}

	return line
}

// CreateTodo 对应 Rust 中的 create_todo.
//
//	todos: &mut Vec<TodoItem>, title: Option<String>, content: Option<String>
//
// Rust 使用 &mut Vec<TodoItem> 可变借用列表, Go 中使用指向切片指针来表达同样的语义.
// Option<String> 对应 *string, nil 即 None.
func CreateTodo(todos *[]core.TodoItem, title *string, content *string) {
	inputs := []string{}

	if title != nil {
		if *title != "" {
			inputs = append(inputs, *title)
		}
	}

	if content != nil {
		if *content != "" {
			inputs = append(inputs, *content)
		}
	}

	ok := len(inputs) == 0

	// 对应 Rust 中的 while ok { ... }
	for ok {
		length := len(inputs)

		if length == 0 {
			fmt.Println("Please input todo title")

			title := readLine()

			if title == "" {
				continue
			}

			inputs = append(inputs, strings.TrimSpace(title))
		} else if length == 1 {
			fmt.Println("Please input todo content")

			content := readLine()

			if content == "" {
				continue
			}

			inputs = append(inputs, strings.TrimSpace(content))
		} else {
			fmt.Printf("title:   [%s]\n", inputs[0])
			fmt.Printf("content: [%s]\n", inputs[1])
			fmt.Println("Are you sure to create this todo? (y/n)")

			sure := readLine()

			if strings.ToLower(strings.TrimSpace(sure)) != "n" {
				ok = false
			} else {
				inputs = inputs[:0]
			}
		}
	}

	inputsLen := len(inputs)

	// Rust 中这里通过 let 遮蔽了参数 title, Go 不支持遮蔽, 因此使用新的变量名.
	// inputs[0].clone() 在 Go 中不需要, 字符串是不可变的值类型.
	todoTitle := "default title"
	if inputsLen > 0 {
		todoTitle = inputs[0]
	}

	todoContent := "default content"
	if inputsLen > 1 {
		todoContent = inputs[1]
	}

	fmt.Printf("create todo title: %s, content: %s\n", todoTitle, todoContent)

	*todos = append(*todos, core.NewTodoItem(todoTitle, todoContent))
}
