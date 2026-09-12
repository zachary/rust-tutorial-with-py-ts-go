# Project knowledge

This file gives Freebuff context about your project: goals, commands, conventions, and gotchas.

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
- `golang/` — Go port of the same app: `go.mod` + `src/main.go` + `src/todo/{todo.go,core,create,list,storage}`, mirroring the Rust file tree and names; hand-rolled clap-like parsing, stdlib only, no third-party deps. Needs Go 1.27+ (`list.SetTitle` is a generic method).
- `python/` — Python port: `pyproject.toml` + `src/main.py` + `src/todo/{__init__.py,core,create,list,storage}.py`; uses dataclasses / ABCs / `match` in place of structs / traits / enums, stdlib only. Needs Python 3.10+.
- `typescript/` — TypeScript port: `package.json` + `tsconfig.json` + `src/main.ts` + `src/todo/{todo,core,core.test,create,list,storage}.ts`; discriminated unions / abstract classes / `switch` in place of enums / traits / `match`, strict `tsc` config. Runs with no runtime deps on Node 23.6+ (native type stripping); `npm install` is only needed for `npm run typecheck`.
- `docs/` — GitHub Pages site; `docs/README.md` is a copy of `README.md`, `docs/index.html` renders it.
- `.github/dependabot.yml`, `.devcontainer/devcontainer.json` — the only automation; there are no CI workflows.

## Quickstart

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

Other language ports (the mapping tables live in the "其他语言的实现" README section):

```bash
cd golang && go run ./src --help && go test ./...   # Go, tests in src/todo/core/core_test.go
cd python && python3 src/main.py --help             # Python, tests inline in src/todo/core.py
PYTHONPATH=src python3 -m unittest todo.core        # (run from python/) unittest entry point
cd typescript && node src/main.ts --help            # TypeScript, run directly (no build step)
node --test src/todo/core.test.ts                   # (run from typescript/)
npm run typecheck                                   # tsc --noEmit, after npm install
```

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
- The `golang/`, `python/` and `typescript/` ports read and write the same relative `todo.json`, so
  running them from their own directories creates/rewrites `golang/todo.json`, `python/todo.json`,
  `typescript/todo.json`. Those are scratch files, not part of the port: delete them before
  committing. All four implementations emit byte-identical JSON and identical CLI output/exit codes
  (compact separators, non-ASCII left unescaped, like `serde_json`), so the same data file can be
  shared between them; keep them in sync when changing behaviour.
- Ports fail loudly instead of reproducing Rust's `create` hang: when stdin ends (EOF) mid-prompt the
  Rust version spins forever, while Go panics / Python and TypeScript raise. That divergence is
  deliberate and documented in the README.
- `typescript/node_modules/` and `__pycache__/` are gitignored build artifacts (see `.gitignore`).
