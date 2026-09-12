# Project knowledge

This file gives Freebuff context about this project: goals, commands, conventions, and gotchas.

## What this project is

A teaching repository: a Rust CLI todo app built step by step, paired with a long-form
Chinese tutorial. `README.md` is the tutorial itself (variables → ownership → modules →
serde persistence → clap enums → error handling → filtering). Code changes here usually
exist to demonstrate a language concept, so keep examples simple and idiomatic — they are
read by learners.

- `src/main.rs` — entry point: `clap::Parser` struct `Program`, dispatches `Create` / `List`, then always saves.
- `src/todo.rs` — module declarations only (`core`, `create`, `list`, `storage`).
- `src/todo/core.rs` — `TodoCommand` enum (clap `Subcommand`) and `TodoItem` struct (serde), plus the `Serializer` trait and inline unit tests.
- `src/todo/create.rs` — `create_todo`: uses `--title/--content` when given, otherwise falls back to an interactive stdin loop with a y/n confirmation.
- `src/todo/list.rs` — `TodoItemFilter` (optional `title`/`content`, substring `contains` match) and `list_todo`.
- `src/todo/storage.rs` — `read_todo_list` / `save_todo_list` against a JSON file.
- `docs/` — GitHub Pages site; `docs/README.md` is a copy of `README.md`, `docs/index.html` renders it.
- `.github/dependabot.yml`, `.devcontainer/devcontainer.json` — the only automation; there are no CI workflows.

## Commands

```bash
cargo run -- --help                    # auto-generated help (clap)
cargo run -- create --title t --content c
cargo run -- create                    # interactive mode
cargo run -- list --title rust         # substring filter; no flags lists everything
cargo test                             # inline #[cfg(test)] tests in src/todo/core.rs
cargo fmt / cargo clippy               # standard Rust tooling
cargo add <crate>                      # dependency management
```

Binary name is `cli` (see `Cargo.toml`); edition 2021.

## Conventions

- rustfmt defaults (`cargo fmt`): 4-space indent in `.rs` files. `.editorconfig`'s
  `indent_size = 2` does not apply to Rust code — do not re-indent sources to 2 spaces.
- Doc comments (`///`) on clap enum variants and fields become `--help` text. Keep them
  accurate, and note that `///` is not a plain comment.
- Public API must be marked `pub`; cross-module imports use `super::` / `crate::` paths.
- `save_todo_list` returns `Result<(), String>` (errors are `map_err(|e| e.to_string())`);
  prefer propagated `Result` over `unwrap`/`expect` in application code.
- When `README.md` changes, mirror it into `docs/README.md` (existing commits do this) and
  keep the tutorial prose and the snippet in sync with `src/`.
- Prefer `cargo add` over hand-editing version strings in `Cargo.toml`.

## Gotchas

- `todo.json` in the repo root is the app's live data file and is committed. Every run —
  **including `cargo run -- list`** — rewrites it, so running the CLI can dirty the working
  tree and PRs. Delete it or restore it with git before committing.
- When `todo.json` is missing, unreadable, or empty, `read_todo_list` silently seeds three
  demo todos ("learn rust", "work", "play").
- `Cargo.lock` is gitignored even though this is a binary crate; don't be surprised by build
  churn or version drift.
- Several dependencies are declared but not yet used in `src/` (`comfy-table`, `console`,
  `dialoguer`, `indicatif`, `rusqlite` with `bundled`): they belong to later tutorial
  sections. Do not prune them as "unused" — `rusqlite`'s bundled SQLite also makes cold
  builds slow.
- `storage.rs` prints errors to stdout rather than returning them for the read path; the
  read/write asymmetry is intentional tutorial material.
