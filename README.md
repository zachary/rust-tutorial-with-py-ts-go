# Rust Tutorial

[English](README.md) | [中文](README-zh.md)

Rust is a systems programming language that has grown rapidly in recent years.

It combines high performance with memory safety, and is widely used in embedded systems, operating systems, WebAssembly, backend services, and command-line tools.

C "trusts that you know what you are doing", and therefore lets you manipulate memory and pointers with almost no restrictions.
Rust is the exact opposite: at the language design level it "does not trust developers" and assumes "you will make a mistake sooner or later".

For this reason, Rust introduced the ownership system, borrow checking, and lifetimes, so that code which "might break in the future" is kept out at compile time.
It also means that while writing code, developers often have to spend time understanding these mechanisms and work to "convince" the compiler to accept their code.
The process is winding, but what you end up with is a more robust and safer program.

In this tutorial we will learn Rust by building a simple CLI (Command Line Interface) program for recording Todo items.

On top of that, the repository also provides the same program [implemented in Go, Python, and TypeScript](#implementations-in-other-languages), so you can compare how different languages express the same design.

## Prerequisites

First, get the Rust installer from the [official Rust website](https://www.rust-lang.org/learn/get-started).

Then follow the official documentation to set up your environment.

Once installation is complete, you can initialize a project with `cargo init`.

```shell
cargo init # initialize in the current directory
cargo init Project # create a new Project directory in the current directory
```

## Initializing the Project

Use `cargo init cli` to initialize a project named cli.

The directory structure is as follows:

```sh
# cli directory structure
- .git
- src
  - main.rs
- .gitignore
- Cargo.toml
```

The `src` directory stores the project source code, while the `Cargo.toml` file stores the project dependencies.

Open `src/main.rs` in an editor. You will see the following:

```rust
fn main() {
  println!("Hello, world!");
}
```

Open the project in a terminal and run it with `cargo run`.

You will see `Hello world!` printed.

Note that in Rust, statements must end with a semicolon `;`.

## Variables

In Rust, variables are declared with the `let` keyword.

```rust
fn main() {
  let msg: &str = "Hello, world!";
  println!("{}", msg);
}
```

We do not need to annotate the type of every variable; the compiler infers it automatically.
Only when the compiler cannot infer the type do we need to annotate it manually.

So the code above can be changed to:

```rust
fn main() {
  let msg = "Hello, world!";
  println!("{}", msg);
}
```

Our CLI records Todo items, so we need a way to take input.

The Rust standard library provides `std::env` for reading environment information. It offers an `args` function that returns the command-line arguments.

Change `main.rs` to the following:

```rust
fn main() {
  // Since args returns an iterator, we need to collect it into a collection
  // The user input is unknown, so we need to specify the collected type, i.e. String
  let args: Vec<String> = std::env::args().collect();

  println!("{:#?}", args);
}
```

Run `cargo run -- a b` on the command line, and the result is:

```bash
[
  "target\\debug\\cli.exe",
  "a",
  "b",
]
```

As you can see, the input comes back as an array, and its first item is the path to our executable.

What we want is the input itself, namely `a` and `b`.

```rust
fn main() {
  let args: Vec<String> = std::env::args().collect();

  let title = args[1];
  let content = args[2];

  println!("todo title: {}, content: {}", title, content);
}
```

Run `cargo run -- a b` and you will see an error:

```bash
error[E0507]: cannot move out of index of `Vec<String>`
 --> src\main.rs:6:15
  |
6 |   let title = args[1];
  |               ^^^^^^^ move occurs because value has type `String`, which does not implement the `Copy` trait
  |
help: consider borrowing here
  |
6 |   let title = &args[1];
  |               +
help: consider cloning the value if the performance cost is acceptable
  |
6 |   let title = args[1].clone();
  |                      ++++++++

error[E0507]: cannot move out of index of `Vec<String>`
 --> src\main.rs:7:17
  |
7 |   let content = args[2];
  |                 ^^^^^^^ move occurs because value has type `String`, which does not implement the `Copy` trait
  |
help: consider borrowing here
  |
7 |   let content = &args[2];
  |                 +
help: consider cloning the value if the performance cost is acceptable
  |
7 |   let content = args[2].clone();
  |                        ++++++++
```

### Ownership

The key part of the error above is the following:

```bash
cannot move out of index of `Vec<String>`

move occurs because value has type `String`, which does not implement the `Copy` trait
```

It means a value cannot be moved out of a `Vec<String>`, because the `String` type does not implement the `Copy` trait and therefore cannot be copied implicitly.

As mentioned earlier:

> At the language design level, Rust "does not trust developers" and assumes "you will make a mistake sooner or later".
>
> For this reason, Rust introduced the ownership system, borrow checking, and lifetimes, so that code which "might break in the future" is kept out at compile time.

This error comes from the ownership system Rust introduced.

According to the Rust ownership rules:

- Every value has an owner.
- Each value can have only one owner at a time.
- When the owner goes out of scope, the value is dropped.

With that, the error above is easy to understand.

We are trying to move a value out of `Vec<String>`, but according to ownership, every value can have only one owner.
Therefore `Vec<String>` owns all the `String` elements inside it.

When we access an element such as `args[1]`, we are in fact trying to "move" the ownership of that element to another variable. That breaks the ownership rules,
because `args` may still be used later; if an element's ownership were moved out, its internal state would become inconsistent, and problems such as dangling pointers or double frees could follow.

### References and Borrowing

Rust "does not trust developers" at the language design level, so it adopts the ownership system to enforce memory safety.
Because of this, the compiler is quite "smart": it not only tells you where the error is, but also suggests how to fix it.

For example, the compilation error below gives two possible solutions:

```bash
help: consider borrowing here
  |
6 |   let title = &args[1];
  |               +
help: consider cloning the value if the performance cost is acceptable
  |
6 |   let title = args[1].clone();
  |                      ++++++++
```

The first approach is `let title = &args[1];`, which borrows the value of `args[1]` instead of moving its ownership.
This approach is efficient and does not copy data, but the type of the variable becomes `&String`, meaning it is a reference to a `String` value.
As a result it is bound to the borrowed value: once `args` is gone, the reference is no longer valid.

The second approach is `let title = args[1].clone();`, which clones the value of `args[1]`
and moves that value into the `title` variable, so that `title` stays usable even after `args` is gone.

So we pick the second approach and call `clone` explicitly to make a copy of `args[1]`.

> The act of creating a reference is called borrowing, and the reference is the result of that act.

Running `cargo run -- a b` again shows that it now compiles.

### Mutable Variables

In the current implementation, every run requires two arguments (title and content); otherwise the program fails with an out-of-bounds index error.
To make the program more robust, we can set default values for missing arguments.

Modify the code:

```rust
fn main() {
  let args: Vec<String> = std::env::args().collect();
  let len = args.len();
  let title = args[1].clone();
  let content = String::from("default content");

  if len > 2{
    content = args[2].clone();
  }

  println!("todo title: {}, content: {}", title, content);
}
```

Here we check the arguments: when there are more than two, the third is used as the content; otherwise the default is kept.

Running `cargo run -- a` gives us another error.

```bash
error[E0384]: cannot assign twice to immutable variable `content`
  --> src\main.rs:10:5
   |
7  |   let content = String::from("default content");
   |       ------- first assignment to `content`
...
10 |     content = args[2].clone();
   |     ^^^^^^^ cannot assign twice to immutable variable
   |
help: consider making this binding mutable
   |
7  |   let mut content = String::from("default content");
   |       +++
```

For safety and readability, Rust makes variables immutable by default.
The error says that you cannot assign to the immutable variable `content` a second time unless you declare it mutable.

The compiler already hints at the fix: add the `mut` keyword after `let`.

```rust
fn main() {
  let args: Vec<String> = std::env::args().collect();
  let len = args.len();
  let title = args[1].clone();
  let mut content = String::from("default content");

  if len > 2{
    content = args[2].clone();
  }

  println!("todo title: {}, content: {}", title, content);
}
```

Running `cargo run -- a` again succeeds.

### Variable Types

Rust is a strongly typed language, which means variables must have a definite type at compile time.

There are two ways to determine a type: explicit declaration and implicit inference.

Explicit declaration uses `:` after the variable name to specify the type.
For example: `let args: Vec<String> = std::env::args().collect();` specifies the type of the variable `args` as `Vec<String>`.

Implicit inference means the compiler works the type out from the value and its context.
Rust's inference is powerful, so in most cases we do not need to annotate types manually; only when the compiler cannot infer a type do we have to.

For example, in the code below we do not explicitly declare the types of `len`, `title`, or `content`, yet their types are still definite:

```rust
  let args: Vec<String> = std::env::args().collect();
  let len /* usize */ = args.len();
  let title /* String */ = args[1].clone();
  let mut content /* String */ = String::from("default content");
```

Rust supports the usual primitive types:

- Integers: `i8`, `i16`, `i32`, `i64`, `i128`, `isize`
- Unsigned integers: `u8`, `u16`, `u32`, `u64`, `u128`, `usize`
- Floating point numbers: `f32`, `f64`
- Booleans: `bool`
- Characters: `char`

Note that in Rust, `"xxx"` is a string literal slice whose type is `&str`, fixed and immutable at compile time.
`String`, by contrast, is a growable string type whose length can change at runtime.

The `args` we used earlier is a `Vec<String>`, a collection of dynamic strings.

## Control Flow

Control flow is how you steer the flow of a program.

Without control flow, a program executes line by line, from top to bottom.
Control flow statements let us selectively execute a block of code based on a condition, or repeatedly execute a block of code,
which gives a program the ability to decide and to loop.

### if/else Branches

`if`/`else` is the most commonly used control flow statement in Rust.

It tests whether a condition holds.
That condition must be a boolean value, not any other type.

If the condition holds, the code block after `if` is executed.
If the condition does not hold, the code block after `else` is executed.

```rust
  let mut content = String::from("default content");

  if len > 2{
    content = args[2].clone();
  }
```

When there are more than two arguments, the third argument replaces the value of the variable `content`.
Otherwise `content` keeps its value.

Note that `if` in Rust is an expression, so it is allowed to return a value. Therefore the code above can be changed to:

```rust
  let content = if len > 2 {
    args[2].clone()
  } else {
    String::from("default content")
  };
```

The code above means: if `len > 2` holds, `content` gets `args[2].clone()`;
otherwise it gets `String::from("default content")`.

> Rust is an expression-oriented language; in fact most constructs can return a value.

### Loops

In Rust, the looping constructs are:

- A `loop` runs forever until it hits a `break` statement.
- A `while` loop runs as long as its condition holds.
- A `for` loop iterates over every element of a collection.

We will use `while` to build an interactive command-line flow that collects the Todo title and content step by step, then asks for confirmation before creating the Todo.

Modify the code in `main.rs` as follows:

```rust
fn main() {
  let mut inputs: Vec<String> = Vec::new();
  let args: Vec<String> = std::env::args().collect();
  let mut ok = args[1].clone() == "create";

  while ok {
    let len = inputs.len();

    if len == 0 {
      println!("Please input todo title");

      let mut title = String::new();

      std::io::stdin()
        .read_line(&mut title)
        .expect("read line failed");

      if title.is_empty() {
        continue;
      }

      inputs.push(title.trim().to_string());

    } else if len == 1 {
      println!("Please input todo content");

      let mut content = String::new();

      std::io::stdin()
        .read_line(&mut content)
        .expect("read line failed");

      if content.is_empty() {
        continue;
      }

      inputs.push(content.trim().to_string());
    }

    else {
      println!("title:   [{}]", inputs[0].clone());
      println!("content: [{}]", inputs[1].clone());
      println!("Are you sure to create this todo? (y/n)");

      let mut sure = String::new();

      std::io::stdin()
        .read_line(&mut sure)
        .expect("read line failed");

      if sure.trim().to_lowercase() != "n" {
        ok = false;
      }else{
        inputs.clear();
      }
    }
  }

  let title = inputs[0].clone();
  let content = inputs[1].clone();

  println!("create todo title: {}, content: {}", title, content);
}
```

Here we use a `while` loop to build an interactive command-line program for creating Todo items.

A state variable `ok` controls the loop: when `ok` is `false`, the loop ends.
When the user enters nothing, the `continue` statement skips the current iteration.

If it were changed to a `loop`, it would look like this:

```rust
loop {
  // everything else stays the same

  if sure.trim().to_lowercase() != "n" {
    ok = false;
  }else{
    inputs.clear();
  }

  if !ok {
    break
  }
}
```

Both `while` and `loop` can drive a loop, and the two are effectively equivalent.

The difference between them is:

- `while` suits condition-driven loops, such as reading user input and confirming it.
- `loop` suits cases with more complex structure where the loop must be controlled manually, for example game development.

Now `cargo run -- create` takes you into an interactive flow for creating Todo items.

### for Loops

The `for` loop is commonly used to iterate over a collection.

We will add a `list` command to the CLI program for listing all Todo items.

Modify `main.rs` as follows:

```rust
fn main() {
  let mut todos: Vec<String> = Vec::new();
  todos.push(String::from("learn rust"));
  todos.push(String::from("work"));
  todos.push(String::from("play"));

  let args: Vec<String> = std::env::args().collect();
  let mut inputs: Vec<String> = Vec::new();

  if args[1].clone() == "list" {
    for todo in todos {
      println!("todo title: {}", todo);
    }
    return;
  }

  let mut ok = args[1].clone() == "create";

  // ...
}
```

Unlike `while` and `loop`, which make you manage the index by hand, `for` iterates over a collection more concisely and safely.
It is the preferred way to process collections in Rust.

## Slices and Arrays

In the earlier code we used the `String` type and the `&str` type.
But if `&str` exists, why use `String` at all?

Because in Rust, a string of type `String` is a dynamically sized string whose characters can be added or removed at any position,
while a string of type `&str` is a statically sized string whose length is fixed at compile time and cannot be changed.

`&str` suits read-only borrowing, while `String` suits modification.

### Slices

A slice lets you reference consecutive elements of a collection instead of the whole thing. The `&str` type is exactly a string slice.

The slice syntax is `&[start..end]`, where `start` is the starting position of the slice and `end` is the ending position.
Note that the slice range is half-open: it includes the `start` position and excludes the `end` position.

For example: with `let s = "hello world";`, `s` is a string slice whose type is `&str`.
`&s[0..5]` takes the first 5 characters of `s`, namely `"hello"`.

Either bound can be omitted: from the start as `&s[..5]`, to the end as `&s[6..]`.

> Rust strings are UTF-8 encoded, so a slice must be cut at valid character boundaries, otherwise the program will panic.

Slices are extremely common: they avoid copying, which is faster, and they give you a flexible view over the data.

### Arrays

Arrays in Rust also have a fixed length at compile time, require every element to be of the same type, and are fast. They are defined with `let var: [type; length] = [];`.
For example: `let arr: [i32; 5] = [1, 2, 3, 4, 5];` declares an array of type `i32` with length 5.

If you need a dynamic array, Rust provides `Vec<T>`, whose length can change at runtime. It is commonly used for data of unknown size, such as user input and command-line arguments.
The `Vec<String>` we used earlier is exactly such a dynamic array whose element type is `String`.

## Pattern Matching

At the moment our CLI program has two commands:

- `create`: create a Todo item.
- `list`: view the Todo list.

But as features are added, the code grows bloated and hard to maintain.

To solve this problem, Rust offers a more elegant and powerful approach: pattern matching with `match`.

We can use `match` to match the input and run the logic that corresponds to each case.

```rust
fn main() {
  let mut todos: Vec<String> = Vec::new();
  todos.push(String::from("learn rust"));
  todos.push(String::from("work"));
  todos.push(String::from("play"));

  let args: Vec<String> = std::env::args().collect();

  match args[1].clone().as_str() {
    "create" => {
      let mut inputs: Vec<String> = Vec::new();
      let mut ok = true;

      // ...

      println!("create todo title: {}, content: {}", title, content);
    }
    "list" => {
      for todo in todos {
        println!("todo title: {}", todo);
      }
    }
    _ => {
      println!("unknown command");
    }
  }
}
```

As the code above shows, `match` resembles `switch` in other languages,
but Rust's `match` is far more powerful. It can:

- Match multiple possible values.
- Support variable binding and destructuring.
- Be required to cover every case, while allowing `_` to match everything.
- Be an expression at the same time, so it can return a value.
- Support guard conditions that add extra constraints with `if`.

Here is a simple example:

```rust
let auth_level: i32 = 2;

let role = match auth_level {   // the value is returned to the variable declaration
  0 => "Guest",                 // single value match
  1 | 2 => "User",              // multiple value match
  n if n >= 16 => "Admin",      // guard clause
  _ => "Unknow"                 // default branch, matches all remaining cases
}
```

## Structs

Right now, a Todo item has two separate attributes: Title and Content.

To express the relationship between them better, we can group them together with a Rust struct.

A struct is a data type we define ourselves. It packs multiple fields into one whole, which makes them easier to manage, pass around, and extend.

Rework `main.rs`.

```rust
struct TodoItem {
  title: String,
  content: String,
}

fn main() {
  let mut todos: Vec<TodoItem> = Vec::new();
  todos.push(TodoItem {
    title: "learn rust".to_string(),
    content: "read rust book".to_string(),
  });
  todos.push(TodoItem {
    title: "work".to_string(),
    content: "complete required".to_string(),
  });
  todos.push(TodoItem {
    title: "play".to_string(),
    content: "play game".to_string(),
  });

  // ...
  "list" => {
    for todo in todos {
      println!("todo title: {}, content: {}", todo.title, todo.content);
    }
  }
  // ...
}
```

In the code above we defined a struct named `TodoItem` with the two fields `title` and `content`, which hold the title and content of a Todo item.

In `main` we use a `Vec<TodoItem>` to store multiple Todo items, each of which is an instance of the struct.

When the `"list"` command matches, we iterate over `todos` and print the title and content of each Todo: a simple listing feature.

## Functions

In the earlier code we used the `todos` variable to store Todo items, instantiating each item and pushing it into `todos` by hand.

Instantiating a Todo item looks like this, which is tedious:

```rust
TodoItem {
  title: "learn rust".to_string(),
  content: "read rust book".to_string(),
}
```

To avoid repeating the same conversions and construction every time, we can use Rust functions.

A function is a block of code that can be called repeatedly to accomplish a specific task. It can:

- Isolate a piece of functionality so it can be reused, avoiding duplicated code.
- Describe its purpose through its name, making the code structure clear and improving readability.
- Confine changes to the function body, without affecting callers, which improves maintainability and extensibility.
- Change its internal behavior and implement different functionality by passing different arguments.
- Return a value, so the inside can talk back to the outside.

```rust
fn create_todo_item(title: &str, content: &str) -> TodoItem {
  return TodoItem {
    title: title.to_string(),
    content: content.to_string(),
  };
}

fn main() {
  let mut todos: Vec<TodoItem> = Vec::new();
  todos.push(create_todo_item("learn rust", "read rust book"));
  todos.push(create_todo_item("work", "complete required"));
  todos.push(create_todo_item("play", "play game"));

  // ...
}
```

In the example above, `create_todo_item` takes two arguments of type `&str` and returns a value of type `TodoItem`.
Inside, the two `&str` arguments are converted into `String` values and bound to a `TodoItem` instance.

After that, `create_todo_item("title", "content")` is all we need to instantiate a `TodoItem`.

Compared with spelling out the struct type, listing every field, and converting each string by hand, a function cuts the duplication and speeds up development.

With `create_todo_item` in place, passing in a title and content is enough to create a `TodoItem`, which is concise and easy to read and maintain.

This style of encapsulation is common in real projects, and it captures the core idea of function abstraction: hide the details, expose a clear interface.

### Function Return Values

In `create_todo_item` we used the `return` keyword to return an instance of type `TodoItem`.

In fact we do not need the `return` keyword at all. The function can be written as:

```rust
fn create_todo_item(title: &str, content: &str) -> TodoItem {
  TodoItem {
    title: title.to_string(),
    content: content.to_string(),
  }
}
```

Dropping the trailing `;` is what makes this work: Rust takes the value of the last expression in the function body as the return value.
Removing the `;` turns a statement into an expression, and the value of that expression becomes the return value.

The `return` keyword is needed only when you want to return early.

### Tuples

A tuple is a compound type formed by combining several types. Its length and order are fixed.
You can think of a tuple as an array whose types cannot be reordered.

```rust
let tup: (i32, f64, &str) = (1, 1.0, "1");
```

Tuples allow their contents to be accessed with `.`.

```rust
let a = tup.0
let b = tup.1
let c = tup.2
```

They are often used to wrap several values and hand them somewhere else.

### The Unit Type

The unit type in Rust has exactly one value, `()`.
It is actually a special tuple, but note that a tuple in Rust must never be empty; if it is empty, it is no longer a tuple.

Usually, the unit type is used to mean "no return value".

A function that returns nothing is in fact equivalent to returning the empty tuple `()` by default.

## Modules

As the program grows, `main.rs` accumulates more and more code, all the logic piled together, which hurts readability and makes maintenance and extension harder.

In Rust, modularizing is a common way to organize code: split it into multiple files, each responsible for one piece of functionality.
That keeps the structure clear and the division of responsibilities explicit.

At the moment, our project structure looks like this:

```bash
|- src/
  |- main.rs
```

Create some new files, and the project structure becomes:

```bash
|- src/
  |- todo/        # todo module directory
    |- core.rs    # todo core logic
    |- create.rs  # create todo command
    |- list.rs    # list todo command
  |- main.rs      # program entry point
  |- todo.rs      # submodule declarations
```

### Access Modifiers

```rust
// src/todo/core.rs
pub struct TodoItem {
  pub title: String,
  pub content: String,
}

pub fn create_todo_item(title: &str, content: &str) -> TodoItem {
  TodoItem {
    title: title.to_string(),
    content: content.to_string(),
  }
}

pub fn get_todo_list() -> Vec<TodoItem> {
  let mut todos: Vec<TodoItem> = Vec::new();

  todos.push(create_todo_item("learn rust", "read rust book"));
  todos.push(create_todo_item("work", "complete required"));
  todos.push(create_todo_item("play", "play game"));

  return todos;
}
```

Here, every struct and function is preceded by the `pub` keyword, which marks it as public so that other modules can access it.

In Rust, everything is private by default; without `pub`, the item can only be accessed inside the current module.

```rust
// src/todo/create.rs
pub fn create_todo() {
    let mut inputs: Vec<String> = Vec::new();
    let mut ok = true;

    while ok {
        let len = inputs.len();

        if len == 0 {
            println!("Please input todo title");

            let mut title = String::new();

            std::io::stdin()
                .read_line(&mut title)
                .expect("read line failed");

            if title.is_empty() {
                continue;
            }

            inputs.push(title.trim().to_string());
        } else if len == 1 {
            println!("Please input todo content");

            let mut content = String::new();

            std::io::stdin()
                .read_line(&mut content)
                .expect("read line failed");

            if content.is_empty() {
                continue;
            }

            inputs.push(content.trim().to_string());
        } else {
            println!("title:   [{}]", inputs[0].clone());
            println!("content: [{}]", inputs[1].clone());
            println!("Are you sure to create this todo? (y/n)");

            let mut sure = String::new();
            std::io::stdin()
                .read_line(&mut sure)
                .expect("read line failed");

            if sure.trim().to_lowercase() != "n" {
                ok = false;
            } else {
                inputs.clear();
            }
        }
    }

    let inputs_len = inputs.len();

    let title = if inputs_len > 0 {
        inputs[0].clone()
    } else {
        String::from("default title")
    };
    let content = if inputs_len > 1 {
        inputs[1].clone()
    } else {
        String::from("default content")
    };

    println!("create todo title: {}, content: {}", title, content);
}
```

### Module Path Resolution

```rust
// src/todo/list.rs
use super::core::TodoItem;

pub fn list_todo(todos: &Vec<TodoItem>) {
  for todo in todos {
    println!("todo title: {}, content: {}", todo.title, todo.content);
  }
}
```

The statement `use super::core::TodoItem;` imports an item from another module.

Rust references the contents of different modules with folder-like paths, and provides three path prefixes:

- `super`, which means the parent module of the current module.
- `self`, which means the current module itself.
- `crate`, which means the current root module, i.e. the `src` directory; for a third-party library, it is replaced by the library name.

So `use super::core::TodoItem;` imports and uses `TodoItem` from the `core` submodule of the `list` module's parent.
In other words, it pulls `TodoItem` in from the sibling module `core`.

> Imported content must be made public with the `pub` keyword, otherwise it cannot be imported.

### Module Declarations

```rust
// src/todo.rs
pub mod core;
pub mod create;
pub mod list;
```

We can declare submodules with the `mod` keyword. Likewise, a submodule needs the `pub` keyword to be exposed.

In Rust, a module may have a `mod.rs` file that acts as its entry file.
There we can define the module's public contents: structs, functions, submodules, and so on.

With `rustc` older than 1.30, this is the only way to declare a module entry.

But from 1.30 onwards you can create a `.rs` file named after the module, next to its directory, and use that as the entry declaration.

That is what we do here: a `.rs` file named after the module serves as the module entry.

Note that a module can also be declared inline, without a separate file.

```rust
pub mod list {
  use super::core::TodoItem;

  pub fn list_todo(todos: &Vec<TodoItem>) {
    for todo in todos {
      println!("todo title: {}, content: {}", todo.title, todo.content);
    }
  }
}
```

```rust
// src/main.rs
mod todo;

fn main() {
  let args: Vec<String> = std::env::args().collect();
  let todos = todo::core::get_todo_list();

  match args[1].clone().as_str() {
    "create" => todo::create::create_todo(),
    "list" => todo::list::list_todo(&todos),
    _ => {
        println!("unknown command");
    }
  }
}
```

## Data Persistence

At the moment our task data lives in memory. When the program exits, the data disappears with it.

So that the user's data survives into the next run, we need to persist it, that is, save it to disk.

A simple, common approach is to keep the data in a file: read the task list when the program starts, and write the updated tasks back when the program exits or the data changes.

To do that, the data first has to support serialization and deserialization.

- Serialization converts in-memory objects such as structs into a storable format.
- Deserialization converts that format back into struct objects.

### Adding Dependencies

In real projects we usually wrap commonly used functionality so it can be reused later.

Take it a step further and such functionality can be packaged as a library and published online for others to use.
When a project uses such a library, the project depends on it, which makes it a dependency.

`cargo` is Rust's package manager, and we can use it to install the library packages a project depends on.

To make `TodoItem` serialize and deserialize correctly we need two third-party libraries: `Serde` and `serde_json`.

Run the following commands in the project root directory:

```bash
cargo add serde --features derive     # add the serde dependency and enable the derive feature
cargo add serde_json                  # add the serde_json dependency
```

> serde is a powerful serialization/deserialization library supporting many formats, including JSON and YAML.
>
> serde_json is the implementation based on the JSON format.

### Implementing Methods for a Struct

In Rust we can use the `impl` keyword to define methods for a struct, keeping the struct and its behavior together.

Let us add create, serialize, and deserialize methods to `TodoItem`:

```rust
// src/todo/core.rs
use serde::{Deserialize, Serialize};
use serde_json;

#[derive(Deserialize, Serialize)]
pub struct TodoItem {
  pub title: String,
  pub content: String,
}

impl TodoItem {
  pub fn new(title: &str, content: &str) -> Self {
    create_todo_item(title, content)
  }

  pub fn serializer(&self) -> String {
    serde_json::to_string(self).unwrap()
  }

  pub fn deserializer(s: &str) -> Self {
    serde_json::from_str(s).unwrap()
  }
}
```

We added the `#[derive(Serialize, Deserialize)]` derive macro to the struct,
which implements the conversion logic `Serde` needs for `TodoItem` automatically, sparing us the complexity of writing it by hand.

In addition, we added:

- The `new` method: creates a new `TodoItem`; `TodoItem::new(...)` can now replace the earlier `create_todo_item(...)`.
- The `serializer` method: converts the current instance into a JSON string.
- The `deserializer` method: restores a `TodoItem` instance from a JSON string.

`TodoItem` now has basic serialization and deserialization, so the program can save and read task data in files.

### self and Self

The `self` keyword appears in the parameter list of the struct's instance methods.
It refers to the current instance, equivalent to `this` or `self` in other languages.

We can reach the current instance's fields through `self.title`, `self.content`, and so on.

Other than that, it is no different from any other parameter.

`Self`, on the other hand, refers to the current type. It is equivalent to writing the type name directly,
but it keeps working under circumstances such as a type rename, which makes the code more stable and readable.

### File Operations

Serialization and deserialization are in place for `TodoItem`. The next step is to store the data in a file to achieve persistence.

Rust's standard library provides `std::fs` for reading and writing files. We will use it to implement two things:

- Save the Todo list to a file.
- Read the Todo list into the program.

Add the file `src/todo/storage.rs` and declare and expose that module in `src/todo.rs`.

```rust
// src/todo/storage.rs
use super::core::TodoItem;
use std::fs;

pub fn read_todo_list(save_file: &str) -> Vec<TodoItem> {
  let mut result: Vec<TodoItem> = Vec::new();

  match fs::read_to_string(save_file) {
    Ok(content) => match serde_json::from_str(content.as_str()) {
      Ok(mut list) => result.append(&mut list),
      _ => {
        println!("parse file error");
      }
    },
    _ => {
      println!("read file error");
    }
  }

  // if no data was read, provide default examples
  if result.len() == 0 {
    result.push(TodoItem::new("learn rust", "read rust book"));
    result.push(TodoItem::new("work", "complete required"));
    result.push(TodoItem::new("play", "play game"));
  }

  return result;
}

pub fn save_todo_list(save_file: &str, todos: &Vec<TodoItem>) {
  let data = serde_json::to_string(todos).unwrap();
  fs::write(save_file, data).unwrap();
}
```

Modify `create_todo` so it adds a `TodoItem` to `todos` based on user input:

```rust
// src/todo/create.rs
use crate::todo::core::TodoItem;
pub fn create_todo(todos: Vec<TodoItem>) {
  // ...
  while ok {
    //...
  }
  // ...
  println!("create todo title: {}, content: {}", title, content);
  todos.push(TodoItem::new(title.as_str(), content.as_str()));
}
```

```rust
// src/main.rs
use crate::todo::storage::{read_todo_list, save_todo_list};

mod todo;

fn main() {
  let args: Vec<String> = std::env::args().collect();
  let save_file = "todo.json";
  let mut todos = read_todo_list(save_file);

  match args[1].clone().as_str() {
    "create" => todo::create::create_todo(&mut todos),
    "list" => todo::list::list_todo(&todos),
    _ => {
      println!("unknown command");
    }
  }

  save_todo_list(save_file, &todos);
}
```

Now, running these commands:

```bash
cargo run -- list    # show the Todo list (including the initial default content)
cargo run -- create  # add a Todo item (the change is saved)
```

Data is read from and written to `todo.json` automatically, giving us full local persistence.

## Enums

At the moment our program implements the `create` and `list` commands by matching on `args[1]`:

```rust
match args[1].as_str() {
  "create" => { ... }
  "list" => { ... }
  _ => println!("unknown command"),
}
```

Simple and intuitive as it is, this string-based matching has problems:

- As commands are added, the `match` arms become long-winded.
- A typo easily causes an error, with no type guarantees.
- The arguments of each command are hard to organize and extend uniformly.
- Help messages such as --help cannot be generated automatically.

To fix this, we will combine Rust enums with the third-party library `clap` to build a CLI that is easier to maintain and extend.

> clap is a powerful Rust library for parsing command-line arguments. It generates help output automatically and supports a rich set of argument types and validation rules.

Run the following command in the project root directory:

```bash
cargo add clap --features derive # add the dependency and enable the derive feature
```

### Why Use Enums

Enums show up in more or less every programming language.

They represent a finite set of mutually exclusive values, such as the days of the week or a person's gender.

Compared with enums in other languages, Rust enums are more flexible and powerful:

- Each variant can carry different data.
- They pair naturally with pattern matching for complex control flow.
- They work with `trait`s and methods to build rich abstractions.

That makes enums a natural fit for a CLI's command structure: each command is an enum variant, and each variant carries the arguments it needs.

### Declaring Enums

Enums in Rust are declared with the `enum` keyword.

```rust
// src/todo/core.rs
use clap::Subcommand;

#[derive(Debug, Clone, Subcommand)]
pub enum TodoCommand {
  /// Create a new todo item
  Create,
  /// List all todo items
  List,
}
```

The code above defines an enum named `TodoCommand` with two variants, `Create` and `List`.
The derive macro `#[derive(Debug, Clone, Subcommand)]` implements three traits for the enum automatically: `Debug`, `Clone`, and `Subcommand`.

The `Subcommand` trait tells `clap` that this enum corresponds to a subcommand.

### Parsing Command-line Arguments

```rust
//src/main.rs
use crate::todo::storage::{read_todo_list, save_todo_list};
use clap::Parser;
use todo::core::TodoCommand;

mod todo;

#[derive(Debug, Parser)]
#[command(version, about, long_about = "Todo Cli")]
struct Program {
  #[command(subcommand)]
  pub command: TodoCommand,
}

fn main() {
  let args = Program::parse();
  let save_file = "todo.json";
  let mut todos = read_todo_list(save_file);

  match args.command {
    TodoCommand::Create => todo::create::create_todo(&mut todos),
    TodoCommand::List => todo::list::list_todo(&todos),
  }

  save_todo_list(save_file, &todos);
}
```

Here we define a `Program` struct with a `command` field that receives the subcommand.

`#[command(version, about, long_about = "Todo Cli")]` tells `clap` to generate `--version` and `--help` automatically.

`#[command(subcommand)]` tells `clap` that this field corresponds to a subcommand.

Running `cargo run -- --help` shows the generated help output:

```bash
Todo Cli

Usage: cli.exe <COMMAND>

Commands:
  create  Create a new todo item
  list    List all todo items
  help    Print this message or the help of the given subcommand(s)

Options:
  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version
```

### Rust Comments

In the example above we added doc comments to each variant of `TodoCommand`.
But when we run `--help`, that comment text appears in the help output.

That may be puzzling: they are only comments, so why do they show up in the help output at runtime?

Because Rust has three forms of comments.

```rust
// single-line comment (not parsed by the compiler)
// everything after // is commented out

/*
multi-line comment
only content within /* */ is commented out
(also not parsed by the compiler)
*/

/// doc comment (recognized by the compiler and tools)

/**
 * this is also a doc comment
 * it starts with /**
*/
```

What we used is `/// xxx`, a doc comment. It is meta-information the compiler can read.
The compiler and third-party tools treat a doc comment as the documentation of the item it is attached to.

`clap` uses its derive macro `#[derive(Subcommand)]` to read the meta-information of structs and enums at compile time, and doc comments are part of it.
That is why doc comment text shows up in the help output printed at runtime.

### Enum Variants

Rust enums can carry data.

Rework `TodoCommand`.

```rust
#[derive(Debug, Clone, Subcommand)]
pub enum TodoCommand {
  Create {
    #[arg(short, long)]
    title: String,
    #[arg(short, long)]
    content: String,
  },
  List,
}
```

We added two fields, `title` and `content`, to the `Create` variant.

They correspond to the `--title` and `--content` arguments.

`#[arg(short, long)]` tells `clap` that the field is an argument and gives it short and long names.

Running `cargo run -- create --help` shows the generated help:

```bash
Create a new todo item

Usage: cli.exe create --title <TITLE> --content <CONTENT>

Options:
  -t, --title <TITLE>
  -c, --content <CONTENT>
  -h, --help               Print help
```

Modify the `create_todo` method.

```rust
pub fn create_todo(todos: &mut Vec<TodoItem>, title: String, content: String) {
  let mut inputs: Vec<String> = Vec::new();

  if !title.is_empty() {
    inputs.push(title);
  }

  if !content.is_empty() {
    inputs.push(content);
  }

  let mut ok = inputs.len() == 0;
  // ...
}
```

Pattern matching is powerful enough to destructure an enum variant's fields.
Modify `main.rs`:

```rust
// ...
  match args.command {
    TodoCommand::Create { title, content } => todo::create::create_todo(&mut todos, title, content),
    TodoCommand::List => todo::list::list_todo(&todos),
  }
// ...
```

After that, `cargo run -- create --title t --content c` creates a Todo without entering the interactive flow.

### Optional Arguments

At the moment, all arguments of our `create` command are required.
But then we cannot tell whether the user wants to create a Todo from the command line or through the interactive flow.

That calls for optional arguments.

Rust provides an enum type called `Option<T>`.

```rust
pub enum Option<T> {
  None,
  Some(T),
}
```

As you can see, `Option<T>` has two variants: `Some(T)` and `None`, meaning a value is present or absent.

Change the `TodoCommand` enum to the following:

```rust
#[derive(Debug, Clone, Subcommand)]
pub enum TodoCommand {
  /// Create a new todo item
  Create {
    #[arg(short, long)]
    title: Option<String>,
    #[arg(short, long)]
    content: Option<String>,
  },
  /// List all todo items
  List,
}
```

Then modify the `create_todo` method.

```rust
pub fn create_todo(todos: &mut Vec<TodoItem>, title: Option<String>, content: Option<String>) {
  let mut inputs: Vec<String> = Vec::new();

  match title {
    Some(arg_title) => {
      if !arg_title.is_empty() {
        inputs.push(arg_title);
      }
    }
    _ => {}
  }

  match content {
    Some(arg_content) => {
      if !arg_content.is_empty() {
        inputs.push(arg_content);
      }
    }
    _ => {}
  }
  // ...
```

With that rework, `create` can either open the interactive flow with no arguments, or create a Todo straight from arguments.

### Generics

Earlier we used `Option<String>` to make the arguments optional.
So where does the `T` in `Option<T>` come from, and why does replacing `T` with `String` make the argument optional?

Because `T` here is a generic: not a concrete value, but a placeholder for a type that will be specified later.

Rust is a statically typed language with a powerful, flexible type system.
To guarantee type safety, it requires the types of all variables and arguments to be known at compile time.
That makes code more reliable, but it creates a problem: we often have to write large amounts of near-identical code that differs only in type.

For example, reversing a tuple without generics looks like this.

```rust
fn reverse_i8_tuple(tuple: (i8, i8)) -> (i8, i8) {
  let (a, b) = tuple;
  return (b, a);
}

fn reverse_u8_tuple(tuple: (u8, u8)) -> (u8, u8) {
  let (a, b) = tuple;
  return (b, a);
}
```

To avoid that duplication, many statically typed languages introduced generics, and Rust is no exception.
Generics let us write code that is independent of concrete types, avoiding repeated work while keeping type safety.

When we pass `String` to `Option<T>`, `Option<T>` becomes `Option<String>`: `T` narrows from a broad type to the definite type `String`.

Without generics we would need a separate method for every type.

With generics, we only need to append a `<T>` to the item that uses it:

```rust
fn reverse<T>(args: (T, T)) -> (T, T) {
  let (a, b) = args;
  return (b, a);
}
```

Now the `reverse` function can reverse a tuple of any type.

```rust
let a = reverse((1, 2));
let b = reverse(("a", "b"));
```

Note that `T` is not a fixed name; it is only the conventional name for a generic parameter.
A generic can be given any name that follows the variable naming rules.

The example below uses several generics with custom names:

```rust
fn reverse<Rust_1, Rust_2>(args: (Rust_1, Rust_2)) -> (Rust_2, Rust_1) {
  let (a, b) = args;
  return (b, a);
}
```

### if let

Earlier we pattern matched the optional arguments.

```rust
match title {
  Some(arg_title) => {
    if !arg_title.is_empty() {
      inputs.push(arg_title);
    }
  }
  _ => {}
}
```

It works, but the code is long-winded, especially when we only care about one pattern.

Rust provides the `if let` syntactic sugar to match and destructure one particular enum variant while ignoring all the others.

So `create_todo` can become:

```rust
pub fn create_todo(todos: &mut Vec<TodoItem>, title: Option<String>, content: Option<String>) {
  let mut inputs: Vec<String> = Vec::new();

  if let Some(arg_title) = title {
    if !arg_title.is_empty() {
      inputs.push(arg_title);
    }
  }

  if let Some(arg_content) = content {
    if !arg_content.is_empty() {
      inputs.push(arg_content);
    }
  }
  // ...
```

This means: if `title` matches `Some(arg_title)`, destructure `arg_title` and check whether it is empty;
if it does not match, do nothing.

The code is much simpler than before.

## Error Handling

When we implemented data persistence, we wrote the `save_todo_list` method.

```rust
pub fn save_todo_list(save_file: &str, todos: &Vec<TodoItem>) {
  let data = serde_json::to_string(todos).unwrap();
  fs::write(save_file, data).unwrap();
}
```

This keeps the program running, but it plants a hidden risk:
as soon as serialization or the file write fails, the program crashes.

We want the program to handle failures gracefully instead of crashing,
so we need Rust's error handling mechanisms.

Rust has no `try-catch`.
Instead it handles errors explicitly through the enum `Result<T, E>`, where
`T` is the type of the successful return value and `E` is the error type.

```rust
enum Result<T, E> {
    Ok(T),      // on success, returns the result T
    Err(E),     // on failure, returns the error type E
}
```

### unwrap and expect

In `save_todo_list` we used `unwrap`, which pulls a value out of a `Result<T, E>`.

- If the `Result` is `Ok(T)`, it returns `T`;
- If the `Result` is `Err(E)`, the program panics and prints the error message.

There is also the `expect` method. It is similar to `unwrap`, but lets you supply the error message.

```rust
let data = serde_json::to_string(todos).expect("serialization failed");
```

Neither method is recommended in a normal program, because any error crashes it.

A more robust approach is to handle the `Result<T, E>` with `match`.

```rust
pub fn save_todo_list(save_file: &str, todos: &Vec<TodoItem>) {
  match serde_json::to_string(todos) {
    Ok(data) => match fs::write(save_file, data) {
      Err(msg) => {
        println!("save file error: {}", msg);
      }
      Ok(_) => {
        println!("save file success");
      }
    },
    Err(msg) => {
      println!("save file error: {}", msg);
    }
  }
}
```

That way, even if something goes wrong, the program keeps running and tells the user why.

### The try Operator

Rust also provides the `?` operator, which propagates errors automatically and saves us from nested `match` statements.

```rust
pub fn save_todo_list(save_file: &str, todos: &Vec<TodoItem>) -> Result<(), String> {
  let data = serde_json::to_string(todos)?;
  fs::write(save_file, data)?;
  Ok(())
}
```

But running that code directly makes the compiler report an error.

```bash
error[E0277]: `?` couldn't convert the error to `std::string::String`
  --> src\todo\storage.rs:29:44
   |
28 | pub fn save_todo_list(save_file: &str, todos: &Vec<TodoItem>) -> Result<(), String> {
   |                                                                  ------------------ expected `std::string::String` because of this
29 |     let data = serde_json::to_string(todos)?;
   |                ----------------------------^ the trait `From<serde_json::Error>` is not implemented for `std::string::String`
   |                |
   |                this can't be annotated with `?` because it has type `Result<_, serde_json::Error>`
   |
   = note: the question mark operation (`?`) implicitly performs a conversion on the error value using the `From` trait
   = help: the following other types implement trait `From<T>`:
             `std::string::String` implements `From<&mut str>`
             `std::string::String` implements `From<&std::string::String>`
             `std::string::String` implements `From<&str>`
             `std::string::String` implements `From<Box<str>>`
             `std::string::String` implements `From<Cow<'_, str>>`
             `std::string::String` implements `From<Id>`
             `std::string::String` implements `From<char>`
             `std::string::String` implements `From<clap::builder::Str>`
   = note: required for `Result<(), std::string::String>` to implement `FromResidual<Result<Infallible, serde_json::Error>>`
```

That is because `?` can only be used when the return type is a `Result` whose error type matches.

The error message is: ``` `?` couldn't convert the error to `std::string::String` ``` ,

The reason is that `save_todo_list` returns `Result<(), String>`, while the error type of `serde_json::to_string(...)` is `serde_json::Error`.
The `?` operator tries to convert `serde_json::Error` into `String`, but `From<serde_json::Error> for String` is not implemented.

So we need to convert the error so that the return type matches `save_todo_list`'s.

### Function Closures

We can solve this problem with closures.

A closure is an anonymous function that can capture variables from its environment in addition to taking arguments.
A closure can also be passed to a function as an argument.

The syntax is as follows:

```rust
{
  let x = 5;
  // type annotations are not required
  let add_x = |y: i32| -> i32 {
    return x + y;
  }
  println!("{}", add_x(3));
}
```

If there is only one return expression, it can be simplified to `let add_x = |y| x + y;`.

Now that we know about closures, we can rework `save_todo_list`.
We call `map_err` with a closure to convert any error into `String` uniformly.

```rust
pub fn save_todo_list(save_file: &str, todos: &Vec<TodoItem>) -> Result<(), String> {
  let data = serde_json::to_string(todos).map_err(|e| e.to_string())?;
  fs::write(save_file, data).map_err(|e| e.to_string())?;
  Ok(())
}
```

Running it again, it works properly now.

## Finding Todos

The `create` command is basically complete: it can create Todo items from the command line and through the interactive flow.

But our `list` command is still crude: it can only list every Todo item, with no way to filter them.
So we need to improve it.

### Filtering Todos

We will create a `TodoItemFilter` struct to hold the filter configuration.

```rust
pub struct TodoItemFilter {
  pub title: Option<String>,
  pub content: Option<String>,
}
```

`TodoItemFilter` has two fields, the `title` and `content` to filter by.
Since we may want to filter by only one of them, both use the optional type `Option<String>`.

Now let us implement a few methods for it.

First, the constructor.

```rust
impl TodoItemFilter {
  pub fn new() -> Self {
    Self {
      title: Option::None,
      content: Option::None,
    }
  }
}
```

At the start we cannot know what will be filtered, so both `title` and `content` are set to `None`.

### Generic Bounds

Earlier we met generics, which stand in for any type.
But a bare `T` covers too wide a range: the argument we need may be a string, yet numbers and booleans could be passed in just as well.

To fix that, Rust lets you add type bounds to generics so a generic parameter must satisfy certain conditions.
So the generic needs a tighter constraint.

For example, if we want the argument to be convertible into a string, we can use `Into<String>` as the bound.
`Into<String>` means "any type that can be converted into `String`".

```rust
impl TodoItemFilter {
  // ...
  pub fn set_title<T: Into<String>>(&mut self, title: T) {
    self.title = Some(title.into());
  }

  pub fn set_content<T: Into<String>>(&mut self, content: T) {
    self.content = Some(content.into());
  }
}
```

The code above implements the `set_title` and `set_content` methods for `TodoItemFilter`.
We do not care what concrete type `T` is, as long as it satisfies the `Into<String>` bound.
Whether `T` is `String`, `&str`, or `Vec<u8>`, anything convertible into `String` can be passed in.

There are two ways to write type bounds. The first, used above, puts the bound in the generic parameter position and is more common;
the second uses a separate `where` clause and suits complex bounds.

```rust
impl TodoItemFilter {
  // ...
  pub fn set_title<T>(&mut self, title: T) where T: Into<String> {
    self.title = Some(title.into());
  }

  pub fn set_content<T>(&mut self, content: T) where T: Into<String> {
    self.content = Some(content.into());
  }
}
```

### Filter Arguments

Our Todo items currently have two fields, `title` and `content`, and we can filter by either one or by both.

Let us implement a `filter` method on `TodoItemFilter`.

```rust
pub fn filter(&self, list: &Vec<TodoItem>) {
  let mut filtered_list = Vec::<&TodoItem>::new();

  if self.title.is_none() && self.content.is_none() {
    for item in list {
      filtered_list.push(item);
    }
  } else {
    for item in list {
      let mut flag: (bool, bool) = (false, false);

      flag.0 = match &self.title {
        Some(title) => item.title.contains(title),
        _ => true,
      };

      flag.1 = match &self.content {
        Some(content) => item.content.contains(content),
        _ => true,
      };

      if flag.0 && flag.1 {
        filtered_list.push(item);
      }
    }
  }

  for item in filtered_list {
    println!("todo title: {}, content: {}", item.title, item.content);
  }
}
```

This is the `filter` method, implemented on `TodoItemFilter`.
It first creates an empty `filtered_list` for the matching items.
If both `title` and `content` are `None`, every item goes straight into `filtered_list`.
Otherwise it walks the list and checks each item:
only items whose `title` and `content` both contain the filter text are added to `filtered_list`.

Finally it iterates over `filtered_list` and prints the matching items.

Next we rework the `TodoCommand` enum, adding two arguments to the `list` command.

```rust
// ...
/// List all todo items
List {
  #[arg(short, long)]
  title: Option<String>,
  #[arg(short, long)]
  content: Option<String>,
}
// ...
```

Rework `main` to pass the filter arguments to the `list` command.

```rust
// ...
  match args.command {
    TodoCommand::Create { title, content } => {
      todo::create::create_todo(&mut todos, title, content)
    }
    TodoCommand::List { title, content } => todo::list::list_todo(&todos, title, content),
  }
// ...
```

Then rework the `list_todo` function.

```rust
pub fn list_todo(todos: &Vec<TodoItem>, title: Option<String>, content: Option<String>) {
  let mut filter = TodoItemFilter::new();

  if let Some(title) = title {
    filter.set_title(title);
  }

  if let Some(content) = content {
    filter.set_content(content);
  }

  filter.filter(todos);
}
```

Now `cargo run -- list` accepts `--title` and `--content` to filter the results.

## Traits

When implementing `set_title` and `set_content` for the `list` command, we used `Into<String>` as a type bound.
But `Into<T>` is not a type: it is a trait, the mechanism Rust uses to define behavioral contracts, that is, a uniform capability a type can offer.

Think of traits in Rust as interfaces in other languages.

Rust ships many built-in traits. For example, `Into<T>` means a type can be converted into `T`, `From<T>` means a type can be constructed from `T`,
and `Copy` and `Clone` say whether a value can be copied, and so on.

We ran into a trait error early on, when first writing the program:
`String` does not implement the `Copy` trait, so a value cannot simply be assigned.

```bash
6 |   let title = args[1];
  |               ^^^^^^^ move occurs because value has type `String`, which does not implement the `Copy` trait
```

### Declaring Traits

Traits are declared with the `trait` keyword.

```rust
trait PrintName {
  fn PrintName(&self) -> String;
}
```

As with enums, a trait marked with `pub` makes all of its methods accessible from outside.

### Implementing Traits

Implementing a trait is tied to a type. On top of the usual `impl` block, we add the trait name and the `for` keyword.

```rust
trait PrintName {
  fn PrintName(&self) -> String;
}

impl PrintName for TodoItem {
  fn PrintName(&self) -> String {
    "TodoItem".to_string()
  }
}
```

To implement trait B for type A, one of the two must be defined in the current scope, otherwise the impl is rejected.
For example, implementing `Copy` for `String` is impossible, because both are defined in the standard library rather than the current crate.

This is called the orphan rule. It ensures that other people's code cannot break ours, and that we do not inexplicably break theirs.

### Trait Bounds

Earlier we used a trait bound, `T: Into<String>`, meaning `T` must implement the `Into<String>` trait.

Trait bounds constrain not only generics, but also traits themselves.

```rust
trait PrintName: Display {
  fn PrintName(&self) -> String;
}
```

The code above defines the `PrintName` trait and requires any implementing type to implement `Display` as well.
More bounds can be added with `+`: `trait PrintName: Display + Clone` requires both `Display` and `Clone`.

### Argument Bounds

Traits can also constrain argument types.

```rust
trait PrintName: Display {
  fn PrintName(&self) -> String;
}

fn printName(item: &impl PrintName) {
  println!("{}", item.PrintName());
}

// the above is equivalent to

fn printName<T: PrintName>(item: &T) {
  println!("{}", item.PrintName());
}
```

## Implementing a Trait for TodoItem

Earlier we gave `TodoItem` serialization and deserialization methods, which are common in development.
Writing them again for every type would be tedious, so we can declare a trait to hold these shared behaviors.

First, define a `Serializer` trait for the serialization and deserialization methods, then implement it for `TodoItem`.

```rust
pub trait Serializer {
  fn serialize(&self) -> String;
  fn deserialize<S: Into<String>>(s: S) -> Self;
}

impl Serializer for TodoItem {
  fn deserialize<S: Into<String>>(s: S) -> Self {
    serde_json::from_str(&s.into()).unwrap()
  }

  fn serialize(&self) -> String {
    serde_json::to_string(self).unwrap()
  }
}
```

### Default Trait Implementations

Even with the methods extracted into a trait, every implementation still has to write the bodies by hand, which is tedious.

Default implementations save us that work.

```rust
pub trait Serializer {
  fn serialize(&self) -> String {
    serde_json::to_string(self).unwrap()
  }

  fn deserialize<S: Into<String>>(s: S) -> Self {
    serde_json::from_str(&s.into()).unwrap()
  }
}

impl Serializer for TodoItem {}
```

Make the change above and run it. An error appears; let us deal with the one from `serialize` first.

```bash
error[E0277]: the trait bound `Self: Serialize` is not satisfied
    --> src\todo\core.rs:68:31
     |
68   |         serde_json::to_string(self).unwrap()
     |         --------------------- ^^^^ the trait `Serialize` is not implemented for `Self`
     |         |
     |         required by a bound introduced by this call
     |
     = note: for local types consider adding `#[derive(serde::Serialize)]` to your `Self` type
     = note: for types from other crates check whether the crate offers a `serde` feature flag
note: required by a bound in `serde_json::to_string`
    --> C:\Users\Administrator\.cargo\registry\src\rsproxy.cn-e3de039b2554c837\serde_json-1.0.128\src\ser.rs:2209:17
     |
2207 | pub fn to_string<T>(value: &T) -> Result<String>
     |        --------- required by a bound in this function
2208 | where
2209 |     T: ?Sized + Serialize,
     |                 ^^^^^^^^^ required by this bound in `to_string`
help: consider further restricting `Self`
     |
67   |     fn serialize(&self) -> String where Self: Serialize {
     |                                   +++++++++++++++++++++
```

The error is ```the trait bound `Self: Serialize` is not satisfied```,
because `Self` does not satisfy the bound that `serde_json::to_string(self)` requires.

Let us look at the definition of `serde_json::to_string`.

```rust
serde_json::ser
pub fn to_string<T>(value: &T) -> Result<String>
where
  T: ?Sized + Serialize,
// ...
```

It uses a `where` clause requiring `T` to implement `?Sized` and `Serialize`, so let us add the missing bounds.

```rust
pub trait Serializer
where
  Self: Sized + Serialize,
{
  fn serialize(&self) -> String {
    serde_json::to_string(self).unwrap()
  }

  fn deserialize<S: Into<String>>(s: S) -> Self {
    serde_json::from_str(&s.into()).unwrap()
  }
}

impl Serializer for TodoItem {}
```

Run it again: `serialize` is fine now and only `deserialize` complains:

```bash
error[E0277]: the trait bound `Self: Deserialize<'_>` is not satisfied
    --> src\todo\core.rs:75:9
     |
75   |         serde_json::from_str(&s.into()).unwrap()
     |         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ the trait `Deserialize<'_>` is not implemented for `Self`
     |
     = note: for local types consider adding `#[derive(serde::Deserialize)]` to your `Self` type
     = note: for types from other crates check whether the crate offers a `serde` feature flag
note: required by a bound in `serde_json::from_str`
    --> C:\Users\Administrator\.cargo\registry\src\rsproxy.cn-e3de039b2554c837\serde_json-1.0.128\src\de.rs:2680:8
     |
2678 | pub fn from_str<'a, T>(s: &'a str) -> Result<T>
     |        -------- required by a bound in this function
2679 | where
2680 |     T: de::Deserialize<'a>,
     |        ^^^^^^^^^^^^^^^^^^^ required by this bound in `from_str`
help: consider further restricting `Self`
     |
74   |     fn deserialize<S: Into<String>>(s: S) -> Self where Self: Deserialize<'_> {
     |                                                   +++++++++++++++++++++++++++
```

The message ```the trait bound `Self: Deserialize<'_>` is not satisfied``` shows the same cause: an unsatisfied type bound.

Here too the compiler hints that we should add the bound. Doing so gives:

```rust
pub trait Serializer
where
  Self: Sized + Serialize + Deserialize<'_>,
{
  fn serialize(&self) -> String {
    serde_json::to_string(self).unwrap()
  }

  fn deserialize<S: Into<String>>(s: S) -> Self {
    serde_json::from_str(&s.into()).unwrap()
  }
}
```

Run it again: the `deserialize` error is gone, but a new one appears:

```bash
error[E0637]: `'_` cannot be used here
  --> src\todo\core.rs:68:43
   |
68 |     Self: Sized + Serialize + Deserialize<'_>,
   |                                           ^^ `'_` is a reserved lifetime name

For more information about this error, try `rustc --explain E0637`.
```

The message ``` `'_` cannot be used here``` says that `'_` is not allowed in this position,
and ``` `'_` is a reserved lifetime name``` tells us why: `'_` is a reserved lifetime name.

### Lifetimes

A lifetime is the span from the beginning to the end of something.

In Rust it is a compile-time concept: it is used to check that references stay valid and to avoid problems such as dangling pointers.
Usually we do not need to annotate lifetimes, because the compiler infers them; only when it cannot do we have to.

For our purposes, a lifetime in Rust is simply the valid scope of a reference.

```rust
{
  let r;
  {
    let n = 0;
    r = &n;
  }
  println!("r: {}", r);
}
```

The braces split the code above into two levels. In the outer level, the variable `r` is declared without a value.
In the inner level, the variable `n` is declared and the address of `n` is assigned to `r`.

`n` is a local variable whose lifetime ends when the inner level ends, that is, when its braces close.
`r` is a reference to `n`, and its own lifetime runs to the end of the outer braces.

It is fine that `n` has a shorter lifetime than `r`. The problem is assigning a reference to `n` to `r`:
`n` is destroyed when its lifetime ends, leaving `r` pointing at a destroyed variable.

Back to the error in the new `deserialize` method. `'_` is a special lifetime marker used for lifetime elision or a temporary lifetime annotation.
The compiler can infer it automatically, but it is not allowed in a type bound.

Rust requires an explicit lifetime name there, because the compiler cannot infer the concrete lifetime in a bound.

Replace `'_` with `'a` and run again.
> Note that Rust puts no special requirements on lifetime names; by convention a single lowercase letter is used.

The previous error is gone and a new one appears.

### Higher-Ranked Lifetime Bounds

```bash
error[E0261]: use of undeclared lifetime name `'a`
  --> src\todo\core.rs:68:43
   |
68 |     Self: Sized + Serialize + Deserialize<'a>,
   |                                           ^^ undeclared lifetime
   |
   = note: for more information on higher-ranked polymorphism, visit https://doc.rust-lang.org/nomicon/hrtb.html
help: consider making the bound lifetime-generic with a new `'a` lifetime
   |
68 |     Self: Sized + Serialize + for<'a> Deserialize<'a>,
   |                               +++++++
help: consider making the bound lifetime-generic with a new `'a` lifetime
   |
68 |     for<'a> Self: Sized + Serialize + Deserialize<'a>,
   |     +++++++
help: consider introducing lifetime `'a` here
   |
66 | pub trait Serializer<'a>
   |                     ++++
```

Focusing again on ```use of undeclared lifetime name `'a` ```: we used a lifetime that was never declared, and the compiler offers several solutions.

Here is what each one means:

- `Self: Sized + Serialize + for<'a> Deserialize<'a>`:
  This is the most common, most general form. It uses a higher-ranked lifetime bound: whatever lifetime `'a` is, `Self` implements `Deserialize<'a>`.

- `pub trait Serializer<'a>`:
  This makes the trait itself carry a lifetime parameter usable in all of its methods, but it forces every user of the trait to pass a lifetime, which is intrusive.

- `for<'a> Self: Sized + Serialize + Deserialize<'a>,`:
  This also uses a higher-ranked lifetime bound, but `'a` applies to the whole bound: the bound holds for any lifetime `'a`.

We will use the first one, and after the rework it runs with no errors.

## Verifying the Features

At this point the create, view, filter, and persistence features of the Todo CLI are done.
We can still check them by running commands by hand, but as features multiply and logic grows, manual checking becomes tedious and easy to get wrong.

Rust has a powerful built-in test module that lets us verify features automatically instead of testing them by hand over and over.

### Unit Tests

A unit test checks one code unit (usually a function) and verifies that it behaves as expected.
For example, testing an `add` function to confirm that two inputs produce the sum you expect.

Test logic can live in each module, and `cargo test` runs them all in one go.

In Rust, unit test code and the code under test are usually kept in the same file.

```rust
// src/todo/core.rs

// ...
#[cfg(test)]
mod tests {
  // because this is a submodule, we need the super keyword to reference the parent module
  use super::{Serializer, TodoItem};

  #[test]
  fn test_todo_item_creation() {
    let item = TodoItem::new("test1", "content");
    assert_eq!(item.title, "test");
    assert_eq!(item.content, "content");
  }

  #[test]
  fn test_serialization_roundtrip() {
    let original = TodoItem::new("test", "content");
    let serialized = original.serialize();
    let deserialized = TodoItem::deserialize(serialized);

    assert_eq!(original.title, deserialized.title);
    assert_eq!(original.content, deserialized.content);
  }
}
```

In the code above we added two test functions:

- `test_todo_item_creation`: verifies that `TodoItem::new` assigns values correctly.
- `test_serialization_roundtrip`: verifies that a serialized struct can be restored.

After adding this to `src/todo/core.rs`, run `cargo test` to let Rust run the tests.

```bash
test todo::core::tests::test_serialization_roundtrip ... ok
test todo::core::tests::test_todo_item_creation ... FAILED

failures:

---- todo::core::tests::test_todo_item_creation stdout ----

thread 'todo::core::tests::test_todo_item_creation' panicked at src\todo\core.rs:88:9:
assertion `left == right` failed
  left: "test1"
 right: "test"
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace


failures:
    todo::core::tests::test_todo_item_creation

test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

`todo::core::tests::test_todo_item_creation` failed with:

```bash
assertion `left == right` failed
  left: "test1"
 right: "test"
```

The assertion failed because the two values do not match.
Back in the test code, change the mistyped `test1` in `let item = TodoItem::new("test1", "content");` to `test`.
Run `cargo test` again:

```bash
running 2 tests
test todo::core::tests::test_todo_item_creation ... ok
test todo::core::tests::test_serialization_roundtrip ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

All our tests pass, so the features behave as expected.

### Assertions

An assertion is a checkpoint in a program: when execution reaches it, the program's state is checked.
If the check passes, execution continues; if it fails, the program throws an exception and stops.

Rust commonly uses these assertions:

- `assert!(expr)`: throws an exception if `expr` is false.
- `assert_eq!(left, right)`: throws an exception if `left` does not equal `right`.
- `assert_ne!(left, right)`: throws an exception if `left` equals `right`.

Prefixing with `debug_`, as in `debug_assert!(expr)`, makes it run only in `Debug` mode.

### Conditional Compilation

In the test code, `#[cfg(test)]` sits on the `tests` module.

That is conditional compilation: the code in `tests` is compiled only when the `test` condition holds,
that is, only when `cargo test` runs.

Beyond `test`, more conditions can be combined, for example:

- `#[cfg(all(target_os="windows", test))]` compiles under `cargo test` only when the target platform is `windows`.
- `#[cfg(all(any(target_os = "ios", target_os = "android"), test))]` compiles under `cargo test` only when the target platform is mobile.
- `#[cfg(all(not(any(target_os = "ios", target_os = "android")), test))]` compiles under `cargo test` only when the target platform is not mobile.

Conditional compilation can be applied almost anywhere, from a single variable to a whole module.

## Summary

In this tutorial we took a first step in Rust, turning theory into practice by building a Todo CLI by hand.
From the initial "Hello, world!" to a program that creates and lists Todo items from the command line and persists them, we covered Rust's key ideas, from basic syntax to its core features.

Along the way we came to understand the design that sets Rust apart from other languages:

- The ownership system uses strict memory management rules to avoid dangling pointers and double frees.
- Borrowing and lifetimes ensure that references are valid.
- Traits and generics make code abstraction and reuse flexible.

We also practiced the engineering side of Rust:
managing the project and its dependencies with cargo, splitting the code into modules,
leaning on third-party libraries such as `serde` and `clap` for speed, and guarding code quality with unit tests.

That said, the current Todo CLI still has plenty of room to grow:

It supports only the create and list commands, with no way to delete or modify Todo items, so it cannot handle the everyday case where a task changes.

A Todo item holds only a title and content, with no status marker such as "done" or "not done", which makes progress hard to track.

On top of that, details such as fault tolerance in the command-line interaction and finer-grained filtering (by status, say) remain to be improved.

But these gaps are exactly the opportunity for deeper learning.

By extending the features and refining the implementation, we can consolidate what we know about Rust pattern matching, error handling, enum design, and more.
Putting memory safety and high performance to work in real code is what lets this simple tool grow into a practical, robust productivity tool.

## Implementations in Other Languages

The repository also ships three equivalent implementations of the same Todo CLI in Go, Python, and TypeScript,
found in the `golang/`, `python/`, and `typescript/` directories.

They follow the Rust version as closely as possible in directory structure, function and struct naming, and execution flow,
and they use exactly the same `todo.json` format, so all four implementations can read and write the same data.

### Directory Structure

The Go version has the following directory structure:

```sh
# golang directory structure
- go.mod                    # corresponds to Cargo.toml
- src
  - main.go                 # corresponds to src/main.rs
  - todo
    - todo.go               # corresponds to src/todo.rs, only declares submodules
    - core
      - core.go             # corresponds to src/todo/core.rs
      - core_test.go        # corresponds to #[cfg(test)] mod tests in src/todo/core.rs
    - create
      - create.go           # corresponds to src/todo/create.rs
    - list
      - list.go             # corresponds to src/todo/list.rs
    - storage
      - storage.go          # corresponds to src/todo/storage.rs
```

The Python version is laid out as follows. In Python a directory is itself a package,
so `todo/__init__.py` plays the part of `src/todo.rs`, which only declares modules:

```sh
# python directory structure
- pyproject.toml            # corresponds to Cargo.toml
- src
  - main.py                 # corresponds to src/main.rs
  - todo
    - __init__.py           # corresponds to src/todo.rs, declares submodules
    - core.py               # corresponds to src/todo/core.rs, includes inline unit tests
    - create.py             # corresponds to src/todo/create.rs
    - list.py               # corresponds to src/todo/list.rs
    - storage.py            # corresponds to src/todo/storage.rs
```

The TypeScript version is laid out as follows. TypeScript likewise has no module declaration file,
so `todo/todo.ts` takes over the role of `src/todo.rs` through namespace re-exports:

```sh
# typescript directory structure
- package.json              # corresponds to Cargo.toml
- tsconfig.json             # compiler configuration
- src
  - main.ts                 # corresponds to src/main.rs
  - todo
    - todo.ts               # corresponds to src/todo.rs, declares submodules
    - core.ts               # corresponds to src/todo/core.rs
    - core.test.ts          # corresponds to #[cfg(test)] mod tests in src/todo/core.rs
    - create.ts             # corresponds to src/todo/create.rs
    - list.ts               # corresponds to src/todo/list.rs
    - storage.ts            # corresponds to src/todo/storage.rs
```

### Running and Testing

```bash
# Go implementation, requires go 1.27 or later (the generic method in SetTitle corresponds to Rust's generic parameters)
cd golang
go run ./src --help
go run ./src create --title t --content c
go run ./src list --title rust
go test ./...           # unit tests
go build -o cli ./src   # build the binary

# Python implementation, requires python 3.10 or later (union types and match statements)
cd python
python3 src/main.py --help
python3 src/main.py create --title t --content c
python3 src/main.py list --title rust
python3 src/todo/core.py                      # unit tests
PYTHONPATH=src python3 -m unittest todo.core  # can also be run with unittest

# TypeScript implementation, requires node 23.6 or later (native support for running TypeScript directly)
cd typescript
node src/main.ts --help
node src/main.ts create --title t --content c
node src/main.ts list --title rust
node --test src/todo/core.test.ts   # unit tests (npm test)
npm run typecheck                   # type checking (run npm install first)
```

All three implementations support the same argument forms as the Rust version: `-t/--title`, `-c/--content`, `--title=value`,
plus `--help`, `--version`, and the `help` subcommand.

### Comparison with Rust

| Rust | Go | Python | TypeScript |
| --- | --- | --- | --- |
| `struct Program` + `Program::parse()` | `Program` + `(*Program).Parse()` | `Program` + `Program.parse()` | `Program` + `Program.parse()` |
| `enum TodoCommand` variants carrying data | `TodoCommand{Command, Title, Content}` | union type made of the `Create` and `List` data classes | union type with a discriminant field `kind` |
| `Option<String>` | `*string` (nil means None) | `str \| None` | `string \| null` |
| `struct TodoItem` + serde derive macro | `TodoItem` + json tags | `@dataclass TodoItem` | `class TodoItem` + `JSON.stringify` |
| `TodoItem::new` / `create_todo_item` | `NewTodoItem` / `CreateTodoItem` | `TodoItem.new` / `create_todo_item` | `TodoItem.new` / `createTodoItem` |
| default implementation of the `trait Serializer` | `Serializer` interface + generic function `Deserialize[T]` | `Serializer` abstract base class + inheritance | `Serializer` abstract base class + `extends` |
| `match args.command { .. }` | `switch program.Command.Command` | `match program.command: case Create(..)` | `switch (command.kind)` with destructuring |
| `create_todo(&mut todos, ..)` | `CreateTodo(&todos, ..)` | `create_todo(todos, ..)` | `createTodo(todos, ..)` |
| `set_title<T: Into<String>>` | `SetTitle[T ~string]` | `set_title(title: str)` | `setTitle(title: string)` |
| `save_todo_list` returns `Result<(), String>` | returns `error` | throws `OSError` | throws an exception |
| `#[cfg(test)] mod tests` | `core_test.go` | inline `TodoItemTest` in `core.py` | `core.test.ts` |

### Implementation Notes

The three languages have different type systems, so the ports make these trade-offs:

- Enums: Rust enum variants can carry data, while Go has no enums, so a type constant together with a struct is used instead;
  Python represents each variant with a data class and the whole enum with a union type, destructured by a `match` statement in `main`;
  TypeScript uses a discriminated union and pattern matches in `main` with `switch` plus destructuring.
- Optional values: `Option<String>` maps to `*string` in Go, `str | None` in Python, and `string | null` in TypeScript.
- Traits: a Rust trait can provide default implementations for a type, but a Go interface cannot, so Go constrains types with an interface
  and provides default implementations through the generic function `Deserialize[T]`; Python and TypeScript abstract base classes can give default implementations directly, which translates most directly.
- Error handling: the `Result<(), String>` returned by `save_todo_list` maps to `error` in Go, and to exceptions in Python and TypeScript.
- Command-line parsing: none of the three has clap's derive macro, so arguments such as `-t/--title` are parsed by hand,
  keeping the help text and exit codes consistent with clap (`--help` exits with 0, an argument error exits with 2).
- Serialization: all three use the same compact format as `serde_json` (no spaces after `,` and `:`, non-ASCII characters not escaped),
  so the `todo.json` they write is byte-for-byte identical to the Rust version.

Issues each language had to handle on its own:

- Go: no enums and no optional values, so type constants plus a struct and pointers express `Option`; there are also no default trait methods,
  so an interface constrains the type and a generic function supplies the default implementation.
- Python: there is no "multi-line input" primitive, so input is read with `input()`;
  and since `list` and `filter` are built-in names that parameter names would shadow, they were renamed to `todos` and `item_filter`.
- TypeScript: types are erased at runtime, so `storage.ts` validates field types explicitly
  in order to print `parse file error` like serde does when the data is invalid;
  reading standard input in Node is usually asynchronous, so to keep `create_todo` synchronous,
  `create.ts` uses `fs.readSync` and maintains its own line buffer.

Three deliberate differences:

- Python reads with `input()`, which strips the trailing newline, so a blank line prompts again
  (Rust's `read_line` keeps the newline, meaning that check only really holds at the end of input).
- Go and TypeScript keep Rust's line-reading semantics (newline included, a blank line yields an empty string),
  but unlike Rust they do not spin at the end of input: they raise an exception/error, matching `.expect("read line failed")`.
- Go and Python both have identifiers that would shadow built-ins (`list`, `filter`), so they were renamed; TypeScript needs no renaming and keeps Rust's names.

> Note: each implementation stores its data as `todo.json` in the current working directory,
> so running inside `golang/`, `python/`, or `typescript/` writes a `todo.json` in that directory (independent of the one in the repository root).

## References

- [The Rust Book (Chinese)](https://rusty.course.rs/)
- [Official Rust Website](https://www.rust-lang.org/)
- [The Rust Reference](https://doc.rust-lang.org/stable/reference/introduction.html)
- [Rust Language Bible (Chinese)](https://course.rs/about-book.html)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [Learn Rust with 100 Exercises (Chinese)](https://colobu.com/rust100/)
- [The Rust Programming Language, Chinese Edition](https://rustwiki.org/zh-CN/book/title-page.html)
- [Rust Nomicon 2018, Chinese Translation](https://learnku.com/docs/nomicon/2018)

---

[English](README.md) | [中文](README-zh.md)

