# Rust Tutorial

[English](README.md) | [中文](README-zh.md)

Rust is a systems programming language that has grown rapidly in recent years.

It combines high performance with memory safety, and is widely used in embedded systems, operating systems, WebAssembly, backend services, and command-line tools.

C "trusts that you know what you are doing", which is why it lets you manipulate memory and pointers with almost no restrictions.
Rust is the exact opposite: at the language design level it "does not trust developers" and assumes "you will make a mistake sooner or later".

For this reason, Rust introduced the ownership system, borrow checking, and lifetimes, so that code which "might break in the future" is kept out at compile time.
This also means that while writing code, developers often need to take the time to understand these mechanisms and work to "convince" the compiler to accept their writing.
Although the process is winding, what you get in the end is a more robust and safer program.

In this tutorial we will learn Rust by building a simple CLI (Command Line Interface) program for recording Todo items.

On top of that, the repository also provides the same program [implemented in Go, Python, and TypeScript](#implementations-in-other-languages), so you can compare how different languages express the same design.

## Getting Prerequisites Ready

First, get the Rust installer from the [official Rust website](https://www.rust-lang.org/learn/get-started).

Then follow the official documentation to set up the environment.

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

Our CLI records Todo items, so we need to be able to input content.

The Rust standard library provides `std::env` for obtaining environment information. It offers an `args` function that returns the command-line arguments.

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

As you can see, the input we get is in array form, and its first item is the path to our executable.

What we need is the input content, namely `a` and `b`.

```rust
fn main() {
  let args: Vec<String> = std::env::args().collect();

  let title = args[1];
  let content = args[2];

  println!("todo title: {}, content: {}", title, content);
}
```

Run `cargo run -- a b`. You will find that it reports an error:

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

It means: a value cannot be taken out of a `Vec<String>`, because the `String` type does not implement the `Copy` trait and therefore cannot be copied implicitly.

As mentioned earlier:

> At the language design level, Rust "does not trust developers" and assumes "you will make a mistake sooner or later".
>
> For this reason, Rust introduced the ownership system, borrow checking, and lifetimes, so that code which "might break in the future" is kept out at compile time.

This problem is caused by the ownership system that Rust introduced.

According to the Rust ownership rules:

- Every value has an owner.
- Each value can have only one owner at a time.
- When the owner goes out of scope, the value is dropped.

With that, the error above is easy to understand.

We try to take a value out of the `Vec<String>` type, but according to the ownership principle, every value can have only one owner.
Therefore `Vec<String>` owns all the `String` elements inside it.

When we access an element such as `args[1]`, we are in fact trying to "move" the ownership of that element to another variable. That violates the ownership rules,
because `args` may still be used later; if the ownership of an element were moved away, its internal state would become inconsistent, and problems such as dangling pointers or double frees could appear.

### References and Borrowing

Rust "does not trust developers" at the language design level, so it adopts the ownership system to enforce memory safety.
Because of this, the compiler is very "smart": it not only tells you where the error is, but also offers suggestions for fixing it.

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
Therefore it is constrained by the referenced object: when `args` becomes invalid, its reference becomes invalid too.

The second approach is `let title = args[1].clone();`, which clones the value of `args[1]`
and moves that value into the `title` variable, so that when `args` becomes invalid, using `title` is not affected.

Therefore we choose the second approach, explicitly calling the `clone` method to clone a copy of `args[1]`.

> Creating a reference is called borrowing. A reference is the result of that borrowing.

Running `cargo run -- a b` again, we can see that it compiles.

### Mutable Variables

In the current implementation, every run of the program requires two arguments (title and content), otherwise the program reports an error due to out-of-bounds indexing.
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

In the code above we check the input arguments: as soon as the number of arguments is greater than 2, the third argument is used as the content; otherwise the default value is used.

Executing `cargo run -- a`, we find another error.

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

This is because, for the sake of safety and readability, Rust makes all variables immutable by default.
The error means: you cannot assign to the immutable variable `content` a second time, unless it is declared mutable.

The compiler has already given us the hint. Just add the `mut` keyword after `let`.

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

Executing `cargo run -- a` again, it runs successfully.

### Variable Types

Rust is a strongly typed language, which means variables must have a definite type at compile time.

There are two ways to determine a type: explicit declaration and implicit inference.

Explicit declaration uses `:` after the variable name to specify the type.
For example: `let args: Vec<String> = std::env::args().collect();` specifies the type of the variable `args` as `Vec<String>`.

Implicit inference means the compiler infers the type of a variable from its value and context.
Rust has a powerful type inference mechanism, so in most cases we do not need to annotate types manually.
The compiler infers types automatically, and manual annotation is needed only when it cannot.

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
`String`, on the other hand, is a string type allocated dynamically at compile time with a variable length.

The `args` we used earlier is a `Vec<String>`, which is a collection of dynamic strings.

## Control Flow

Control flow means controlling the flow of a program.

Without control flow, a program executes line by line, from top to bottom.
Control flow statements let us selectively execute a block of code based on a condition, or repeatedly execute a block of code,
which gives a program the ability to make decisions and loop.

### if/else Branches

`if`/`else` is the most commonly used control flow statement in Rust.

It is used to test whether a condition holds.
Its condition must return a boolean value, not any other type.

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

The code above means: if the condition `len > 2` holds, use `args[2].clone()` as the value of `content`;
otherwise, use `String::from("default content")` as the value of `content`.

> Rust is an expression-oriented language; in fact most constructs can return a value.

### Loops

In Rust, the looping constructs are:

- A `loop` runs forever until it hits a `break` statement.
- A `while` loop runs as long as its condition holds.
- A `for` loop iterates over every element of a collection.

We will use `while` to implement an interactive command-line input that collects the Todo title and content step by step, and asks for confirmation before creating the Todo.

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

In the code above, we use a `while` loop to build an interactive command-line program for creating Todo items.

We use a state variable `ok` to control the loop: when `ok` is `false`, the loop ends.
And when the content entered by the user is empty, we use the `continue` statement to skip the current iteration.

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

Both `while` and `loop` can be used for looping, and their effect can be said to be equivalent.

The difference between them is:

- `while` suits condition-driven loops, such as reading user input and confirming it.
- `loop` suits cases with more complex structure where the loop must be controlled manually, for example game development.

Now, executing `cargo run -- create` takes you into an interactive interface for creating Todo items.

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

Compared with `while` and `loop`, which require manual index management, `for` iterates over a collection more concisely and safely.
It is the preferred way to process collections in Rust.

## Slices and Arrays

In the earlier code we used the `String` type and the `&str` type.
But if `&str` exists, why use `String` at all?

Because in Rust, a string of type `String` is a dynamically sized string whose characters can be added or removed at any position,
while a string of type `&str` is a statically sized string whose length is fixed at compile time and cannot be changed.

`&str` suits read-only borrowing, while `String` suits modification.

### Slices

A slice lets you reference part of a collection's consecutive elements instead of the whole collection. The `&str` type is exactly a string slice.

The slice syntax is `&[start..end]`, where `start` is the starting position of the slice and `end` is the ending position.
Note that the slice range is half-open: it includes the `start` position and excludes the `end` position.

For example: with `let s = "hello world";`, `s` is a string slice whose type is `&str`.
`&s[0..5]` means taking the first 5 characters of the string `s`, namely `"hello"`.

The bounds can be omitted: from zero it can be written as `&s[..5]`, and to the end as `&s[6..]`.

> Rust strings are UTF-8 encoded, so a slice must be cut at valid character boundaries, otherwise the program will panic.

Slices are a very common feature: they avoid copying, which improves efficiency, and they provide a flexible view over data.

### Arrays

Arrays in Rust also have a fixed length at compile time, require all elements to be of the same type, and offer high performance. They are defined with `let var: [type; length] = [];`.
For example: `let arr: [i32; 5] = [1, 2, 3, 4, 5];` declares an array of type `i32` with length 5.

If you need a dynamic array, Rust provides the dynamic array `Vec<T>`, whose length can change at runtime. It is commonly used for a variable amount of data, such as user input and command-line arguments.
The `Vec<String>` we used earlier is exactly such a dynamic array whose element type is `String`.

## Pattern Matching

At the moment our CLI program contains two commands:

- `create`: create a Todo item.
- `list`: view the Todo list.

But as the features grow, the code gradually becomes bloated and hard to maintain.

To solve this problem, Rust offers a more elegant and powerful approach: pattern matching with `match`.

We can use `match` to match against the input and run the corresponding logic for each match.

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

From the code above it is not hard to see that `match` resembles `switch` in other languages,
but Rust's `match` is more powerful than `switch`. It can:

- Match multiple possible values.
- Support variable binding and destructuring.
- Cover all cases by requirement, while allowing `_` to match everything.
- Be an expression at the same time, so it can return a value.
- Support guard conditions, adding extra constraints with `if`.

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

To express the relationship between them better, we can organize them together with a Rust struct.

A struct is a data type we can define ourselves. It packs multiple fields together into one whole, which makes them easier to manage, pass around, and extend.

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

In the code above we defined a struct named `TodoItem`, containing the two attributes `title` and `content`, which represent the title and content of a Todo item.

In the `main` function we use a `Vec<TodoItem>` to store multiple Todo items, and each Todo item is an instance of the struct.

When the `"list"` command is matched, we iterate over the `todos` list and print the title and content of each Todo, implementing a simple viewing feature.

## Functions

In the earlier code we defined the `todos` variable to store Todo items, and instantiated Todo items one by one before adding them to `todos`.

The code that instantiates a Todo item looks like this, and as you can see, it is a bit tedious:

```rust
TodoItem {
  title: "learn rust".to_string(),
  content: "read rust book".to_string(),
}
```

To avoid writing the same conversion and construction over and over, we can use Rust functions.

A function is a block of code that can be called repeatedly, used to accomplish a specific task. It can:

- Isolate a piece of functionality so it can be reused, avoiding duplicated code.
- Describe its purpose through its name, making the code structure clear and improving readability.
- Require changes only inside the function, without affecting external callers, which improves maintainability and extensibility.
- Change its internal behavior and implement different functionality by passing different arguments.
- Return a value, enabling interaction between the outside and the inside.

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
Inside it, the two `&str` arguments are converted into `String` values and bound to an instance of type `TodoItem`.

After that, we only need `create_todo_item("title", "content");` to instantiate a value of type `TodoItem`.

Compared with the earlier approach of manually specifying the struct type, listing every field, and converting each string one by one, using a function greatly reduces duplicated code and improves development efficiency.

By encapsulating the `create_todo_item` function, we only need to pass in the title and content to quickly create a `TodoItem` instance, which is both concise and easy to read and maintain.

This style of encapsulation is very common in real development, and it reflects the core idea of function abstraction: hide the implementation details and expose a clear interface.

### Function Return Values

In `create_todo_item` we used the `return` keyword to return an instance of type `TodoItem`.

But in fact, we do not need the `return` keyword at all. The function can be changed to:

```rust
fn create_todo_item(title: &str, content: &str) -> TodoItem {
  TodoItem {
    title: title.to_string(),
    content: content.to_string(),
  }
}
```

Removing the trailing `;` makes it possible to return data. That is because Rust takes the value of the last expression in the function body as the return value by default.
By removing the trailing `;`, we turn a statement into an expression, so Rust can use the value of that expression as the return value.

The `return` keyword is needed only when you want to return early.

### Tuples

A tuple is a compound type formed by combining multiple types. Both its length and its order are fixed.
We can simply think of a tuple as an array whose type order cannot be changed.

```rust
let tup: (i32, f64, &str) = (1, 1.0, "1");
```

Tuples allow their contents to be accessed with `.`.

```rust
let a = tup.0
let b = tup.1
let c = tup.2
```

They are often used to wrap multiple values and hand them to other places.

### The Unit Type

The unit type in Rust has exactly one value, `()`.
It is actually a special tuple, but note that a tuple in Rust must never be empty; if it is empty, it is no longer a tuple.

Usually, the unit type is used to mean "no return value".

A function with no return value is in fact equivalent to returning an empty tuple `()` by default.

## Modules

As the program grows more complex, our `main.rs` file accumulates more and more code, with all the logic piled together, which hurts readability and makes maintenance and extension harder.

In Rust, modularization is a common way to organize code: split the code into multiple files and let each file take care of a different piece of functionality.
That makes the code structure clearer and the division of responsibilities explicit.

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

In the code above you can see that whether it is a struct or a function, there is a `pub` keyword before its declaration. `pub` means the struct or function is public and other modules can access it.

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

In the code above you can see the statement `use super::core::TodoItem;`.
It is importing content from another module.

Rust uses folder-like paths to reference the contents of different modules, and provides three path prefixes:

- `super`, which means the parent module of the current module.
- `self`, which means the current module itself.
- `crate`, which means the current root module, i.e. the `src` directory; for a third-party library, it is replaced by the library name.

Going back to `use super::core::TodoItem;`, we can tell that it imports and uses `TodoItem` from the `core` submodule of the parent module of the `list` module.
In other words, it brings `TodoItem` in from the sibling module `core`.

> Imported content must be made public with the `pub` keyword, otherwise it cannot be imported.

### Module Declarations

```rust
// src/todo.rs
pub mod core;
pub mod create;
pub mod list;
```

We can declare submodules with the `mod` keyword. Likewise, a submodule needs the `pub` keyword to be exposed to the outside.

In Rust, every module has a `mod.rs` file, which is the entry file of the module.
In a `mod.rs` file we can define the module's public content, such as structs, functions, and submodules.

If the `rustc` version in use is older than 1.30, this is the only way to declare a module entry.

But from 1.30 onwards, you can create a `.rs` file with the same name as the module, next to the module directory, and use it as the module entry declaration.

That is exactly what is used here: a `.rs` file named after the module serves as the module entry declaration.

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

At the moment our task data is kept in memory. When the program exits, that data disappears with it.

To make the user's data available the next time the program starts, we need to persist the data, that is, save it to disk.

A simple and common approach is to save the data in a file: read the task list from the file when the program starts, and write the updated tasks back to the file when the program exits or the data changes.

To implement this, we first need to make the data support serialization and deserialization.

- Serialization is converting in-memory objects such as structs into a storable format.
- Deserialization is converting such a format back into struct objects.

### Adding Dependencies

In real development we usually encapsulate commonly used functionality so it can be reused later.

Going one step further, such functionality can be packaged as a library and published online so others can use it too.
If a project uses such a library, the project depends on it, which makes it a dependency of the project.

`cargo` is Rust's package management tool. We can use it to install the library packages a project depends on.

To make `TodoItem` serialize/deserialize correctly, we need to bring in the third-party libraries `Serde` and `serde_json`.

Run the following commands in the project root directory:

```bash
cargo add serde --features derive     # add the serde dependency and enable the derive feature
cargo add serde_json                  # add the serde_json dependency
```

> serde is a powerful serialization/deserialization library supporting many formats, including JSON and YAML.
>
> serde_json is the implementation based on the JSON format.

### Implementing Methods for a Struct

In Rust we can use the `impl` keyword to define methods for a struct, organizing the struct and its behavior together.

Let us add creating, serializing, and deserializing methods to `TodoItem`:

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
which automatically implements the conversion logic `Serde` needs for `TodoItem`, avoiding the complexity of implementing it by hand.

In addition, we added:

- The `new` method: creates a new `TodoItem`; `TodoItem::new(...)` can now replace the earlier `create_todo_item(...)`.
- The `serializer` method: converts the current instance into a JSON string.
- The `deserializer` method: restores a `TodoItem` instance from a JSON string.

In this way we have given `TodoItem` basic serialization and deserialization. Next, we can use files in the program to save and read task data.

### self and Self

In the code above you can see the `self` keyword in the parameter list of the struct's instance methods.
It refers to the current instance, equivalent to `this` or `self` in other languages.

We can access the attributes of the current instance through `self.title`, `self.content`, and so on.

Other than that, it is no different from any other parameter.

`Self`, on the other hand, refers to the current type. It is equivalent to using the type name directly,
but it keeps the code unchanged under circumstances such as type renaming, which makes the code more stable and readable.

### File Operations

We have now implemented serialization and deserialization for `TodoItem`. Next, we need to store the data in a file to achieve persistence.

Rust provides the standard library `std::fs` for reading and writing files. We will use it to implement the following two features:

- Save the Todo list to a file.
- Read the Todo list into the program.

Add the file `src/todo/storage.rs`, and declare and expose that module in `src/todo.rs`.

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

That way, when we run the following commands:

```bash
cargo run -- list    # show the Todo list (including the initial default content)
cargo run -- create  # add a Todo item (the change is saved)
```

Data is automatically read from and written to `todo.json`, giving us complete local persistence.

## Enums

At the moment our program implements the `create` and `list` commands by matching on `args[1]`:

```rust
match args[1].as_str() {
  "create" => { ... }
  "list" => { ... }
  _ => println!("unknown command"),
}
```

Although simple and intuitive, this string-based matching has the following problems:

- As commands are added, the `match` branches become long-winded.
- Typos easily cause errors, with no type guarantees.
- The argument structure of commands is hard to organize and extend uniformly.
- Help messages such as --help cannot be generated automatically.

To solve this, we will combine Rust enums with the third-party library `clap` to build a CLI program that is easier to maintain and extend.

> clap is a powerful Rust library for parsing command-line arguments. It can generate help information for command-line arguments automatically and supports a rich set of argument types and validation rules.

Run the following command in the project root directory:

```bash
cargo add clap --features derive # add the dependency and enable the derive feature
```

### Why Use Enums

Enums appear in more or less every programming language.

Their purpose is to represent a finite set of mutually exclusive possible values, such as Monday through Sunday, or gender.

Compared with enums in other languages, Rust enums are more flexible and powerful:

- Each variant can carry different data.
- They combine strongly with pattern matching for complex control flow.
- They can be used together with `trait`s and methods to build rich abstractions.

This makes enums a natural fit for representing the command structure of a CLI: each command corresponds to an enum variant, and each variant carries the arguments it needs.

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

The code above defines an enum named `TodoCommand` with two values, `Create` and `List`.
We used the derive macro `#[derive(Debug, Clone, Subcommand)]` to automatically implement three traits for the enum: `Debug`, `Clone`, and `Subcommand`.

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

In the code above we defined a `Program` struct with a field `command` that receives the subcommand.

`#[command(version, about, long_about = "Todo Cli")]` tells `clap` to generate the `--version` and `--help` arguments automatically.

`#[command(subcommand)]` tells `clap` that this field corresponds to a subcommand.

Running `cargo run -- --help` shows the generated help information:

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

In the example above, we added doc comments to each variant of TodoCommand.
But when we run `--help`, the comment content automatically appears in the help information.

This may be puzzling: we only added some comments, so why do they appear in the help output at runtime?

That is because there are three forms of comments in Rust.

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

What we used is `/// xxx`, a doc comment. It is meta-information the compiler can recognize.
The content of a doc comment is parsed by the compiler and third-party tools as the documentation of the item it is attached to.

`clap` uses its derive macro `#[derive(Subcommand)]` to read the meta-information of structs and enums at compile time, and doc comments are part of that.
That is why the content of doc comments shows up in the help information printed at runtime.

### Enum Variants

Rust enums support carrying data.

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

They correspond to the `--title` and `--content` arguments respectively.

`#[arg(short, long)]` tells `clap` that the field corresponds to an argument, and specifies its short and long names.

Running `cargo run -- create --help` shows the help information generated automatically:

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

Pattern matching is quite powerful: it can destructure the fields of an enum value.
Modify `main.rs`:

```rust
// ...
  match args.command {
    TodoCommand::Create { title, content } => todo::create::create_todo(&mut todos, title, content),
    TodoCommand::List => todo::list::list_todo(&todos),
  }
// ...
```

After that, we can use `cargo run -- create --title t --content c` to create a Todo without entering the interactive interface.

### Optional Arguments

At the moment, the arguments of our `create` command are all required.
But that way we cannot tell whether the user wants to create a Todo from command-line arguments or through the interactive interface.

So we need optional arguments.

Rust provides an enum of type `Option<T>`.

```rust
pub enum Option<T> {
  None,
  Some(T),
}
```

As you can see, the `Option<T>` enum has two values: `Some(T)` and `None`, representing a value being present or absent.

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

With that rework done, our `create` command can either enter the interactive interface with no arguments, or create a Todo directly from arguments.

### Generics

In the earlier examples we used `Option<String>` to make the arguments optional.
So where does the `T` in `Option<T>` come from, and why does replacing `T` with `String` make the argument optional?

Because `T` here is a generic. It is not a concrete value, but a placeholder standing for a type that will be specified later.

Rust is a statically typed language with a powerful and flexible type system.
To guarantee type safety, Rust requires the types of all variables and arguments to be determined at compile time.
That improves the reliability of the code, but it also brings a problem: we often have to write large amounts of structurally similar code that differs only in type.

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

To solve the problem of duplicated types, many statically typed languages introduced generics, and Rust is no exception.
Generics let us write general code independent of concrete types, avoiding duplicated work while keeping type safety.

When we pass `String` into `Option<T>`, `Option<T>` becomes `Option<String>`. `T` narrows from a broad type to the definite type `String`.

Without generics we would need to implement a separate method for each type.

But with generics, we only need to append a `<T>` after the item that uses it:

```rust
fn reverse<T>(args: (T, T)) -> (T, T) {
  let (a, b) = args;
  return (b, a);
}
```

Then we can use the `reverse` method to reverse a tuple of any type.

```rust
let a = reverse((1, 2));
let b = reverse(("a", "b"));
```

Note that `T` is not a fixed name; it is merely the conventional name for a generic parameter.
If a developer prefers, a generic can have any name that follows the variable naming rules.

The following example shows how to use multiple generics with custom names:

```rust
fn reverse<Rust_1, Rust_2>(args: (Rust_1, Rust_2)) -> (Rust_2, Rust_1) {
  let (a, b) = args;
  return (b, a);
}
```

### if let

In the earlier code we pattern matched the optional arguments.

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

Although it works, the code is a bit long-winded, especially when we only care about one specific pattern.

Rust provides the `if let` syntactic sugar, used to match and destructure one particular enum variant while ignoring all other possible values.

So we can change `create_todo` to this:

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

This code means: if `title` matches `Some(arg_title)`, destructure `arg_title` and check whether it is empty.
If it does not match, do nothing.

As you can see, the code is much simpler than before.

## Error Handling

While implementing data persistence, we wrote the `save_todo_list` method.

```rust
pub fn save_todo_list(save_file: &str, todos: &Vec<TodoItem>) {
  let data = serde_json::to_string(todos).unwrap();
  fs::write(save_file, data).unwrap();
}
```

Although this makes the program run, it also plants a hidden risk:
as soon as serialization fails or the file write fails, the program crashes.

We want the program to handle problems gracefully even when something goes wrong, instead of crashing.
So we need to bring in Rust's error handling mechanisms.

Rust has no `try-catch` mechanism.
Instead, it handles errors explicitly through the enum `Result<T, E>`.
`T` is the type of the successful return value, and `E` is the error type.

```rust
enum Result<T, E> {
    Ok(T),      // on success, returns the result T
    Err(E),     // on failure, returns the error type E
}
```

### unwrap and expect

We used `unwrap` in the `save_todo_list` method. It is used to get a value out of a `Result<T, E>`.

- If the `Result` is `Ok(T)`, it returns `T`;
- If the `Result` is `Err(E)`, the program panics and prints the error message.

We can also use the `expect` method. It is similar to `unwrap`, but it returns a custom error message.

```rust
let data = serde_json::to_string(todos).expect("serialization failed");
```

But neither of these methods is recommended in a normal program, because any error will crash the program.

A more robust approach is to use a `match` to handle the `Result<T, E>`.

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

Rust also provides the `?` operator, used to propagate errors automatically. It saves us from nested `match` statements.

```rust
pub fn save_todo_list(save_file: &str, todos: &Vec<TodoItem>) -> Result<(), String> {
  let data = serde_json::to_string(todos)?;
  fs::write(save_file, data)?;
  Ok(())
}
```

But if we run the code above directly, the compiler reports an error.

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

This is because `?` can only be used when the return type is a `Result` with a matching error.

We can see the error message: ``` `?` couldn't convert the error to `std::string::String` ``` ,

The reason is that `save_todo_list` returns `Result<(), String>`, while the error type of `serde_json::to_string(...)` is `serde_json::Error`.
The `?` operator tries to convert `serde_json::Error` into `String`, but `From<serde_json::Error> for String` is not implemented.

So we need to convert the error so that the returned type matches the `save_todo_list` function.

### Function Closures

We can solve this problem with closures.

A closure is an anonymous function that, besides accepting arguments, can also capture variables from its environment.
On top of that, a closure can be passed to a function as an argument.

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
Using the `map_err` function and passing a closure, we uniformly convert any error that may occur into the `String` type.

```rust
pub fn save_todo_list(save_file: &str, todos: &Vec<TodoItem>) -> Result<(), String> {
  let data = serde_json::to_string(todos).map_err(|e| e.to_string())?;
  fs::write(save_file, data).map_err(|e| e.to_string())?;
  Ok(())
}
```

Running it again, it works properly now.

## Finding Todos

We have basically completed the functionality of the `create` command: it can create Todo items both from command-line arguments and through the interactive interface.

But our `list` command is still rather crude: it can only list all Todo items and cannot filter them by condition.
So we need to improve it.

### Filtering Todos

We will create a `TodoItemFilter` struct to represent the filter configuration.

```rust
pub struct TodoItemFilter {
  pub title: Option<String>,
  pub content: Option<String>,
}
```

`TodoItemFilter` will have two attributes, representing the `title` and `content` to filter by.
Since it may be necessary to filter by only one of them, both are set to the optional type `Option<String>`.

Next, we will implement some methods for it.

First, the instantiation method.

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

At the beginning we have no way of knowing what needs to be filtered, so both `title` and `content` are set to `None`.

### Generic Bounds

In the earlier code we learned about generics, which serve as placeholders for any type.
But a bare `T` covers too wide a range. For example, the argument we need may be a string, yet numbers and booleans could also be passed in.

To solve this, Rust supports adding type bounds to generics, so a generic parameter must satisfy specific conditions.
Therefore we need to constrain the generic further.

For example, if we want the argument to be convertible into a string type, we can use `Into<String>` as the bound.
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
We do not care what concrete type the argument `T` is, as long as it satisfies the bound `Into<String>`.
Whether `T` is `String`, `&str`, or `Vec<u8>`, any type that can be converted into `String` can be passed in.

There are two ways to write type bounds. The one above is the first: write the bound directly in the generic parameter position, which is more common.
The second uses a separate `where` clause, which suits complex bounds.

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

Our Todo items currently have two attributes, `title` and `content`.
We can filter Todo items by either one of these attributes, or by both.

Let us implement a `filter` method for `TodoItemFilter` to filter Todo items.

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

The code above is the `filter` method implemented for `TodoItemFilter`.
It first creates an empty `filtered_list` to store the filtered Todo items.
If both `title` and `content` are empty, all Todo items are put into `filtered_list` directly.
Otherwise it iterates over all Todo items and filters by `title` and `content`:
if both the `title` and the `content` of a Todo item contain the filter conditions, the item is put into `filtered_list`.

Finally it iterates over `filtered_list` and prints the filtered Todo items.

Then we rework the `TodoCommand` enum, adding two arguments to the `list` command.

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

Rework the `main` function to pass the filter arguments to the `list` command.

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

Next, rework the `list_todo` function.

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

Now, when we run `cargo run -- list`, we can pass `--title` and `--content` to filter the results.

## Traits

When implementing the `set_title` and `set_content` methods for the `list` command, we used `Into<String>` as a type bound.
But `Into<T>` is not a type: it is a trait, a mechanism Rust uses to define behavioral contracts. It lets us define a uniform capability specification for types.

We can think of traits in Rust as interfaces in other languages.

Rust ships with many built-in traits. For example, `Into<T>` means a type can be converted into `T`, `From<T>` means a type can be constructed from `T`,
and `Copy` and `Clone` can express whether a type can be copied, and so on.

When we first wrote our program, we already ran into an error involving a trait.
The `String` type does not implement the `Copy` trait, so an argument cannot be assigned directly.

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

Like enums, as long as a trait is marked with `pub`, all of its methods become accessible from outside.

### Implementing Traits

Implementing a trait depends on a type. On top of the original form of implementing methods for a type, we add the name of the trait being implemented and the `for` keyword.

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

If you want to implement trait B for type A, then one of the two must be defined in the current scope, otherwise it will not work.
For example, if you want to implement the `Copy` trait for `String`, both are defined in the standard library rather than the current scope, so it cannot be done.

This rule is called the orphan rule. It ensures that code written by others cannot break our code, and that we do not inexplicably break other people's code.

### Trait Bounds

Earlier we used a trait bound, namely `T: Into<String>`. It means `T` must implement the `Into<String>` trait.

Trait bounds constrain not only generics, but also traits themselves.

```rust
trait PrintName: Display {
  fn PrintName(&self) -> String;
}
```

The code above defines the `PrintName` trait, requiring that an implementing type must also implement the `Display` trait in order to implement it.
You can add more bounds with `+`. For example, `trait PrintName: Display + Clone` means `PrintName` requires both `Display` and `Clone` to be implemented.

### Argument Bounds

Traits can also be used to constrain argument types.

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

In our earlier work we implemented serialization and deserialization methods for `TodoItem`. These two kinds of methods are quite common in development.
Implementing them one by one for every type is a bit too tedious.

So we can declare a trait to extract these common behaviors.

First, define a `Serializer` trait representing the set of serialization and deserialization methods. Then implement the `Serializer` trait for `TodoItem`.

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

In the code above, even though we have extracted the serialization and deserialization methods, the method bodies still have to be written by hand, which is still tedious.

So we can use default implementations to avoid writing the method bodies manually.

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

Change the code to the above and run it. You will find an error. Let us deal with the error in the `serialize` method first.

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

The error is ```the trait bound `Self: Serialize` is not satisfied```.
It happens because the `Self` type does not satisfy the type bound required by `serde_json::to_string(self)`.

We can look at the definition of the `serde_json::to_string` method.

```rust
serde_json::ser
pub fn to_string<T>(value: &T) -> Result<String>
where
  T: ?Sized + Serialize,
// ...
```

As you can see, it uses a `where` clause requiring the type `T` to implement the `?Sized` and `Serialize` traits.

Let us add the missing bounds.

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

Run it again: the `serialize` method no longer errors, and only the `deserialize` method is left.

The error from the `deserialize` method is as follows:

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

The error message ```the trait bound `Self: Deserialize<'_>` is not satisfied``` shows that this too is caused by an unsatisfied type bound.

The compiler also hints that we should add the bound.

Add the bound, and the code becomes:

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

Run it again: the `deserialize` error is gone. But a new error appears:

```bash
error[E0637]: `'_` cannot be used here
  --> src\todo\core.rs:68:43
   |
68 |     Self: Sized + Serialize + Deserialize<'_>,
   |                                           ^^ `'_` is a reserved lifetime name

For more information about this error, try `rustc --explain E0637`.
```

The error message ``` `'_` cannot be used here``` means `'_` cannot be used here,
and ``` `'_` is a reserved lifetime name``` tells us that `'_` is a reserved lifetime name.

### Lifetimes

A lifetime usually refers to a complete process from the beginning to the end of something.

In Rust it is a compile-time concept, used to check whether references are valid and to avoid problems such as dangling pointers.
Usually we do not need to annotate lifetimes manually, because the compiler infers them; only when the compiler cannot determine them do we need to annotate.

You can simply think of a lifetime in Rust as the valid scope of a reference.

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

The code above is split into two levels by braces. In the first level, the variable `r` is declared without a value.
In the second level, the variable `n` is declared and the address of `n` is assigned to `r`.

`n` is a local variable whose lifetime ends at the end of the second level, that is, when the braces close.
`r` is a reference pointing to `n`, and its lifetime is within the scope where `r` lives, that is, inside the braces of the first level.

It is fine that the lifetime of `n` is shorter than that of `r`. But assigning the reference to `n` to `r` causes a problem:
`n` is destroyed when its lifetime ends, and `r` ends up pointing at an already destroyed variable.

Back to the error from the new `deserialize` method. `'_` is a special lifetime marker, used for lifetime elision or for temporary lifetime annotation.
It can be inferred automatically by the compiler, but it is not allowed in a type bound here.

Rust requires an explicit lifetime name in a type bound, because the compiler cannot infer the concrete lifetime there.

Replace `'_` with `'a` and run again.
> Note that Rust has no special requirements for lifetime names; by convention a single lowercase letter is usually used.

The previous error is gone, and a new one appears.

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

Focusing again on ```use of undeclared lifetime name `'a` ```: it means we used a lifetime that was never declared. The compiler offers several solutions.

Here is what each solution means:

- `Self: Sized + Serialize + for<'a> Deserialize<'a>`:
  This is the most common and general form. It uses a higher-ranked lifetime bound, meaning that whatever lifetime `'a` is, `Self` implements the trait `Deserialize<'a>`.

- `pub trait Serializer<'a>`:
  This makes the trait itself carry a lifetime parameter that can be used in all of the trait's methods, but it forces callers of the trait to pass a lifetime, which is quite intrusive.

- `for<'a> Self: Sized + Serialize + Deserialize<'a>,`:
  This also uses a higher-ranked lifetime bound, but `'a` applies to the whole bound, meaning the type bound holds for any lifetime `'a`.

We will use the first one. After the rework, running it again produces no more errors.

## Verifying the Features

At this point we have completed the create, view, filter, and persistence features of the Todo CLI.
Although we can verify things by running commands by hand, as features multiply and logic grows more complex, manual operation becomes both tedious and easy to overlook.

Rust provides a powerful built-in test module, letting us verify features automatically instead of testing them by hand over and over.

### Unit Tests

A unit test aims to test one code unit (usually a function) and verify that it works as expected.
For example, testing an `add` function to verify that, given two inputs, the returned sum matches expectations.

We can write our own test logic in each module and run them all in bulk with the `cargo test` command.

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
- `test_serialization_roundtrip`: verifies that the struct can be restored after being serialized.

After adding this content to `src/todo/core.rs`, run `cargo test` and Rust will perform the tests.

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

As you can see, `todo::core::tests::test_todo_item_creation` failed, saying:

```bash
assertion `left == right` failed
  left: "test1"
 right: "test"
```

The assertion failed because the two values do not match.
Going back to the test code, change the mistyped `test1` in `let item = TodoItem::new("test1", "content");` to `test`.
Run `cargo test` again, and the result is:

```bash
running 2 tests
test todo::core::tests::test_todo_item_creation ... ok
test todo::core::tests::test_serialization_roundtrip ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

This shows that all our tests pass and the features behave as expected.

### Assertions

An assertion is a checkpoint set in a program: when execution reaches it, the state of the program is checked.
If the check is true, the program continues; if it is false, the program throws an exception and stops.

Rust commonly uses the following assertions:

- `assert!(expr)`: throws an exception if `expr` is false.
- `assert_eq!(left, right)`: throws an exception if `left` does not equal `right`.
- `assert_ne!(left, right)`: throws an exception if `left` equals `right`.

If you add a `debug_` prefix, it only runs in `Debug` mode, for example `debug_assert!(expr)`.

### Conditional Compilation

In the test code we can see `#[cfg(test)]` on the `tests` module.

It is used for conditional compilation. It means the code of `tests` is compiled only when the `test` condition is met,
that is, only when the `cargo test` command is executed.

Besides the `test` condition, we can add more conditions, for example:

- `#[cfg(all(target_os="windows", test))]` compiles `cargo test` only when the compilation target is the `windows` platform.
- `#[cfg(all(any(target_os = "ios", target_os = "android"), test))]` compiles `cargo test` only when the compilation target is mobile.
- `#[cfg(all(not(any(target_os = "ios", target_os = "android")), test))]` compiles `cargo test` only when the compilation target is not mobile.

Conditional compilation can be used in many places, from a single variable to a whole module.

## Summary

Through this tutorial we not only took our first step in Rust programming, but turned theory into practical ability by building a Todo CLI by hand.
From the initial "Hello, world!" output to a program that can create and list Todo items from the command line with data persistence, we gradually mastered the key knowledge points of Rust, from basic syntax to its core features.

Along the way we gained a deep understanding of the design that sets Rust apart from other languages:

- The ownership system avoids dangling pointers and double frees through strict memory management rules.
- Borrowing and lifetimes ensure that references are valid.
- Traits and generics enable flexible code abstraction and reuse.

At the same time, we practiced the key parts of engineering with Rust:
using cargo to manage the project and its dependencies, splitting the code structure into modules,
leveraging third-party libraries such as `serde` and `clap` to boost development efficiency, and guaranteeing code quality with unit tests.

That said, the current Todo CLI still has plenty of room for improvement:

It only supports the create and list commands, lacking the ability to delete and modify Todo items, so it cannot handle the "task changed" situations of daily use.

Todo items only contain a title and content, without a status marker (such as "done" and "not done"), which makes task progress hard to track.

In addition, details such as fault tolerance in the command-line interaction and more finely grained filtering (for example, filtering by status) remain to be improved.

But these shortcomings are exactly the opportunity for deeper learning.

By extending the features and optimizing the implementation, we can further consolidate our knowledge of Rust pattern matching, error handling, enum design, and more.
Truly weaving the "memory safety" and "high performance" characteristics into real development lets this simple tool gradually grow into a practical, robust productivity tool.

## Implementations in Other Languages

The same Todo CLI is also provided in three equivalent implementations: Go, Python, and TypeScript,
located in the `golang/`, `python/`, and `typescript/` directories respectively.

These implementations follow the Rust version as closely as possible in directory structure, function and struct naming, and execution flow,
and they use exactly the same `todo.json` format as the Rust version, so all four implementations can read and write the same data.

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

The Python version has the following directory structure. In Python a directory is itself a package,
so `todo/__init__.py` is the equivalent of `src/todo.rs`, which only declares modules:

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

The TypeScript version has the following directory structure. TypeScript likewise has no module declaration file,
and `todo/todo.ts` takes on the role of `src/todo.rs` through namespace re-exports:

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
as well as `--help`, `--version`, and the `help` subcommand.

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

The type systems of the three languages differ, so the following trade-offs were made when porting:

- Enums: Rust enum variants can carry data, while Go has no enums, so a type constant together with a struct is used instead;
  Python represents one variant with a data class and the whole enum with a union type, destructuring it with a `match` statement in `main`;
  TypeScript uses a discriminated union and matches patterns in `main` with `switch` plus destructuring.
- Optional values: `Option<String>` maps to `*string` in Go, `str | None` in Python, and `string | null` in TypeScript.
- Traits: a Rust trait can provide default implementations for a type, but a Go interface cannot, so Go constrains types with an interface
  and provides default implementations through the generic function `Deserialize[T]`; Python and TypeScript abstract base classes can give default implementations directly, which maps most naturally.
- Error handling: the `Result<(), String>` returned by `save_todo_list` maps to `error` in Go, and to exceptions in Python and TypeScript.
- Command-line parsing: none of the three has clap's derive macro, so the logic for parsing arguments such as `-t/--title` is implemented by hand,
  keeping the help text and exit codes consistent with clap (`--help` exits with 0, an argument error exits with 2).
- Serialization: all three use the same compact format as `serde_json` (no spaces after `,` and `:`, non-ASCII characters not escaped),
  so the `todo.json` they write is byte-for-byte identical to the Rust version.

Issues each language needed to handle additionally:

- Go: it has no enums and no optional values, so type constants plus a struct and pointers are used to express `Option`; and since it has no default trait methods,
  an interface constrains the type while a generic function provides the default implementation.
- Python: it has no "multi-line input" primitive, so `input()` is used to read;
  also, `list` and `filter` are built-in names, and using them as parameter names would shadow them, so they were renamed to `todos` and `item_filter`.
- TypeScript: types are erased at runtime, so `storage.ts` explicitly validates field types
  in order to print `parse file error` like serde does when the data is invalid;
  reading standard input in Node is usually asynchronous, so to keep the synchronous flow of `create_todo`,
  `create.ts` uses `fs.readSync` and maintains its own buffer, splitting it by line.

Three intentional differences:

- Python uses `input()` to read input, which does not include the trailing newline, so blank lines prompt for input again
  (Rust's `read_line` keeps the newline, which means that check in practice only holds when the end of input is reached).
- Go and TypeScript keep Rust's line-reading semantics (newline included, a blank line yields an empty string),
  but they no longer spin like Rust when the end of input is reached; instead they raise an exception/error, consistent with `.expect("read line failed")`.
- Go and Python both have identifiers that would shadow built-in names (`list`, `filter`), which were renamed; TypeScript needs no renaming and keeps Rust's original names.

> Note: each implementation also stores its data file as `todo.json` in the current working directory,
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

