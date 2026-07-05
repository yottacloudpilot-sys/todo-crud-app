# Requirements Document

## Introduction

A modern Todo application that provides full CRUD (Create, Read, Update, Delete) operations for managing todo items. The application consists of a RESTful API backend and a modern web UI frontend. The completed application will be deployed to a free hosting platform (such as Render, Railway, or Vercel) to provide a live, publicly accessible endpoint.

## Glossary

- **Todo_Item**: A single task record containing an ID, title, optional description, completion status, and timestamps.
- **API**: The RESTful HTTP backend service that manages Todo_Items and exposes endpoints for CRUD operations.
- **UI**: The web-based frontend interface that users interact with to manage Todo_Items.
- **Client**: The end user accessing the application via a web browser.
- **Hosting_Platform**: A free cloud hosting service (e.g., Render, Railway, Vercel) that provides a publicly accessible URL for the deployed application.
- **ID**: A unique identifier assigned to each Todo_Item upon creation.
- **Completion_Status**: A boolean flag indicating whether a Todo_Item has been marked as done or not.

---

## Requirements

### Requirement 1: Create a Todo Item

**User Story:** As a Client, I want to create a new todo item, so that I can track tasks I need to complete.

#### Acceptance Criteria

1. WHEN a Client submits a valid create request with a title of 1–255 characters and an optional description of up to 1000 characters, THE API SHALL persist a new Todo_Item with a unique ID, the provided title, the provided description (or null if omitted), a Completion_Status defaulting to false unless the Client explicitly provides a Completion_Status value, and a creation timestamp.
2. IF a Client submits a create request with an empty or missing title, THEN THE API SHALL return a 400 Bad Request response with an error message indicating which field(s) failed validation.
3. WHEN a Todo_Item is successfully persisted to the data store, THE API SHALL return a 201 Created response containing the full Todo_Item representation including its ID, title, description, Completion_Status, and creation timestamp.
4. THE API SHALL assign each new Todo_Item a unique ID that does not collide with any existing Todo_Item ID.

---

### Requirement 2: Read Todo Items

**User Story:** As a Client, I want to retrieve todo items, so that I can view my current task list.

#### Acceptance Criteria

1. WHEN a Client sends a request to list all todo items, THE API SHALL return a 200 OK response containing an array of all stored Todo_Items ordered by creation timestamp in descending order, with ties broken by ID in ascending order.
2. WHEN a Client sends a request to retrieve a specific Todo_Item by ID, THE API SHALL return a 200 OK response containing the full Todo_Item representation including its ID, title, description, Completion_Status, and creation timestamp.
3. IF a Client sends a request to retrieve a Todo_Item using an ID that does not exist, THEN THE API SHALL return a 404 Not Found response with an error message containing the text "not found".
4. WHEN the todo list is empty, THE API SHALL return a 200 OK response containing an empty array.

---

### Requirement 3: Update a Todo Item

**User Story:** As a Client, I want to update an existing todo item, so that I can change its details or mark it as complete.

#### Acceptance Criteria

1. WHEN a Client submits a valid update request for an existing Todo_Item ID with at least one field (title, description, or Completion_Status) to update, THE API SHALL persist the changes and return a 200 OK response containing the updated Todo_Item representation including its ID, title, description, Completion_Status, and creation timestamp.
2. WHEN a Client submits an update request with a Completion_Status value for an existing Todo_Item, THE API SHALL set the Completion_Status to the exact boolean value provided in the request and return the updated Todo_Item.
3. IF a Client submits an update request for a Todo_Item ID that does not exist, THEN THE API SHALL return a 404 Not Found response with a descriptive error message.
4. IF a Client submits an update request with a title value that is empty or exceeds 255 characters, THEN THE API SHALL return a 400 Bad Request response with an error message indicating which field(s) failed validation.
5. THE API SHALL preserve all fields not included in the update request at their existing values.
6. IF a Client submits an update request with an empty or missing request body, THEN THE API SHALL return a 400 Bad Request response with a descriptive error message.
7. THE API SHALL not allow a Client to modify the ID or creation timestamp of an existing Todo_Item.

---

### Requirement 4: Delete a Todo Item

**User Story:** As a Client, I want to delete a todo item, so that I can remove tasks I no longer need to track.

#### Acceptance Criteria

