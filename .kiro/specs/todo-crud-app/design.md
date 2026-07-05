# Design Document: Todo CRUD App

## Overview

The Todo CRUD App is a full-stack web application that allows users to manage a personal task list. It consists of:

- A **Node.js/Express/TypeScript REST API** backend that handles all business logic and data persistence.
- A **Vanilla HTML/CSS/JavaScript** single-page frontend that communicates with the API over HTTP.
- A **SQLite** database (via `better-sqlite3`) for lightweight, file-based persistence with zero external dependencies.
- Deployment to **Render** (backend) and **Netlify** (frontend).

The design prioritizes simplicity and deployability: no frontend build step, no external database service, and a single `render.yaml` file for backend deployment configuration.

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Client)                     │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │           Vanilla HTML/CSS/JS (index.html)          │   │
│   │           Hosted on Netlify (static CDN)            │   │
│   └────────────────────────┬────────────────────────────┘   │
└────────────────────────────│────────────────────────────────┘
                             │  HTTPS REST API calls
                             │  (fetch, JSON)
┌────────────────────────────▼────────────────────────────────┐
│                   Render (Node.js Web Service)               │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │           Express/TypeScript API Server             │   │
│   │                                                     │   │
│   │   Routes → Controllers → Service Layer → SQLite     │   │
│   └────────────────────────────────────────────────────-┘   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │           SQLite file (todos.db)                    │   │
│   │           Managed by better-sqlite3                 │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend language | TypeScript | Type safety, better IDE support, aligns with modern Node.js practices |
| Database | SQLite via `better-sqlite3` | Zero external dependencies, free, persists to file, synchronous API simplifies code |
| Frontend | Vanilla HTML/JS (no framework) | Zero build step, deployable directly to Netlify/GitHub Pages as static files |
| Backend host | Render (free tier) | Supports Node.js web services, free, auto-deploys from GitHub |
| Frontend host | Netlify (free tier) | Instant static deploys from GitHub, custom domain, HTTPS |
| API style | RESTful JSON | Predictable, standard, easy to consume from any client |

---

## Components and Interfaces

### Backend Components

```
src/
├── server.ts           # Entry point — creates Express app, starts HTTP server
├── app.ts              # Express app factory — registers middleware and routes
├── db.ts               # Database connection singleton and schema initialization
├── routes/
│   └── todos.ts        # Route definitions for /todos endpoints
├── controllers/
│   └── todosController.ts   # Request handlers — parse input, call service, send response
├── services/
│   └── todosService.ts      # Business logic — validation, CRUD operations via db
├── models/
│   └── todo.ts              # TypeScript type definitions
└── middleware/
    └── errorHandler.ts      # Global error-handling middleware
```

### Frontend Components

The entire frontend lives in a single `public/index.html` file with embedded CSS and a `<script>` block:

```
public/
└── index.html
    ├── <style>         # All CSS — layout, card styles, form styles, states
    ├── <body>          # HTML structure
    │   ├── #app        # Root container
    │   ├── #create-form     # Title + description inputs + submit button
    │   ├── #loading-banner  # Shown during in-flight API requests
    │   ├── #error-banner    # Shown on API errors
    │   └── #todo-list       # Rendered list of todo cards (DOM-managed)
    └── <script>        # All JS — API client, state management, DOM rendering
        ├── API         # Object with methods: fetchAll, create, update, del
        ├── State       # Module holding current todos[] array
        ├── Render      # Functions: renderList(), renderTodo(item), showError(), showLoading()
        └── Handlers    # Event handlers wired to form submit, card buttons
```

### API↔Frontend Contract

All communication uses `Content-Type: application/json`. The frontend uses the browser `fetch` API and sets `Content-Type: application/json` on all requests with a body.

CORS is configured on the backend to accept requests from the Netlify origin (set via `CORS_ORIGIN` environment variable).

---

## Data Models

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS todos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL CHECK(length(title) >= 1 AND length(title) <= 255),
  description TEXT    DEFAULT NULL CHECK(description IS NULL OR length(description) <= 1000),
  completed   INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

SQLite stores booleans as integers (0/1). The service layer maps `completed` to a TypeScript `boolean`. Dates are stored as ISO 8601 UTC strings and returned as-is in JSON responses.

