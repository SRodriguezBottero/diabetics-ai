# Diabetics-AI

Diabetics‑AI is an experimental Next.js app that assists people with diabetes in tracking their glucose levels. The application stores readings in PostgreSQL using Prisma and leverages OpenAI for conversational help and data analysis.

## Features

- **Chatbot** – talk with an AI assistant (Spanish responses) using text or voice.
- **Glucose history** – log readings, view recent entries and a chart with anomaly warnings.
- **AI insights** – brief analysis of the last readings powered by OpenAI.
- **Meal classifier** – upload a food photo and get an estimate of carbohydrates and a serving suggestion.
- **Export & share** – download your data as CSV or create a PDF report to share with a doctor.

## Local Development Setup

### Prerequisites

- [Node.js](https://nodejs.org) v18 or newer
- PostgreSQL database (local or cloud)
- OpenAI API key

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment template and configure your variables:
   ```bash
   cp .env.example .env
   ```

3. Set up your PostgreSQL database connection in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/diabetics_ai"
   DIRECT_URL="postgresql://postgres:postgres@localhost:5432/diabetics_ai"
   ```

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to use the app.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string (pooled for serverless) |
| `DIRECT_URL` | Yes | PostgreSQL direct connection string (for migrations) |
| `NEXTAUTH_SECRET` | Yes | Secret for NextAuth.js session encryption. Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Dev only | Base URL for NextAuth. Set to `http://localhost:3000` for local dev. Auto-set on Vercel. |
| `OPENAI_API_KEY` | Yes | API key for OpenAI (chat, insights, TTS features) |

## Deploying to Vercel

### 1. Push to GitHub

Ensure your code is pushed to a GitHub repository.

### 2. Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and import your GitHub repository
2. Vercel will automatically detect it as a Next.js project

### 3. Set Up Vercel Postgres

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create Database** → **Postgres**
3. Follow the prompts to create a new PostgreSQL database
4. Vercel will automatically add the following environment variables:
   - `POSTGRES_URL` (use this as `DATABASE_URL`)
   - `POSTGRES_URL_NON_POOLING` (use this as `DIRECT_URL`)
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, etc.

### 4. Configure Environment Variables

In your Vercel project settings, go to **Settings** → **Environment Variables** and add:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Copy from `POSTGRES_PRISMA_URL` or `POSTGRES_URL` with `?pgbouncer=true` |
| `DIRECT_URL` | Copy from `POSTGRES_URL_NON_POOLING` |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `OPENAI_API_KEY` | Your OpenAI API key |

> **Note:** `NEXTAUTH_URL` is automatically set by Vercel to your deployment URL.

### 5. Run Database Migration

After the first deployment, run the Prisma migration against your production database:

```bash
# Using Vercel CLI
npx vercel env pull .env.production.local
npx prisma migrate deploy
```

Or use the Vercel Postgres dashboard to run the migration SQL directly.

### 6. Deploy

Push to your main branch or trigger a deployment from the Vercel dashboard. The build will automatically:
1. Install dependencies
2. Generate the Prisma client (`postinstall` script)
3. Build the Next.js application

## Alternative Database Options

### Using External PostgreSQL

You can use any PostgreSQL provider (Supabase, Neon, Railway, etc.):

1. Create a PostgreSQL database with your provider
2. Get the connection strings (pooled and direct)
3. Add them to Vercel environment variables as `DATABASE_URL` and `DIRECT_URL`

### Local Development with Docker

```bash
# Start a local PostgreSQL container
docker run --name diabetics-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=diabetics_ai \
  -p 5432:5432 \
  -d postgres:16

# Update .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/diabetics_ai"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/diabetics_ai"
```

## Useful Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:push` | Push schema changes without migration |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npx prisma migrate deploy` | Apply migrations (production) |

## API Overview

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/readings` | `POST` | Save a glucose reading |
| `/api/readings` | `GET` | List all readings for authenticated user |
| `/api/readings/last` | `GET` | Fetch the last recorded reading |
| `/api/chat` | `POST` | Send chat messages to the assistant |
| `/api/insights` | `GET` | Get AI analysis of recent readings |
| `/api/classify_meal` | `POST` | Upload a meal photo for nutrition estimation |
| `/api/tts` | `POST` | Generate speech audio using OpenAI TTS |
| `/api/auth/register` | `POST` | Register a new user |
| `/api/auth/[...nextauth]` | `*` | NextAuth.js authentication endpoints |

## Main Components

- `ChatInterface` – chat UI with voice input and special commands
- `HistoryChart` – chart of past readings with anomaly alerts
- `AIInsights` – displays AI analysis from `/api/insights`
- `MealClassifier` – handles meal photo upload and response
- `ExportData` and `ShareWithDoctor` – CSV download and PDF report generation

## Troubleshooting

### "NEXTAUTH_SECRET" error on Vercel

Make sure you've added `NEXTAUTH_SECRET` to your Vercel environment variables. Generate one with:
```bash
openssl rand -base64 32
```

### Database connection errors

- Verify your `DATABASE_URL` and `DIRECT_URL` are correct
- For Vercel Postgres, ensure you're using the pooled URL for `DATABASE_URL`
- Check that your database allows connections from Vercel's IP ranges

### Prisma Client not generated

The `postinstall` script should handle this automatically. If issues persist, run:
```bash
npx prisma generate
```

---

This project is for demonstration purposes only and should not replace professional medical advice.