1. WHEN a Client sends a delete request for an existing Todo_Item ID, THE API SHALL remove the Todo_Item from storage and return a 200 OK response with a body containing the deleted Todo_Item's ID.
2. IF a Client sends a delete request for a Todo_Item ID that does not exist, THEN THE API SHALL return a 404 Not Found response with a descriptive error message.
3. AFTER a Todo_Item is successfully deleted, WHEN a Client sends a request to list all todo items, THE API SHALL return a response that does not contain the deleted Todo_Item.
4. AFTER a Todo_Item is successfully deleted, IF a Client sends a request to retrieve the deleted Todo_Item by ID, THEN THE API SHALL return a 404 Not Found response.

---

### Requirement 5: RESTful API Design

**User Story:** As a developer, I want the API to follow RESTful conventions, so that integrating with the API is predictable and straightforward.

#### Acceptance Criteria

1. THE API SHALL expose the following endpoints: `POST /todos`, `GET /todos`, `GET /todos/:id`, `PATCH /todos/:id`, and `DELETE /todos/:id`.
2. THE API SHALL accept and return data in JSON format for all endpoints.
3. THE API SHALL include a `Content-Type: application/json` header in all responses.
4. IF a Client sends a request to an undefined route, THEN THE API SHALL return a 404 Not Found response with a descriptive error message.
5. THE API SHALL support Cross-Origin Resource Sharing (CORS) with configurable allowed origins and explicitly allow the methods GET, POST, PATCH, and DELETE so that the UI can make requests to the API from a browser.
6. IF a Client sends a request body with malformed JSON, THEN THE API SHALL return a 400 Bad Request response with a descriptive error message.
7. IF a Client sends a request with an unsupported Content-Type header, THEN THE API SHALL return a 415 Unsupported Media Type response.

---

### Requirement 6: Modern Web UI

**User Story:** As a Client, I want a modern and intuitive web interface, so that I can manage my todo items without needing to interact with the API directly.

#### Acceptance Criteria

1. WHEN the UI loads, THE UI SHALL fetch all Todo_Items from the API and display each item's title, description (if present), and Completion_Status.
2. THE UI SHALL provide a form or input control that allows a Client to create a new Todo_Item by entering a non-empty title and optional description; IF the title is empty, THE UI SHALL prevent submission and display an inline validation message.
3. THE UI SHALL provide a control on each Todo_Item that allows a Client to toggle its Completion_Status, sending the appropriate update request to the API.
4. THE UI SHALL provide a control on each Todo_Item that allows a Client to delete it, sending the appropriate delete request to the API.
5. THE UI SHALL provide a control on each Todo_Item that allows a Client to edit its title and description; IF the edited title is empty, THE UI SHALL prevent submission and display an inline validation message before sending the update request to the API.
6. WHEN an API request fails, THE UI SHALL display an error message that includes the HTTP status code or error reason to the Client.
7. WHEN an API request is in progress, THE UI SHALL display a loading indicator to the Client.
8. THE UI SHALL visually distinguish completed Todo_Items from incomplete Todo_Items using at least one observable CSS difference such as strikethrough text, reduced opacity, or a distinct background color.

---

### Requirement 7: Deployment to a Free Hosting Platform

**User Story:** As a developer, I want the application deployed to a free hosting platform, so that the application is publicly accessible via a live URL without any cost.

#### Acceptance Criteria

1. THE API SHALL be deployed and accessible via a public HTTPS URL on the free tier of a hosting platform (such as Render, Railway, or a comparable service).
2. THE UI SHALL be deployed and accessible via a public HTTPS URL on the free tier of a static hosting platform (such as Vercel, Netlify, or GitHub Pages).
3. THE Hosting_Platform SHALL serve the API such that `GET /todos` returns an HTTP 200 response with a JSON array body.
4. THE API SHALL read the following configuration values from environment variables: database connection URL, server port, and CORS allowed origins.
5. THE API SHALL include a deployment configuration file (e.g., `render.yaml`, `railway.toml`, or `vercel.json`) that defines both the build command and the start command for the Hosting_Platform.
6. THE API SHALL accept requests from the UI's public HTTPS origin, as configured via the CORS allowed origins environment variable.

---

### Requirement 8: Data Persistence

**User Story:** As a Client, I want my todo items to persist between sessions, so that I do not lose my task list when the server restarts.

#### Acceptance Criteria

1. WHEN a Todo_Item is created, updated, or deleted and the data store confirms the write, THE API SHALL guarantee that the change survives a server restart and is visible in subsequent read requests.
2. IF the data store is unavailable, THEN THE API SHALL return a 503 Service Unavailable response with a descriptive error message; WHEN the data store becomes available again, THE API SHALL resume normal operation without requiring a manual restart.
3. WHERE a free-tier data store is not available, THE API SHALL support a SQLite file-based data store as a fallback persistence option.