### TypeScript Types

```typescript
// models/todo.ts

export interface TodoItem {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string; // ISO 8601 UTC, e.g. "2024-01-15T12:00:00.000Z"
}

export interface CreateTodoInput {
  title: string;
  description?: string | null;
  completed?: boolean;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string | null;
  completed?: boolean;
}
```

### JSON Representation

A `TodoItem` is serialized as:

```json
{
  "id": 1,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "createdAt": "2024-01-15T12:00:00.000Z"
}
```

Field mapping: `created_at` (SQLite column) → `createdAt` (JSON key). This mapping is applied in the service layer.

---

## API Endpoint Design

### Base URL

- Local: `http://localhost:3000`
- Production: `https://<render-app>.onrender.com`

### Endpoints

#### `POST /todos` — Create a Todo

**Request**

```
POST /todos
Content-Type: application/json

{
  "title": "string (1–255 chars, required)",
  "description": "string (0–1000 chars, optional)",
  "completed": false  // optional, defaults to false
}
```

**Responses**

| Status | Body | Condition |
|---|---|---|
| 201 Created | Full `TodoItem` JSON | Valid input, item persisted |
| 400 Bad Request | `{ "error": "title is required" }` | Missing/empty title |
| 400 Bad Request | `{ "error": "title must be 255 characters or fewer" }` | Title too long |
| 400 Bad Request | `{ "error": "description must be 1000 characters or fewer" }` | Description too long |
| 400 Bad Request | `{ "error": "Invalid JSON in request body" }` | Malformed JSON body |
| 415 Unsupported Media Type | `{ "error": "Content-Type must be application/json" }` | Wrong Content-Type |

---

#### `GET /todos` — List All Todos

**Request**

```
GET /todos
```

**Responses**

| Status | Body | Condition |
|---|---|---|
| 200 OK | `TodoItem[]` (ordered by `createdAt` DESC, `id` ASC for ties) | Always |

---

#### `GET /todos/:id` — Get a Todo by ID

**Request**

```
GET /todos/42
```

**Responses**

| Status | Body | Condition |
|---|---|---|
| 200 OK | Full `TodoItem` JSON | ID exists |
| 404 Not Found | `{ "error": "Todo with id 42 not found" }` | ID does not exist |

---

#### `PATCH /todos/:id` — Update a Todo

**Request**

```
PATCH /todos/42
Content-Type: application/json

{
  "title": "Updated title",       // optional
  "description": "Updated desc",  // optional
  "completed": true               // optional
}
```

At least one field must be present. `id` and `createdAt` are ignored if included.

**Responses**

| Status | Body | Condition |
|---|---|---|
| 200 OK | Full updated `TodoItem` JSON | Valid input, item updated |
| 400 Bad Request | `{ "error": "Request body must contain at least one field to update" }` | Empty or missing body |
| 400 Bad Request | `{ "error": "title must be 255 characters or fewer" }` | Title too long |
| 400 Bad Request | `{ "error": "title must not be empty" }` | Empty title string |
| 404 Not Found | `{ "error": "Todo with id 42 not found" }` | ID does not exist |
| 415 Unsupported Media Type | `{ "error": "Content-Type must be application/json" }` | Wrong Content-Type |

---

#### `DELETE /todos/:id` — Delete a Todo

**Request**

```
DELETE /todos/42
```

**Responses**

| Status | Body | Condition |
|---|---|---|
| 200 OK | `{ "id": 42 }` | Item deleted |
| 404 Not Found | `{ "error": "Todo with id 42 not found" }` | ID does not exist |

---

#### Error Responses for Undefined Routes

```
GET /anything-else
→ 404 { "error": "Route not found" }
```

---

### Validation Rules (Service Layer)

| Field | Create | Update |
|---|---|---|
| `title` | Required; 1–255 chars; whitespace-only rejected | Optional; if present, 1–255 chars; whitespace-only rejected |
| `description` | Optional; if present, 0–1000 chars | Optional; if present, 0–1000 chars; null clears the field |
| `completed` | Optional; boolean; defaults to `false` | Optional; boolean |
| `id` | Assigned by DB; not accepted from client | Read-only; ignored if sent |
| `createdAt` | Assigned by DB; not accepted from client | Read-only; ignored if sent |

