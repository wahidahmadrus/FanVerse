# Fan Archive

Fan Archive is a public React + Vite MVP for a fandom memory platform. Fans can sign up, create profiles, discover artists, create artist archives, save public or private memories, upload proof images, unlock badges and collectible cards, and share rewards.

## Tech Stack

- React + Vite
- React Router DOM
- Supabase Auth + Postgres + RLS
- Supabase Storage
- Plain CSS

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project and run the SQL in `supabase/schema.sql` from the Supabase SQL editor. The schema creates the tables, RLS policies, collectible card seeds, and Storage buckets.

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
- `/collectibles` collectible cards
- `/create-artist` create an artist archive
- `/my-archive` personal archive
- `/profile` edit fan profile
- `/universe` personal badges and universe map
- `/admin` admin control center
- `/admin/collectibles` admin collectible card manager

## Database

The Supabase schema includes:

- `profiles`
- `artists`
- `artist_fans`
- `memories`
- `badges`
- `user_badges`
- `collectible_cards`
- `user_collectible_cards`

The schema also creates these public Storage buckets:

- `memory-proofs`
- `avatars`
- `artist-images`
- `collectible-cards`

Row Level Security is enabled so public memories are readable by everyone, private memories are readable only by their owner, and authenticated users can create/update only their own community data.

Admin user deactivation is handled with `profiles.status` (`active` or `disabled`). The frontend never uses a Supabase service-role key and does not delete Auth users directly.

## Resetting Supabase Data

Supabase Auth users live in `auth.users`, separate from the public app tables. If you delete rows from `public.profiles` but keep the same Auth users, sign-in can still work because authentication is still valid. The app recreates a missing profile on the next sign-in/session load, and you can also backfill profiles manually from the SQL editor:

```sql
insert into public.profiles (user_id, display_name)
select id, coalesce(raw_user_meta_data ->> 'display_name', email, 'Fan Explorer')
from auth.users
on conflict (user_id) do nothing;
```

## Rewards

Stars are calculated automatically from the memory activity type. Uploading an optional proof image applies a 2x star bonus and marks the memory as `Proof Added`.

Collectible cards unlock from milestones such as first memory, total memories, total stars, proof-added memories, concert memories, fan art memories, monthly activity, and artist support count.

## Admin Access

The admin page uses `profiles.role = 'admin'` and Supabase RLS policies. Do not put a Supabase service-role key in the frontend.

After creating your first account, promote it from the Supabase SQL editor:

```sql
update public.profiles
set role = 'admin',
    is_admin = true
where user_id = 'YOUR_AUTH_USER_ID';
```

If you previously ran an older version of `schema.sql`, rerun the updated trigger/policy section first. The trigger intentionally blocks role changes from normal app sessions, but allows direct SQL-editor bootstrap updates where `auth.uid()` is null.

Admins can access `/admin`, manage user roles, view private memories, moderate memory visibility, delete artists, memories, or badges, and manage collectible cards at `/admin/collectibles`.
