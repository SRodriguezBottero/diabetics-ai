# Project Architecture

This Next.js application follows a simple structure:

- **pages/** – Contains page components under `pages/*.tsx` and API routes under `pages/api/`. UI pages render React components and call the API routes for server side work.
- **components/** – Reusable React components used by the pages. Examples include the chat interface and charts.
- **prisma/** – Prisma ORM setup. The `schema.prisma` file defines the `Reading` model and migrations keep the SQLite database schema in sync.

## Data Flow

1. **User Interaction** – Users interact with React components on the pages (e.g. logging a reading or sending a chat message).
2. **API Calls** – Components send requests to endpoints under `pages/api/` such as `/api/readings` or `/api/chat`.
3. **Database & OpenAI** – API handlers persist and fetch data using Prisma and may call OpenAI services.
4. **Response** – Results are returned back to the client where components update the UI.
