# Diabetics-AI

Diabetics‑AI is an experimental Next.js app that assists people with diabetes in tracking their glucose levels. The application stores readings locally in SQLite using Prisma and leverages OpenAI for conversational help and data analysis.

## Features

- **Chatbot** – talk with an AI assistant (Spanish responses) using text or voice.
- **Glucose history** – log readings, view recent entries and a chart with anomaly warnings.
- **AI insights** – brief analysis of the last readings powered by OpenAI.
- **Meal classifier** – upload a food photo and get an estimate of carbohydrates and a serving suggestion.
- **Export & share** – download your data as CSV or create a PDF report to share with a doctor.

## Setup

1. Install [Node.js](https://nodejs.org) (v18 or newer recommended).
2. Run `npm install` to install dependencies.
3. Configure the environment variables listed below in a `.env` file.
4. Initialize the database with Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment variables

- `OPENAI_API_KEY` – API key for OpenAI, required for chat, insights and text‑to‑speech.
- `DATABASE_URL` – connection string for Prisma. For local development the repo uses SQLite:
  ```env
  DATABASE_URL="file:./prisma/dev.db"
  ```
  After editing the schema run `npx prisma generate` or `npx prisma migrate dev` to apply changes.

## Useful commands

- `npm run dev` – run the Next.js dev server.
- `npm run build` – create a production build.
- `npx prisma migrate dev` – apply migrations and generate Prisma client.
- `npx prisma studio` – open the Prisma GUI to inspect data.
- `npm run lint` – run ESLint.

## API overview

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/readings` | `POST` | Save a glucose reading. |
| `/api/readings` | `GET` | List all readings for a user. Requires `userId` query parameter. |
| `/api/readings/[userId]/last` | `GET` | Fetch the last recorded reading. |
| `/api/chat` | `POST` | Send chat messages to the assistant. |
| `/api/insights` | `GET` | Get a short analysis of recent readings. Requires `userId`. |
| `/api/classify_meal` | `POST` | Upload a meal photo for nutrition estimation. |
| `/api/tts` | `POST` | Generate speech audio using OpenAI TTS. |

## Main components

- `ChatInterface` – chat UI with voice input and special commands to log or retrieve readings.
- `HistoryChart` – chart of past readings with anomaly alerts.
- `AIInsights` – shows the result returned by `/api/insights`.
- `MealClassifier` – handles the meal photo upload and response display.
- `ExportData` and `ShareWithDoctor` – allow downloading CSV data or generating a PDF report.

---

This project is for demonstration purposes only and should not replace professional medical advice.
