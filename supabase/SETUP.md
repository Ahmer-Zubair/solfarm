# SolFarm Supabase Setup

1. In Supabase, open **Authentication > Providers > Anonymous Sign-Ins** and enable anonymous users.
2. Open **SQL Editor**, paste `supabase/schema.sql`, and run it once.
3. Open **Realtime > Settings** and keep public Realtime channels enabled.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel.
5. Never add a Supabase secret/service-role key to Vite, GitHub, or browser code.

The client uses:
- Anonymous Auth for a persistent player identity.
- PostgREST with RLS for profiles, farm saves, and chat.
- Realtime Presence/Broadcast for online players, town movement, and live chat.
