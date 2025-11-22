# Architectural Issues & Tasks

## High Priority (Stability & Performance)
- [ ] **Fix Critical Memory Usage in `FlacService`**
    - **Location**: `src/flac/service.ts`
    - **Issue**: `readMetadata` uses `fs.readFile` to load entire audio files (often 20-100MB) into memory just to read headers.
    - **Task**: Implement partial reads (open file descriptor -> read buffer) to parse headers and Vorbis comments without loading the binary audio data.

- [ ] **Implement Pagination for API Endpoints**
    - **Location**: `src/api.ts`
    - **Issue**: `getAlbumList` and `getAllSongs` fetch the entire database table in a single query.
    - **Task**: Add limit/offset or cursor-based pagination parameters to these endpoints and updated the database queries accordingly.

- [ ] **Optimize Library Synchronization**
    - **Location**: `src/file-parser.ts` & `src/sync-library.ts`
    - **Issue**: `readDirectory` and the sync stream load all file paths into memory before processing. `alreadyIndexed` loads the entire file table.
    - **Task**: Refactor to use a streaming directory iterator and batched database lookups to handle large libraries (50k+ songs) without OOM.

## Medium Priority (Reliability & Maintainability)
- [ ] **Standardize API Error Handling**
    - **Location**: `src/api.ts`
    - **Issue**: Inconsistent error handling. Some endpoints map errors explicitly, others rely on `runtime.runPromise` which may cause unhandled promise rejections or generic 500s for domain errors.
    - **Task**: Create a standardized wrapper or middleware that executes Effects and maps specific `TaggedError` types to HTTP status codes (404, 400, etc.).

- [ ] **Decouple API from Database Logic**
    - **Location**: `src/api.ts`
    - **Issue**: API handlers contain `db.query` and `db.select` calls directly ("Active Record" pattern in controllers).
    - **Task**: Extract database queries into a dedicated Repository layer or specific Service methods to enable unit testing without a database connection.

## Low Priority (Code Quality)
- [ ] **Refactor Effect <-> Elysia Adapter**
    - **Location**: `src/api.ts`
    - **Issue**: Manual calls to `runtime.runPromise` in every handler create boilerplate.
    - **Task**: specific utility helper to bind Effect workflows directly to Elysia handlers.

- [ ] **Externalize Configuration**
    - **Location**: `src/index.ts`
    - **Issue**: Server port `3003` is hardcoded.
    - **Task**: Use Effect's `Config` module to make the port configurable via environment variables.
