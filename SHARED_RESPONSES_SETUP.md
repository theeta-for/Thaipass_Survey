# Shared Survey Responses Setup

The app can now save survey responses to Supabase when these Vercel environment variables are set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Setup:

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run the SQL from `supabase-schema.sql`.
4. In Vercel, open the ThaiPass project settings.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. Redeploy the Vercel site.

Without those environment variables, the app still works locally, but responses are saved only in that browser.

Important: the current results password is only a simple client-side gate for internal review. Replace it with real backend authentication before production.
