package main

import (
	"errors"
	"fmt"
	"os"

	"cli/src/todo/core"
	"cli/src/todo/create"
	"cli/src/todo/list"
	"cli/src/todo/storage"
)

// Program 对应 Rust 中的结构体 Program (clap 的 Parser 派生).
//
//	#[derive(Debug, Parser)]
//	#[command(version, about, long_about = "Todo Cli")]
//	struct Program {
//	    #[command(subcommand)]
//	    pub command: TodoCommand,
//	}
type Program struct {
	// Command 对应 #[command(subcommand)] pub command: TodoCommand.
	Command core.TodoCommand
}

// Parse 对应 clap 的 Program::parse().
//
// 对应 clap 的行为: --help / --version 打印信息后以状态码 0 退出,
// 参数错误时打印错误信息并以状态码 2 退出.
func (program *Program) Parse(args []string) {
	command, err := core.ParseTodoCommand(args)

	if errors.Is(err, core.ErrHelpShown) {
		os.Exit(0)
	}

	if err != nil {
		fmt.Fprint(os.Stderr, err.Error())
		os.Exit(2)
	}

	program.Command = command
}

func main() {
	program := Program{}
	program.Parse(os.Args[1:])

	saveFile := "todo.json"
	todos := storage.ReadTodoList(saveFile)

	// 对应 Rust 中的:
	//
	//	match args.command {
	//	    TodoCommand::Create { title, content } => todo::create::create_todo(&mut todos, title, content),
	//	    TodoCommand::List { title, content } => todo::list::list_todo(&todos, title, content),
	//	}
	switch program.Command.Command {
	case core.Create:
		create.CreateTodo(&todos, program.Command.Title, program.Command.Content)
	case core.List:
		list.ListTodo(&todos, program.Command.Title, program.Command.Content)
	}

	// 对应 save_todo_list(save_file, &todos);
	if err := storage.SaveTodoList(saveFile, &todos); err != nil {
		fmt.Println(err)
	}
}
