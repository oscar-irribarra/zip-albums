# zip-albums

A desktop application for managing and reading image albums stored as ZIP files. Built with [Tauri 2](https://tauri.app/), React, and Rust.

## Features

- **Library view** — browse your imported albums with cover thumbnails
- **Album viewer** — page through images inside a ZIP archive with a scrollable thumbnail strip
- **Import from ZIP** — add any `.zip` containing images (JPG, PNG, WebP) to your library
- **Reading progress** — automatically resumes where you left off in each album
- **Settings** — configure theme (system / light / dark), initial zoom level, fullscreen mode, albums directory, and whether to reopen the last album on launch
- **Keyboard navigation** — navigate between images without touching the mouse

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | [Tauri 2](https://tauri.app/) |
| Frontend | React 19 + TypeScript + Vite |
| State management | [Zustand](https://github.com/pmndrs/zustand) |
| Backend | Rust |
| Tests | Vitest + Testing Library |

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/)
- [Rust toolchain](https://rustup.rs/) (stable)
- Tauri system dependencies for your OS — see the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/)

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the app in development mode:

```bash
pnpm tauri dev
```

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the Vite dev server (frontend only) |
| `pnpm tauri dev` | Launch the full Tauri desktop app in dev mode |
| `pnpm build` | Build the frontend for production |
| `pnpm tauri build` | Build the distributable desktop app |
| `pnpm test` | Run the test suite |
| `pnpm preview` | Preview the production frontend build |

## Project Structure

```
zip-albums/
├── src/                    # React frontend
│   ├── features/
│   │   ├── library/        # Album grid / library view
│   │   ├── viewer/         # Image viewer & thumbnail strip
│   │   └── settings/       # Settings panel & FAB
│   └── shared/             # Shared utilities and components
├── src-tauri/              # Rust / Tauri backend
│   └── src/
│       └── services/
│           ├── zip_service.rs       # ZIP inspection & image loading
│           ├── metadata_service.rs  # Catalog & settings persistence
│           └── file_system_service.rs
└── specs/                  # Feature specification documents
```

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) with the following extensions:

- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