---

## Frontend Structure

The frontend is a single `public/index.html` file. No build step, no npm packages.

### Page Layout

```
┌─────────────────────────────────────────────┐
│  ✅  My Todos                               │
├─────────────────────────────────────────────┤
│  [Add a new task...        ] [Description ] │
│  [ Add Todo ]                               │
├─────────────────────────────────────────────┤
│  ⚠ Error banner (hidden by default)        │
│  ⏳ Loading indicator (hidden by default)   │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │ ☐  Buy groceries         [Edit][✕]  │    │
│  │    Milk, eggs, bread                │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ ☑  ~~Call dentist~~      [Edit][✕]  │    │  ← completed: strikethrough + muted
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### JavaScript Module Structure (in `<script>`)

```javascript
// CONFIG
const API_BASE = 'https://<render-app>.onrender.com'; // or window.location for local dev

// API CLIENT
const API = {
  fetchAll()           // GET /todos → TodoItem[]
  create(input)        // POST /todos → TodoItem
  update(id, input)    // PATCH /todos/:id → TodoItem
  del(id)              // DELETE /todos/:id → { id }
};

// STATE
let todos = []; // in-memory array, always mirrors last successful GET /todos

// RENDER
function renderList()           // Rebuilds #todo-list from todos[]
function renderTodoCard(item)   // Returns an HTMLElement for one todo
function showLoading(bool)      // Shows/hides loading banner
function showError(message)     // Shows error banner with message
function clearError()           // Hides error banner

// EVENT HANDLERS
// - Form submit → API.create → reload list
// - Checkbox click → API.update({ completed: !current }) → reload list
// - Edit button → inline edit mode (replace card content with input fields)
// - Save edit → API.update → reload list
// - Delete button → API.del → remove card from DOM
```

### Loading and Error States

- Before every API call: `showLoading(true)`
- On success: `showLoading(false)`, `clearError()`, re-render list
- On failure: `showLoading(false)`, `showError('Error ${status}: ${message}')` — surfaces HTTP status code as required

### Completed Item Styling

```css
.todo-card.completed .todo-title {
  text-decoration: line-through;
  opacity: 0.5;
}
.todo-card.completed {
  background-color: #f0f0f0;
}
```

---

## Deployment Architecture

### Backend: Render

The Express API is deployed as a **Web Service** on Render's free tier.

**`render.yaml`** (at repo root):

```yaml
services:
  - type: web
    name: todo-crud-api
    env: node
    buildCommand: npm install && npm run build
    startCommand: node dist/server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        fromService:
          type: web
          name: todo-crud-api
          property: port
      - key: DB_PATH
        value: ./todos.db
      - key: CORS_ORIGIN
        sync: false   # Set manually in Render dashboard to Netlify URL
```

The SQLite file is stored on Render's ephemeral disk. For production durability, `DB_PATH` should point to a mounted persistent disk (Render free tier provides ephemeral storage). The design supports swapping to a persistent disk path via environment variable.

**Build process:**

```
npm install              # install dependencies
npx tsc                  # compile TypeScript → dist/
node dist/server.js      # start server
```

### Frontend: Netlify

The `public/` folder is deployed as a **static site** on Netlify.

- No build step — Netlify serves `public/index.html` directly.
- The `API_BASE` constant in `index.html` is set to the Render backend URL.
- A `netlify.toml` at the repo root configures the publish directory:

```toml
[build]
  publish = "public"
  # no build command needed
```

### Environment Variables

| Variable | Where Set | Description |
|---|---|---|
| `PORT` | Render (auto) | HTTP server port |
| `DB_PATH` | Render dashboard | Path to SQLite file, e.g. `./todos.db` |
| `CORS_ORIGIN` | Render dashboard | Netlify frontend URL, e.g. `https://my-todos.netlify.app` |
| `NODE_ENV` | `render.yaml` | `production` or `development` |

---

## File and Folder Structure

