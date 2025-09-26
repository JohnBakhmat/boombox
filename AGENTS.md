# Agent Guidelines for Boombox

## Commands
- **Build**: `bun run build` (web), no build needed for backend
- **Dev**: `bun run dev` (root - starts all workspaces), `bun run dev` (individual workspace)
- **Test**: `bun test` (backend), `bun test <file>` (single test)
- **Format**: `bun run format` (web only)
- **DB**: `bun db:migrate`, `bun db:gen` (from root)

## Code Style
- **Tabs**: Use tabs (4-width), 120 char line length
- **Imports**: Use absolute imports, no barrel files
- **TypeScript**: Strict - no `any`, explicit types preferred
- **Effect**: Use Effect.gen syntax, proper error handling with TaggedError
- **React**: Function components, Jotai for state, shadcn/ui components
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Error Handling**: Use Effect error handling, tagged errors for typed failures

## Framework Usage
- **Runtime**: Bun (not Node.js) - use `bun` commands, `Bun.file()`, etc.
- **Backend**: Elysia + Effect + Drizzle ORM + SQLite
- **Frontend**: Waku (React framework) + Jotai + UnoCSS + shadcn/ui
- **Database**: SQLite with Drizzle migrations

## Repository Structure
Monorepo with workspaces: `backend/`, `web/`, `shared/`. Use workspace references (`@boombox/shared`).

## Cursor Rules
- Use Bun instead of Node.js, npm, pnpm, or vite. Prefer `bun test`, `bun install`, `Bun.serve()`, etc.