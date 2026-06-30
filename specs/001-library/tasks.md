# Tasks: Gestión de biblioteca de álbumes

**Input**: Design documents from `/specs/001-library/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Infrastructure

- [x] T001 Create the feature-local directories for shared models, infrastructure services, and frontend feature modules in src/ and src-tauri/src/
- [x] T002 Add a simple metadata catalog location and default album directory configuration for the local desktop app
- [x] T003 [P] Define shared TypeScript models for album summaries and library state in src/shared/types/
- [x] T004 [P] Define Rust structs for album metadata and catalog persistence in src-tauri/src/

## Backend (Rust)

- [x] T005 Implement FileSystemService to resolve the configured albums directory and validate local ZIP paths
- [x] T006 Implement ZipService to read ZIP entries, count images, and identify the cover image without modifying the archive
- [x] T007 Implement MetadataService to read and write the local JSON metadata catalog
- [x] T008 Implement a Tauri command to load the library from the metadata catalog and ZIP metadata
- [x] T009 Implement a Tauri command to delete an album by removing its metadata entry and underlying ZIP file
- [x] T010 Add error handling and user-facing messages for load and delete failures in the Rust command layer

## Frontend (React)

- [x] T011 Create a library view component that loads albums on startup and renders the library list
- [x] T012 Create an album card component that displays cover, title, image count, and import date
- [x] T013 Create a sort control for name and date ordering in the library view
- [x] T014 Create an empty-state view for cases where no albums are available
- [x] T015 Create a delete confirmation UI that asks for explicit confirmation before deleting an album
- [x] T016 Connect the library view to the backend commands for loading and deleting albums
- [x] T017 Add loading and error states for the library view so the user sees progress and failures clearly

## Integration

- [x] T018 Wire the frontend library store or state container to the Tauri commands and keep the list refreshed after deletion
- [x] T019 Ensure the UI uses lazy loading for album covers when displaying the list
- [x] T020 Ensure the app remains runnable after each incremental step by keeping the new UI and commands connected safely

## Testing

- [x] T021 [P] Add unit tests for sorting and library state transformation logic in the frontend
- [x] T022 [P] Add Rust unit tests for ZipService metadata parsing and album discovery logic
- [x] T023 [P] Add Rust tests for MetadataService read/write and delete behavior
- [x] T024 Add integration tests or manual validation steps for loading, sorting, and deleting albums end to end
- [x] T025 Run the app locally and validate the quickstart flow for library loading, sorting, and deletion
