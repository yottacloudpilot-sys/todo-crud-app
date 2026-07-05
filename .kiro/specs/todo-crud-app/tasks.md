# Implementation Plan: Todo CRUD App

## Overview

Implement a full-stack Todo application with a Node.js/Express/TypeScript backend (SQLite via `better-sqlite3`), a vanilla HTML/CSS/JS frontend (`public/index.html`), unit and integration tests (Jest + Supertest + fast-check), and deployment configuration for Render (backend) and Netlify (frontend).

Each task maps to a specific file or set of closely related files. Tasks build incrementally so each step compiles and runs before the next begins.

---

## Tasks

- [x] 1. Initialize project structure and configuration files
  - Create `package.json` with all dependencies and scripts (`build`, `start`, `dev`, `test`)
  - Create `tsconfig.json` targeting ES2020/CommonJS with `outDir: dist` and `rootDir: src`
  - Create `.gitignore` excluding `dist/`, `node_modules/`, and `*.db` files
  - Create the directory skeleton: `src/routes/`, `src/controllers/`, `src/services/`, `src/models/`, `src/middleware/`, `tests/unit/`, `tests/integration/`, `public/`
  - _Requirements: 7.5_

- [x] 2. Define TypeScript data models
  - [x] 2.1 Create `src/models/todo.ts` with `TodoItem`, `CreateTodoInput`, and `UpdateTodoInput` interfaces
    - `TodoItem`: `id: number`, `title: string`, `description: string | null`, `completed: boolean`, `createdAt: string`
    - `CreateTodoInput`: `title: string`, `description?: string | null`, `completed?: boolean`
    - `UpdateTodoInput`: all fields optional — `title?`, `description?`, `completed?`
    - _Requirements: 1.1, 1.3, 2.2, 3.1_

- [x] 3. Implement the database layer
  - [x] 3.1 Create `src/db.ts` — SQLite connection singleton and schema initialization
    - Open (or create) the SQLite file at `process.env.DB_PATH ?? './todos.db'`
    - Run `CREATE TABLE IF NOT EXISTS todos` with columns: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `title TEXT NOT NULL CHECK(length(title) >= 1 AND length(title) <= 255)`, `description TEXT DEFAULT NULL CHECK(description IS NULL OR length(description) <= 1000)`, `completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1))`, `created_at TEXT NOT NULL DEFAULT (datetime('now'))`
    - Export the `db` instance for use by the service layer
    - _Requirements: 8.1, 8.3, 7.4_

- [x] 4. Implement the service layer
  - [x] 4.1 Create `src/services/todosService.ts` with functions: `getAllTodos`, `getTodoById`, `createTodo`, `updateTodo`, `deleteTodo`
    - `getAllTodos`: query all rows ordered by `created_at DESC`, `id ASC`; map `completed` (0/1) → boolean and `created_at` → `createdAt`
    - `getTodoById(id)`: return mapped `TodoItem` or `null` if not found
    - `createTodo(input)`: validate title (non-empty, ≤255 chars, not whitespace-only); validate description (≤1000 chars if provided); insert row; return full `TodoItem`
    - `updateTodo(id, input)`: validate at least one field present; validate title if provided; apply partial update with SQL built dynamically; return updated `TodoItem` or `null`; ignore `id` and `createdAt` if sent
    - `deleteTodo(id)`: delete row; return `true` if deleted, `false` if not found
    - Wrap all DB calls in try/catch and re-throw as typed `Error` for the global error handler
    - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 4.1, 8.1, 8.2_

  - [ ]* 4.2 Write unit tests for `todosService` in `tests/unit/todosService.test.ts`
    - Use an in-memory SQLite database (pass `:memory:` as DB path via dependency injection or env override)
    - Test happy paths: create, read all, read by id, update (partial and full), delete
    - Test error cases: create with empty title, create with whitespace-only title, title >255 chars, description >1000 chars, update non-existent id, delete non-existent id, update with empty body
    - Test immutability: verify `id` and `createdAt` are unchanged after `updateTodo`
    - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 3.1, 3.4, 3.5, 3.6, 3.7, 4.1_

- [x] 5. Implement error handling middleware
  - [x] 5.1 Create `src/middleware/errorHandler.ts` — global Express error handler
    - Detect `entity.parse.failed` errors → 400 `{ "error": "Invalid JSON in request body" }`
    - All other unhandled errors → log to stderr and return 503 `{ "error": "Service temporarily unavailable" }`
    - Ensure `Content-Type: application/json` is set on all error responses
    - _Requirements: 5.6, 8.2_

