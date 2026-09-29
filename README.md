# Diabetics-AI

<!-- MARKETING: headline -->
> **Registrá tu glucosa. Entendé patrones. Compartí con tu médico.**
>
> Diabetics-AI es tu compañero de registro: historial, insights con IA y reportes listos para la consulta. No reemplaza consejo médico.
<!-- /MARKETING: headline -->

<!-- MARKETING: one-pager -->
Diabetics-AI ayuda a personas con diabetes a registrar glucosa, ver tendencias y preparar la consulta. Free = log + chart. Pro = chat, insights y meals con IA. Hecho para uso diario, con disclaimer claro: apoyo al registro, no diagnóstico.
<!-- /MARKETING: one-pager -->

## Free vs Premium

| Feature | Free | Premium |
| --- | :---: | :---: |
| Registro de glucosa ilimitado | ✅ | ✅ |
| Gráficos e historial | ✅ | ✅ |
| Exportar CSV | ✅ | ✅ |
| Chat con IA | 10/mes | ♾️ Ilimitado |
| AI Insights (análisis de patrones) | 5/mes | ♾️ Ilimitado |
| Clasificador de comidas | 3/mes | ♾️ Ilimitado |
| PDF para compartir con médico | ❌ | ✅ |
| Soporte prioritario | ❌ | ✅ |

<!-- MARKETING: paywall -->
El plan gratuito cubre registro y gráficos. Pro desbloquea chat con IA, insights automáticos y clasificador de comidas — USD 9.99/mes.

**[Probar Pro →](/pricing)**
<!-- /MARKETING: paywall -->

## Features

- **Registro de glucosa** — Anotá tus mediciones de forma simple, con soporte offline
- **Gráficos e historial** — Visualizá tendencias y detectá anomalías
- **Chat con IA** — Preguntale sobre tus datos (voz o texto)
- **AI Insights** — Resúmenes automáticos de patrones observados
- **Clasificador de comidas** — Subí una foto y obtené estimaciones de carbohidratos
- **Exportar y compartir** — Descargá CSV o generá un PDF para tu médico

## Local Development Setup

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- PostgreSQL database (local or cloud)
- OpenAI API key
- Stripe account (for subscription features)

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
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (`sk_test_...` for test mode, `sk_live_...` for production). Get it at [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (`pk_test_...` or `pk_live_...`). Used client-side for Stripe.js |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook secret for verifying Stripe events (`whsec_...`). Get it when creating a webhook endpoint, or use `stripe listen --forward-to localhost:3000/api/stripe/webhook` for local dev |
| `STRIPE_PRICE_ID` | Yes | Price ID for the Premium subscription plan (`price_...`). Create a product in Stripe Dashboard → Products with $9.99/month recurring |

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
4. Vercel will automatically add the connection environment variables

### 4. Configure Environment Variables

In your Vercel project settings, go to **Settings** → **Environment Variables** and add:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Copy from `POSTGRES_PRISMA_URL` or `POSTGRES_URL` with `?pgbouncer=true` |
| `DIRECT_URL` | Copy from `POSTGRES_URL_NON_POOLING` |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Your Stripe webhook secret |
| `STRIPE_PRICE_ID` | Your Stripe price ID for Premium |

> **Note:** `NEXTAUTH_URL` is automatically set by Vercel to your deployment URL.

### 5. Configure Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

### 6. Run Database Migration

After the first deployment, run the Prisma migration against your production database:

```bash
npx vercel env pull .env.production.local
npx prisma migrate deploy
```

### 7. Deploy

Push to your main branch or trigger a deployment from the Vercel dashboard.

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
| `/api/chat` | `POST` | Send chat messages to the AI companion |
| `/api/insights` | `GET` | Get AI analysis of recent readings |
| `/api/classify_meal` | `POST` | Upload a meal photo for nutrition estimation |
| `/api/tts` | `POST` | Generate speech audio using OpenAI TTS |
| `/api/subscription` | `GET` | Get current user subscription status |
| `/api/stripe/create-checkout-session` | `POST` | Create Stripe checkout session for Premium |
| `/api/stripe/create-portal-session` | `POST` | Create Stripe customer portal session |
| `/api/stripe/webhook` | `POST` | Handle Stripe webhook events |
| `/api/auth/register` | `POST` | Register a new user |
| `/api/auth/[...nextauth]` | `*` | NextAuth.js authentication endpoints |

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Medical Disclaimer

**Diabetics-AI is NOT a medical device and does NOT provide medical advice.**

This application is a glucose logging companion designed to help you track your readings, visualize patterns, and prepare data to share with your healthcare provider. The AI features provide observations about your data patterns — they do not diagnose, treat, or offer medical recommendations.

- **Do not** use this app as a substitute for professional medical advice, diagnosis, or treatment
- **Do not** make health decisions based solely on information from this app
- **Always** consult your doctor, endocrinologist, or qualified healthcare provider for medical guidance
- **Always** follow your prescribed treatment plan and medication schedule

The creators and contributors of Diabetics-AI are not liable for any health outcomes resulting from the use of this application. If you experience a medical emergency, contact your local emergency services immediately.