```
todo-crud-app/
├── render.yaml                  # Render deployment config
├── netlify.toml                 # Netlify deployment config
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript compiler config
│
├── public/                      # Frontend (static, deployed to Netlify)
│   └── index.html               # Single-page app (HTML + CSS + JS)
│
├── src/                         # Backend source (TypeScript)
│   ├── server.ts                # HTTP server entry point
│   ├── app.ts                   # Express app factory
│   ├── db.ts                    # SQLite connection + schema init
│   ├── routes/
│   │   └── todos.ts             # Express router for /todos
│   ├── controllers/
│   │   └── todosController.ts   # Request/response handling
│   ├── services/
│   │   └── todosService.ts      # Business logic + DB queries
│   ├── models/
│   │   └── todo.ts              # TypeScript interfaces
│   └── middleware/
│       └── errorHandler.ts      # Global error handler
│
├── dist/                        # Compiled JS output (gitignored)
│
└── tests/                       # Test files
    ├── unit/
    │   └── todosService.test.ts # Unit tests for service layer
    └── integration/
        └── todos.api.test.ts    # Integration tests for API endpoints
```

**`package.json` key entries:**

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "ts-node-dev src/server.ts",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/express": "^4.17.21",
    "@types/better-sqlite3": "^7.6.8",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.11.5",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.2",
    "supertest": "^6.3.4",
    "@types/supertest": "^6.0.2",
    "fast-check": "^3.15.0",
    "ts-node-dev": "^2.0.0"
  }
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Create Round-Trip

*For any* valid title (1–255 non-whitespace-only characters) and optional description (up to 1000 characters), creating a todo via `POST /todos` and then retrieving it via `GET /todos/:id` SHALL return a response with the same title, description, and `completed` value, a valid numeric `id`, and a valid ISO timestamp in `createdAt`.

**Validates: Requirements 1.1, 1.3, 2.2**

---

### Property 2: Invalid Title Rejected

*For any* create or update request where the `title` field is an empty string, a string composed entirely of whitespace characters, or a string longer than 255 characters, the API SHALL return a 400 Bad Request response and SHALL NOT persist any changes.

**Validates: Requirements 1.2, 3.4**

---

### Property 3: Unique IDs on Bulk Creation

*For any* batch of N valid create requests submitted sequentially, the set of `id` values in the responses SHALL have exactly N distinct elements (no two todos share the same ID).

**Validates: Requirements 1.4**

---

### Property 4: List Ordering Invariant

*For any* set of todos stored in the database, `GET /todos` SHALL return them ordered by `createdAt` descending, with ties in `createdAt` broken by `id` ascending, and SHALL include every stored todo in the result (no items omitted).

**Validates: Requirements 2.1**

---

### Property 5: Non-Existent ID Returns 404

*For any* request to `GET /todos/:id`, `PATCH /todos/:id`, or `DELETE /todos/:id` where the given `id` does not exist in the database, the API SHALL return a 404 Not Found response whose body contains the text "not found".

**Validates: Requirements 2.3, 3.3, 4.2**

---

### Property 6: Partial Update Preserves Untouched Fields

*For any* existing todo and any valid partial update payload containing a non-empty subset of `{title, description, completed}`, `PATCH /todos/:id` SHALL update exactly the supplied fields to their new values and SHALL preserve the original values of all fields not included in the payload. The `id` and `createdAt` fields SHALL remain unchanged regardless of whether they are included in the update payload.

**Validates: Requirements 3.1, 3.2, 3.5, 3.7**

---

### Property 7: Delete Round-Trip

*For any* existing todo, after a successful `DELETE /todos/:id` (200 OK with the deleted `id` in the body), subsequent calls to `GET /todos/:id` SHALL return 404, and `GET /todos` SHALL not include the deleted item.

**Validates: Requirements 4.1, 4.3, 4.4**

---

### Property 8: JSON Content-Type on All Responses

*For any* request to any defined API endpoint (valid or invalid input), the response SHALL include a `Content-Type: application/json` header.

**Validates: Requirements 5.2, 5.3**

---

## Error Handling

### Backend Error Handling Strategy

Errors are handled at two levels:

1. **Controller level** — Input validation errors (400, 415) are caught synchronously before the service layer is called.
2. **Global middleware** — An Express error-handling middleware (`errorHandler.ts`) catches any unhandled errors and returns structured JSON responses.

```typescript
// middleware/errorHandler.ts
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON in request body' });
    return;
  }
  console.error(err);
  res.status(503).json({ error: 'Service temporarily unavailable' });
}
```