- [x] 6. Implement controllers and routes
  - [x] 6.1 Create `src/controllers/todosController.ts` with handlers: `createTodo`, `listTodos`, `getTodo`, `updateTodo`, `deleteTodo`
    - `createTodo`: enforce `Content-Type: application/json` (415 if not); call `todosService.createTodo`; on validation error return 400; on success return 201 with full `TodoItem`
    - `listTodos`: call `todosService.getAllTodos`; return 200 with array (empty array if none)
    - `getTodo`: call `todosService.getTodoById`; return 200 or 404 `{ "error": "Todo with id :id not found" }`
    - `updateTodo`: enforce `Content-Type: application/json` (415 if not); call `todosService.updateTodo`; return 200, 400, or 404 as appropriate
    - `deleteTodo`: call `todosService.deleteTodo`; return 200 `{ "id": number }` or 404
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.3, 3.4, 3.6, 4.1, 4.2, 5.1, 5.2, 5.3, 5.7_

  - [x] 6.2 Create `src/routes/todos.ts` — Express router wiring all five endpoints
    - `POST /todos` → `todosController.createTodo`
    - `GET /todos` → `todosController.listTodos`
    - `GET /todos/:id` → `todosController.getTodo`
    - `PATCH /todos/:id` → `todosController.updateTodo`
    - `DELETE /todos/:id` → `todosController.deleteTodo`
    - _Requirements: 5.1_

- [x] 7. Create Express app factory and server entry point
  - [x] 7.1 Create `src/app.ts` — Express app factory function
    - Apply `express.json()` middleware (triggers `entity.parse.failed` on malformed JSON)
    - Apply `cors` middleware with `origin: process.env.CORS_ORIGIN` and allowed methods `GET, POST, PATCH, DELETE`
    - Mount the todos router at `/todos`
    - Register a 404 catch-all handler returning `{ "error": "Route not found" }` for undefined routes
    - Register `errorHandler` as the last middleware
    - Export `createApp()` function (takes optional DB instance for testing)
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 7.2 Create `src/server.ts` — HTTP server entry point
    - Call `initDb()` from `db.ts` to ensure schema exists before accepting requests
    - Call `createApp()` and listen on `process.env.PORT ?? 3000`
    - Log the port on startup
    - _Requirements: 7.4, 8.1_

