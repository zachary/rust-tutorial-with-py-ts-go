package list

import (
	"fmt"
	"strings"

	"cli/src/todo/core"
)

// TodoItemFilter 对应 Rust 中的结构体 TodoItemFilter.
type TodoItemFilter struct {
	// Title 对应 pub title: Option<String>.
	Title *string
	// Content 对应 pub content: Option<String>.
	Content *string
}

// NewTodoItemFilter 对应 Rust 中的 TodoItemFilter::new.
func NewTodoItemFilter() TodoItemFilter {
	return TodoItemFilter{
		Title:   nil,
		Content: nil,
	}
}

// SetTitle 对应 Rust 中的 set_title<T: Into<String>>.
func (filter *TodoItemFilter) SetTitle[T ~string](title T) {
	value := string(title)
	filter.Title = &value
}

// SetContent 对应 Rust 中的 set_content<T: Into<String>>.
func (filter *TodoItemFilter) SetContent[T ~string](content T) {
	value := string(content)
	filter.Content = &value
}

// Filter 对应 Rust 中的 TodoItemFilter::filter.
func (filter *TodoItemFilter) Filter(list *[]core.TodoItem) {
	filteredList := []*core.TodoItem{}

	if filter.Title == nil && filter.Content == nil {
		for index := range *list {
			filteredList = append(filteredList, &(*list)[index])
		}
	} else {
		for index := range *list {
			item := &(*list)[index]

			// 对应 Rust 中的 let mut flag: (bool, bool) = (false, false);
			flag := [2]bool{false, false}

			if filter.Title != nil {
				flag[0] = strings.Contains(item.Title, *filter.Title)
			} else {
				flag[0] = true
			}

			if filter.Content != nil {
				flag[1] = strings.Contains(item.Content, *filter.Content)
			} else {
				flag[1] = true
			}

			if flag[0] && flag[1] {
				filteredList = append(filteredList, item)
			}
		}
	}

	for _, item := range filteredList {
		fmt.Printf("todo title: %s, content: %s\n", item.Title, item.Content)
	}
}

// ListTodo 对应 Rust 中的 list_todo.
func ListTodo(todos *[]core.TodoItem, title *string, content *string) {
	filter := NewTodoItemFilter()

	if title != nil {
		filter.SetTitle(*title)
	}

	if content != nil {
		filter.SetContent(*content)
	}

	filter.Filter(todos)
}