### HTTP Status Code Reference

| Status | Meaning | When Used |
|---|---|---|
| 200 OK | Success | GET, PATCH, DELETE success |
| 201 Created | Resource created | POST /todos success |
| 400 Bad Request | Client input error | Validation failures, malformed JSON |
| 404 Not Found | Resource missing | Unknown ID or undefined route |
| 415 Unsupported Media Type | Wrong content type | Non-JSON Content-Type on write operations |
| 503 Service Unavailable | DB failure | `better-sqlite3` throws unexpectedly |

### Database Error Handling

`better-sqlite3` is synchronous. A try/catch around all DB calls in the service layer, re-thrown as typed errors, allows the global error handler to return 503 when the DB is unavailable.

### Frontend Error Handling

All `fetch` calls are wrapped in try/catch. On any error (network failure or non-2xx response), the error banner is shown with the HTTP status code and message parsed from the JSON error body. Loading state is always cleared in the `finally` block.

---

## Testing Strategy

### Overview

The testing approach combines **integration tests** for API correctness and **property-based tests** for universal invariants. The frontend, being vanilla JS with no build step, is tested through manual browser testing and optional Playwright smoke tests.

### Property-Based Testing

The project uses **[fast-check](https://github.com/dubzzz/fast-check)** (TypeScript-compatible) for property-based tests.

Each property test runs a minimum of **100 iterations** with randomly generated inputs. Tests are tagged with a comment referencing the design property:

```typescript
// Feature: todo-crud-app, Property 1: Create Round-Trip
fc.assert(fc.asyncProperty(
  fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
  fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
  async (title, description) => {
    const created = await api.post('/todos', { title, description });
    expect(created.status).toBe(201);
    const fetched = await api.get(`/todos/${created.body.id}`);
    expect(fetched.body.title).toBe(title);
    expect(fetched.body.description).toBe(description);
    expect(fetched.body.completed).toBe(false);
  }
), { numRuns: 100 });
```

### Property Tests Summary

| Property | Test Location | fast-check Arbitraries |
|---|---|---|
| 1: Create Round-Trip | `tests/integration/todos.api.test.ts` | `fc.string`, `fc.option` |
| 2: Invalid Title Rejected | `tests/integration/todos.api.test.ts` | `fc.constant('')`, `fc.string().map(s => s.padEnd(256))`, whitespace generator |
| 3: Unique IDs on Bulk Creation | `tests/integration/todos.api.test.ts` | `fc.array(fc.string({ minLength: 1 }))` |
| 4: List Ordering Invariant | `tests/integration/todos.api.test.ts` | `fc.array(validTodoArbitrary)` |
| 5: Non-Existent ID → 404 | `tests/integration/todos.api.test.ts` | `fc.integer({ min: 999999 })` |
| 6: Partial Update Preserves Fields | `tests/integration/todos.api.test.ts` | `fc.record` with optional fields |
| 7: Delete Round-Trip | `tests/integration/todos.api.test.ts` | `validTodoArbitrary` |
| 8: JSON Content-Type | `tests/integration/todos.api.test.ts` | All request types |

### Unit Tests

Unit tests cover the service layer in isolation with an in-memory SQLite database:

- `todosService.test.ts` — Validates business logic for each CRUD operation, edge cases (empty body, boundary lengths), and the `id`/`createdAt` immutability rule.

### Integration Tests

Integration tests use **supertest** to run the full Express app against a real (in-memory) SQLite database:

- Happy path for each of the 5 endpoints
- Error cases: 400, 404, 415 responses
- Edge cases from prework: empty body on PATCH (400), malformed JSON (400), undefined route (404)

### Frontend Testing

The vanilla JS frontend is verified through:

- **Manual browser testing** against the local backend during development
- **Smoke tests** (optional Playwright): verify the page loads, todos are fetched, and the create form works end-to-end

### What is Not Property-Tested

- UI rendering and DOM interactions (not suitable for PBT — use example-based or browser tests)
- CORS configuration (smoke test — verify headers present on one preflight request)
- Deployment configuration validity (smoke test — verified at deploy time)
- DB durability across restarts (integration test — restart server in test, verify data persists)