- [x] 8. Checkpoint — verify backend compiles and basic routes respond
  - Run `npm run build` (tsc) — must produce `dist/` with no TypeScript errors
  - Run `node dist/server.js` locally and verify `GET /todos` returns `[]` with status 200
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement the frontend
  - [x] 9.1 Create `public/index.html` — single-page CRUD UI with embedded CSS and JS
    - HTML structure: `#app` root, `#create-form` (title input + description textarea + submit button), `#loading-banner` (hidden by default), `#error-banner` (hidden by default), `#todo-list`
    - CSS: card layout, `.todo-card.completed` styling (strikethrough + `opacity: 0.5` + `background-color: #f0f0f0`), form styles, inline validation message styles
    - JS `API` object: `fetchAll()`, `create(input)`, `update(id, input)`, `del(id)` — all using `fetch` with `Content-Type: application/json`; non-2xx responses throw with status code + parsed error message
    - JS `State`: `let todos = []` mirroring last successful `GET /todos`
    - JS `Render`: `renderList()`, `renderTodoCard(item)`, `showLoading(bool)`, `showError(message)`, `clearError()`
    - Event handlers: form submit → create; checkbox/toggle → update completed; Edit button → inline edit mode with save/cancel; Delete button → delete and remove card
    - Frontend validation: prevent submit if title is empty; display inline validation message
    - Loading indicator shown before every API call; cleared in `finally`; error banner shown on failure with HTTP status code
    - Set `API_BASE` from a constant (Render URL for prod; `http://localhost:3000` for local dev via comment toggle)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [x] 10. Write integration and property-based tests
  - [x] 10.1 Create `tests/integration/todos.api.test.ts` — integration tests using Supertest
    - Bootstrap the Express app with an in-memory SQLite DB for each test suite (use `beforeAll`/`afterAll`)
    - Reset/clear the todos table in `beforeEach` to isolate tests
    - Happy-path tests: POST → 201, GET /todos → 200 array, GET /todos/:id → 200, PATCH → 200 updated, DELETE → 200 `{ id }`
    - Error-path tests: POST with missing title → 400, POST with title >255 → 400, GET unknown id → 404 with "not found", PATCH unknown id → 404, DELETE unknown id → 404, PATCH with empty body → 400, malformed JSON → 400, wrong Content-Type → 415, undefined route → 404
    - Empty list: GET /todos on empty DB → 200 `[]`
    - _Requirements: 1.2, 1.3, 2.1, 2.3, 2.4, 3.3, 3.4, 3.6, 4.1, 4.2, 5.4, 5.6, 5.7_

  - [ ]* 10.2 Write property test — Property 1: Create Round-Trip
    - **Property 1: Create Round-Trip** — for any valid title (1–255 non-whitespace-only chars) and optional description (≤1000 chars), POST then GET by id returns the same title, description, completed=false, valid numeric id, and valid ISO createdAt
    - **Validates: Requirements 1.1, 1.3, 2.2**

  - [ ]* 10.3 Write property test — Property 2: Invalid Title Rejected
    - **Property 2: Invalid Title Rejected** — for any title that is empty, whitespace-only, or >255 chars, POST /todos returns 400 and GET /todos count is unchanged
    - **Validates: Requirements 1.2, 3.4**

  - [ ]* 10.4 Write property test — Property 3: Unique IDs on Bulk Creation
    - **Property 3: Unique IDs on Bulk Creation** — for any batch of N valid sequential creates, all returned ids are distinct
    - **Validates: Requirements 1.4**

  - [ ]* 10.5 Write property test — Property 4: List Ordering Invariant
    - **Property 4: List Ordering Invariant** — for any set of stored todos, GET /todos returns them ordered createdAt DESC, id ASC for ties, and includes every stored todo
    - **Validates: Requirements 2.1**

  - [ ]* 10.6 Write property test — Property 5: Non-Existent ID Returns 404
    - **Property 5: Non-Existent ID → 404** — for any large integer id not present in DB, GET /todos/:id, PATCH /todos/:id, and DELETE /todos/:id all return 404 with body containing "not found"
    - **Validates: Requirements 2.3, 3.3, 4.2**

  - [ ]* 10.7 Write property test — Property 6: Partial Update Preserves Untouched Fields
    - **Property 6: Partial Update Preserves Untouched Fields** — for any existing todo and any non-empty subset of `{title, description, completed}`, PATCH updates exactly those fields and preserves the rest; id and createdAt are never modified
    - **Validates: Requirements 3.1, 3.2, 3.5, 3.7**

  - [ ]* 10.8 Write property test — Property 7: Delete Round-Trip
    - **Property 7: Delete Round-Trip** — after DELETE /todos/:id (200), subsequent GET /todos/:id returns 404 and GET /todos does not include the deleted item
    - **Validates: Requirements 4.1, 4.3, 4.4**

  - [ ]* 10.9 Write property test — Property 8: JSON Content-Type on All Responses
    - **Property 8: JSON Content-Type on All Responses** — for any request to any defined endpoint (valid or invalid input), the response includes `Content-Type: application/json`
    - **Validates: Requirements 5.2, 5.3**

- [x] 11. Checkpoint — run full test suite
  - Run `npm test` — all unit and integration tests must pass; property tests run ≥100 iterations each
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Add deployment configuration
  - [x] 12.1 Create `render.yaml` at the repo root
    - Service type `web`, name `todo-crud-api`, env `node`
    - `buildCommand: npm install && npm run build`, `startCommand: node dist/server.js`
    - Env vars: `NODE_ENV=production`, `PORT` (from service property), `DB_PATH=./todos.db`, `CORS_ORIGIN` (sync: false — set manually in Render dashboard)
    - _Requirements: 7.1, 7.3, 7.4, 7.5_

  - [x] 12.2 Create `netlify.toml` at the repo root
    - Set `[build] publish = "public"` with no build command
    - _Requirements: 7.2_

- [x] 13. Final checkpoint — full build, test, and lint pass
  - Run `npm run build` and confirm `dist/` is produced with zero TypeScript errors
  - Run `npm test` and confirm all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP — the core app is fully functional without PBT tasks
- Property tests (10.2–10.9) each map to a numbered correctness property defined in `design.md`
- The in-memory SQLite approach (`:memory:`) for tests ensures isolation without touching the real DB file
- `createApp()` in `app.ts` accepts an optional DB instance to support dependency injection in tests
- `API_BASE` in `index.html` should be updated to the actual Render URL before deploying; leave `http://localhost:3000` for local development
- Render free tier uses ephemeral storage — `DB_PATH` can be changed to a mounted persistent disk path via the dashboard env var

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1"] },
    { "id": 4, "tasks": ["6.1", "6.2"] },
    { "id": 5, "tasks": ["7.1"] },
    { "id": 6, "tasks": ["7.2"] },
    { "id": 7, "tasks": ["9.1"] },
    { "id": 8, "tasks": ["10.1"] },
    { "id": 9, "tasks": ["10.2", "10.3", "10.4", "10.5", "10.6", "10.7", "10.8", "10.9"] },
    { "id": 10, "tasks": ["12.1", "12.2"] }
  ]
}
```
