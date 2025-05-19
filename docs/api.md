# API Routes

Below is a short overview of the available API endpoints. All routes live under `pages/api/`.

| Route | Method | Description |
|-------|--------|-------------|
| `/api/readings` | `GET` | List readings for a given `userId` query parameter. |
| `/api/readings` | `POST` | Create a new blood glucose reading with `{ value, userId }` in the body. |
| `/api/readings/[userId]/last` | `GET` | Fetch the latest reading for the specified user. |
| `/api/chat` | `POST` | Send chat messages to OpenAI. If a `userId` is provided, the last readings are included as context. |
| `/api/classify_meal` | `POST` | Upload an image (`image` field) and receive a JSON description of the meal and estimated carbs. |
| `/api/insights` | `GET` | Get a short insight report based on the last readings of the provided `userId`. |
| `/api/tts` | `POST` | Convert text to speech. Body must contain `{ text, voice? }`. |

