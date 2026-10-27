# VALE

VALE is a mobile-first social food and fitness product: an Instagram-style meal feed with editable AI-labelled nutrition estimates, daily logging, discovery, streaks, challenges, progress, and a lightweight nutrition assistant.

## Milestone 1

- Dispatch-owned Sign in with ChatGPT; user records are keyed to the stable authenticated user ID.
- Persistent D1 data for profiles, posts, follows, likes, bookmarks, comments, and meal logs.
- R2-backed meal photo uploads.
- Responsive feed, explore, log, progress, and profile experiences.
- Optimistic like, comment, bookmark, follow, share, and log-from-post interactions.
- Clearly labelled, editable nutrition estimates. The shipped no-secret MVP uses a fast local estimate experience; `OPENAI_API_KEY` is reserved for the production vision adapter.
- Private nutrition totals, dark mode, empty states, loading states, error fallbacks, and seeded demo content.

## Local development

Requirements: Node.js 22.13+.

```bash
npm install
npm run db:generate
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_old_arachne.sql
npm run dev
```

Open `http://localhost:5173/signin-with-chatgpt?return_to=/` to use the starter’s local signed-in identity. Hosted authentication is owned by the Sites runtime.

## Verification

```bash
npm test
npm run build
```

## Architecture

- `app/vale-app.tsx` — interactive product UI.
- `app/api/feed` — persisted, seeded social feed.
- `app/api/social` — likes, bookmarks, comments, and meal logging.
- `app/api/posts` and `app/api/media` — R2 upload and delivery path.
- `db/schema.ts` and `drizzle/` — D1 schema and migrations.
- `lib/demo-data.ts` — demo community content and UI fallback.

The architecture keeps AI analysis behind the post-creation seam, so an OpenAI vision call can replace the local estimator without changing feed, storage, or correction flows. Health connections, commerce, payments, medical nutrition plans, and delivery integrations are intentionally out of scope for this milestone.
