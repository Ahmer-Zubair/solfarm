# SolFarm Frontend

## Run locally

On Windows, double-click `START_SOLFARM.bat`.

Or run manually:

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, normally `http://localhost:5173`.

## Production build

```bash
npm run build
npm run preview
```

## Backend connection

Copy `.env.example` to `.env` and configure the Supabase URL and publishable key.

Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor and enable Anonymous Sign-Ins. See [`supabase/SETUP.md`](supabase/SETUP.md).

Never place a Supabase secret/service-role key in a Vite environment variable or frontend file.

The game still works locally when the backend is unavailable. Network-backed saves,
chat, marketplace, rewards, and mint records require the API.

## Included gameplay updates

- SolFarm branding throughout the frontend
- Town entry banner and Back to Farm controls
- Town editing and town mint controls disabled
- Four required character choices during farm creation
- Selected character used for the player
- Farm and town ambience plus movement, travel, and building sounds
- Exact current-tile building with a visible Build button
