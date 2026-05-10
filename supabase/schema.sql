create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null default 'Fan Explorer',
  bio text not null default '',
  avatar_url text,
  favorite_artist text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists role text not null default 'user';

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  description text not null default '',
  image_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artist_fans (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (artist_id, user_id)
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  artist_id uuid not null references public.artists(id) on delete cascade,
  title text not null,
  activity_type text not null,
  mood text not null,
  description text not null,
  stars integer not null default 0 check (stars >= 0),
  proof_image_url text,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  memory_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memories_user_id_profiles_fkey foreign key (user_id)
    references public.profiles(user_id) on delete cascade
);

create table if not exists public.badges (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null,
  condition_type text not null unique,
  glow text not null default 'purple',
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null references public.badges(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

insert into public.badges (id, title, description, icon, condition_type, glow)
values
  ('first-memory', 'First Memory', 'You archived your first fan memory.', 'First', 'first_memory', 'gold'),
  ('concert-star', 'Concert Star', 'You saved a concert or live event memory.', 'Live', 'concert_star', 'pink'),
  ('streaming-hero', 'Streaming Hero', 'You documented your streaming support.', 'Stream', 'streaming_hero', 'blue'),
  ('fan-project-contributor', 'Fan Project Contributor', 'You joined or supported a fan project.', 'Project', 'fan_project', 'purple'),
  ('positive-fan', 'Positive Fan', 'You supported your artist in a healthy and meaningful way.', 'Care', 'positive_fan', 'gold'),
  ('seven-day-supporter', '7-Day Supporter', 'You showed consistent support over time.', '7 Days', 'seven_day_supporter', 'blue'),
  ('artist-supporter', 'Artist Supporter', 'You became a fan of an artist in the universe.', 'Fan', 'artist_supporter', 'purple')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  condition_type = excluded.condition_type,
  glow = excluded.glow;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'Fan Explorer')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.prevent_profile_role_self_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role
    and auth.uid() is not null
    and not public.is_admin()
  then
    raise exception 'Only admins can change profile roles.';
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists prevent_profile_role_self_change on public.profiles;
create trigger prevent_profile_role_self_change
before update on public.profiles
for each row execute function public.prevent_profile_role_self_change();

alter table public.profiles enable row level security;
alter table public.artists enable row level security;
alter table public.artist_fans enable row level security;
alter table public.memories enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists "Anyone can read public profiles" on public.profiles;
create policy "Anyone can read public profiles"
on public.profiles for select
using (true);

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
on public.profiles for insert
with check (auth.uid() = user_id and role = 'user');

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Anyone can read artists" on public.artists;
create policy "Anyone can read artists"
on public.artists for select
using (true);

drop policy if exists "Admins can manage artists" on public.artists;
create policy "Admins can manage artists"
on public.artists for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Authenticated users can create artists" on public.artists;
create policy "Authenticated users can create artists"
on public.artists for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "Creators can update their artists" on public.artists;
create policy "Creators can update their artists"
on public.artists for update
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "Anyone can read artist fans" on public.artist_fans;
create policy "Anyone can read artist fans"
on public.artist_fans for select
using (true);

drop policy if exists "Admins can manage artist fans" on public.artist_fans;
create policy "Admins can manage artist fans"
on public.artist_fans for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can become fans" on public.artist_fans;
create policy "Users can become fans"
on public.artist_fans for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can remove their fan link" on public.artist_fans;
create policy "Users can remove their fan link"
on public.artist_fans for delete
using (auth.uid() = user_id);

drop policy if exists "Users can refresh their fan link" on public.artist_fans;
create policy "Users can refresh their fan link"
on public.artist_fans for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Anyone can read public memories" on public.memories;
create policy "Anyone can read public memories"
on public.memories for select
using (visibility = 'public' or auth.uid() = user_id);

drop policy if exists "Admins can manage memories" on public.memories;
create policy "Admins can manage memories"
on public.memories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can create their own memories" on public.memories;
create policy "Users can create their own memories"
on public.memories for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own memories" on public.memories;
create policy "Users can update their own memories"
on public.memories for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own memories" on public.memories;
create policy "Users can delete their own memories"
on public.memories for delete
using (auth.uid() = user_id);

drop policy if exists "Anyone can read badges" on public.badges;
create policy "Anyone can read badges"
on public.badges for select
using (true);

drop policy if exists "Admins can manage badges" on public.badges;
create policy "Admins can manage badges"
on public.badges for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read their badges" on public.user_badges;
create policy "Users can read their badges"
on public.user_badges for select
using (auth.uid() = user_id);

drop policy if exists "Admins can manage user badges" on public.user_badges;
create policy "Admins can manage user badges"
on public.user_badges for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can unlock their badges" on public.user_badges;
create policy "Users can unlock their badges"
on public.user_badges for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their badges" on public.user_badges;
create policy "Users can update their badges"
on public.user_badges for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
