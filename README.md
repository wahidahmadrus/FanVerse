# FanVerse Archive

FanVerse Archive is a public React + Vite MVP for a fandom memory platform. Fans can sign up, create profiles, discover artists, create new artist archives, become fans, and save public or private memories backed by Supabase.

## Tech Stack

- React + Vite
- React Router DOM
- Supabase Auth + Postgres + RLS
- Plain CSS

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project and run the SQL in `supabase/schema.sql` from the Supabase SQL editor.

3. Copy `.env.example` to `.env` and add your project values:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Start the app:

```bash
npm run dev
```

## Scripts

- `npm run dev` starts the local development server.
- `npm run build` creates a production build.
- `npm run lint` checks the JavaScript and React code.

## Routes

- `/` landing page
- `/signup` sign up
- `/signin` sign in
- `/explore` public fan universe
- `/artists` artist directory
- `/artists/:artistId` artist community page
- `/dashboard` logged-in user dashboard
- `/add-memory` create a memory
- `/memories/:memoryId/edit` edit one of your memories
- `/create-artist` create an artist archive
- `/my-archive` personal archive
- `/profile` edit fan profile
- `/universe` personal badges and universe map
- `/admin` admin control center

## Database

The Supabase schema includes:

- `profiles`
- `artists`
- `artist_fans`
- `memories`
- `badges`
- `user_badges`

Row Level Security is enabled so public memories are readable by everyone, private memories are readable only by their owner, and authenticated users can create/update only their own community data.

## Admin Access

The admin page uses `profiles.role = 'admin'` and Supabase RLS policies. Do not put a Supabase service-role key in the frontend.

After creating your first account, promote it from the Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where user_id = 'YOUR_AUTH_USER_ID';
```

If you previously ran an older version of `schema.sql`, rerun the updated trigger/policy section first. The trigger intentionally blocks role changes from normal app sessions, but allows direct SQL-editor bootstrap updates where `auth.uid()` is null.

Admins can access `/admin`, manage user roles, view private memories, moderate memory visibility, and delete artists, memories, or badges.
