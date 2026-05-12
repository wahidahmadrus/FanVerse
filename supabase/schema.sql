create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  display_name text not null default 'Fan Explorer',
  bio text not null default '',
  avatar_url text,
  favorite_artist text,
  first_character_id text check (first_character_id in ('en', 'uan', 'on', 'yal')),
  first_archive_character_id text check (first_archive_character_id in ('en', 'uan', 'on', 'yal')),
  is_admin boolean not null default false,
  role text not null default 'user',
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists role text not null default 'user';

alter table public.profiles
add column if not exists email text;

alter table public.profiles
add column if not exists is_admin boolean not null default false;

alter table public.profiles
add column if not exists status text not null default 'active'
check (status in ('active', 'disabled'));

alter table public.profiles
add column if not exists first_archive_character_id text
check (first_archive_character_id in ('en', 'uan', 'on', 'yal'));

-- first_character_id is the simplified app field for the chosen Archive Zero card.
-- first_archive_character_id is kept for older deployments and existing profile rows.
alter table public.profiles
add column if not exists first_character_id text
check (first_character_id in ('en', 'uan', 'on', 'yal'));

update public.profiles
set
  first_character_id = coalesce(first_character_id, first_archive_character_id),
  first_archive_character_id = coalesce(first_archive_character_id, first_character_id)
where first_character_id is distinct from first_archive_character_id
  or (first_character_id is null and first_archive_character_id is not null)
  or (first_archive_character_id is null and first_character_id is not null);

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
  base_stars integer not null default 0 check (base_stars >= 0),
  final_stars integer not null default 0 check (final_stars >= 0),
  proof_image_url text,
  has_proof boolean not null default false,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  memory_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memories_user_id_profiles_fkey foreign key (user_id)
    references public.profiles(user_id) on delete cascade
);

alter table public.memories
add column if not exists base_stars integer not null default 0 check (base_stars >= 0);

alter table public.memories
add column if not exists final_stars integer not null default 0 check (final_stars >= 0);

alter table public.memories
add column if not exists has_proof boolean not null default false;

update public.memories
set
  base_stars = case when base_stars = 0 then stars else base_stars end,
  final_stars = case when final_stars = 0 then stars else final_stars end,
  has_proof = coalesce(proof_image_url, '') <> ''
where base_stars = 0 or final_stars = 0 or has_proof = false;

create table if not exists public.badges (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null,
  condition_type text not null unique,
  condition_value integer not null default 1 check (condition_value >= 1),
  glow text not null default 'purple',
  created_at timestamptz not null default now()
);

alter table public.badges
add column if not exists condition_value integer not null default 1
check (condition_value >= 1);

alter table public.badges
drop constraint if exists badges_condition_type_key;

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null references public.badges(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table if not exists public.collectible_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  rarity text not null check (rarity in ('Common', 'Rare', 'Epic', 'Legendary', 'Monthly Special')),
  image_url text,
  thumbnail_url text,
  character_id text check (character_id in ('en', 'uan', 'on', 'yal')),
  story_fragment text,
  card_type text not null default 'normal_reward'
    check (card_type in ('achievement', 'character_story', 'monthly_premium', 'normal_reward')),
  unlock_condition_type text not null,
  unlock_condition_value integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists collectible_cards_title_key
on public.collectible_cards (title);

alter table public.collectible_cards
add column if not exists character_id text
check (character_id in ('en', 'uan', 'on', 'yal'));

-- Existing rows can leave thumbnail_url empty; the app falls back to image_url
-- until a card image is re-uploaded through the admin optimizer.
alter table public.collectible_cards
add column if not exists thumbnail_url text;

alter table public.collectible_cards
add column if not exists story_fragment text;

alter table public.collectible_cards
add column if not exists card_type text not null default 'normal_reward'
check (card_type in ('achievement', 'character_story', 'monthly_premium', 'normal_reward'));

create table if not exists public.user_collectible_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collectible_card_id uuid not null references public.collectible_cards(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unlock_month text,
  unlock_type text,
  unique (user_id, collectible_card_id)
);

alter table public.user_collectible_cards
add column if not exists unlock_month text;

alter table public.user_collectible_cards
add column if not exists unlock_type text;

-- Admin-managed Archive Zero story fragments. The app falls back to
-- src/data/archiveCharacters.js when this table is empty or unavailable.
create table if not exists public.character_story_fragments (
  id uuid primary key default gen_random_uuid(),
  character_id text not null check (character_id in ('en', 'uan', 'on', 'yal')),
  title text not null,
  content text not null,
  fragment_order integer not null default 1 check (fragment_order >= 1),
  unlock_rule text not null default 'locked'
    check (unlock_rule in ('default', 'chosen_character', 'premium_fragment', 'locked')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists character_story_fragments_character_order_idx
on public.character_story_fragments (character_id, fragment_order);

insert into public.badges (id, title, description, icon, condition_type, glow)
values
  ('first-memory', 'First Memory', 'You archived your first fan memory.', 'First', 'first_memory', 'gold'),
  ('concert-star', 'Concert Star', 'You saved a concert or live event memory.', 'Live', 'concert_star', 'pink'),
  ('streaming-hero', 'Streaming Hero', 'You documented your streaming support.', 'Stream', 'streaming_hero', 'blue'),
  ('fan-project-contributor', 'Fan Project Contributor', 'You joined or supported a fan project.', 'Project', 'fan_project', 'purple'),
  ('positive-fan', 'Positive Fan', 'You supported your artist in a healthy and meaningful way.', 'Care', 'positive_fan', 'gold'),
  ('seven-day-supporter', '7-Day Supporter', 'You showed consistent support over time.', '7 Days', 'seven_day_supporter', 'blue'),
  ('artist-supporter', 'Artist Supporter', 'You became a fan of an artist in the universe.', 'Fan', 'artist_supporter', 'purple')
  ,('proof-added', 'Proof Added', 'You added proof to make a memory more authentic.', 'Proof', 'proof_added', 'blue')
  ,('hundred-stars', '100 Stars', 'Your archive collected its first 100 stars.', '100', 'hundred_stars', 'gold')
  ,('fan-art-memory', 'Fan Art Memory', 'You archived a creative fan art moment.', 'Art', 'fan_art_memory', 'pink')
  ,('weekly-active', 'Weekly Active', 'You kept your archive alive this week.', 'Week', 'weekly_active', 'purple')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  condition_type = excluded.condition_type,
  glow = excluded.glow;

insert into public.collectible_cards
  (title, description, rarity, unlock_condition_type, unlock_condition_value, is_active)
values
  ('Legacy Begins', 'Your fan archive has officially started.', 'Common', 'first_memory', 1, true),
  ('First Memory Unlocked', 'You saved your first fandom memory.', 'Common', 'first_memory', 1, true),
  ('Rising Fan', 'Your fan journey is starting to shine.', 'Common', 'total_memories', 5, true),
  ('Memory Keeper', 'You are preserving your fandom history.', 'Rare', 'total_memories', 10, true),
  ('Archive Builder', 'Your fan archive is becoming meaningful.', 'Rare', 'total_memories', 25, true),
  ('Galaxy Creator', 'Your memories are forming a galaxy.', 'Epic', 'total_memories', 50, true),
  ('Star Collector', 'Your support is lighting up the universe.', 'Common', 'total_stars', 100, true),
  ('Supernova Fan', 'Your fandom energy shines brightly.', 'Epic', 'total_stars', 500, true),
  ('Verified Moment', 'You added proof to make a memory more authentic.', 'Common', 'proof_memories', 1, true),
  ('Proof Collector', 'Your memories carry proof and meaning.', 'Rare', 'proof_memories', 5, true),
  ('Concert Star', 'You archived a live concert memory.', 'Rare', 'concert_memories', 1, true),
  ('Fan Meet Memory', 'You saved a special fan meet moment.', 'Rare', 'fan_meet_memories', 1, true),
  ('Streaming Hero', 'You documented your music support.', 'Common', 'streaming_memories', 5, true),
  ('Voting Champion', 'You showed up when support mattered.', 'Rare', 'voting_memories', 5, true),
  ('Fan Art Creator', 'Your creativity became part of your archive.', 'Rare', 'fan_art_memories', 1, true),
  ('Social Supporter', 'You helped spread your artist work.', 'Common', 'social_support_memories', 5, true),
  ('Merch Memory', 'You saved a piece of your fandom collection.', 'Common', 'merch_memories', 1, true),
  ('Special Moment', 'Some memories deserve a brighter star.', 'Rare', 'special_moment_memories', 1, true),
  ('Artist First Fan', 'You were there from the beginning.', 'Legendary', 'artist_support_count', 1, true),
  ('Loyal Orbit', 'Your journey keeps orbiting one artist.', 'Epic', 'same_artist_memories', 10, true),
  ('Multi-Fandom Explorer', 'Your fan universe is expanding.', 'Rare', 'artist_support_count', 3, true),
  ('Weekly Spark', 'You kept your archive alive this week.', 'Common', 'weekly_active', 1, true),
  ('Monthly Flame', 'You showed up this month.', 'Monthly Special', 'monthly_active', 1, true),
  ('Golden Memory', 'One of your memories shines brighter than the rest.', 'Epic', 'golden_memory', 50, true),
  ('Cosmic Proof', 'A powerful memory with proof attached.', 'Epic', 'cosmic_proof', 1, true),
  ('Positive Fan', 'You support with love, not pressure.', 'Rare', 'total_memories', 10, true),
  ('Archive Soul', 'Your stories give your archive meaning.', 'Epic', 'detailed_memories', 10, true),
  ('Shooting Star', 'A rare moment crossed your fan universe.', 'Legendary', 'proof_special_moment', 1, true),
  ('Fandom Historian', 'You are preserving a full fandom journey.', 'Legendary', 'total_memories', 100, true),
  ('Legacy Unlocked', 'Your fan legacy is glowing across the universe.', 'Legendary', 'total_stars', 1000, true)
on conflict (title) do update set
  description = excluded.description,
  rarity = excluded.rarity,
  unlock_condition_type = excluded.unlock_condition_type,
  unlock_condition_value = excluded.unlock_condition_value,
  is_active = excluded.is_active;

insert into public.collectible_cards
  (
    title,
    description,
    rarity,
    character_id,
    story_fragment,
    card_type,
    unlock_condition_type,
    unlock_condition_value,
    is_active
  )
values
  (
    'En: Distant Signal',
    'The first Archive Zero card for quiet supporters who protect memories from far away.',
    'Monthly Special',
    'en',
    'The first signal En saved was barely visible: one late-night post, one tiny translation, and one fan memory almost lost to time.',
    'monthly_premium',
    'first_archive_card',
    1,
    true
  ),
  (
    'Uan: Endless Heartbeat',
    'The first Archive Zero card for fans searching for connection in every small detail.',
    'Monthly Special',
    'uan',
    'Uan found a hidden pattern in the archive: every saved detail glowed brighter when it came from a fan who wanted to be understood.',
    'monthly_premium',
    'first_archive_card',
    1,
    true
  ),
  (
    'On: Steady Pulse',
    'The first Archive Zero card for fans whose support stays warm when the fandom feels tired.',
    'Monthly Special',
    'on',
    'On restored warmth to a tired channel by saving the messages that helped fans remember why they started cheering.',
    'monthly_premium',
    'first_archive_card',
    1,
    true
  ),
  (
    'Yal: More Than Admiration',
    'The first Archive Zero card for fans learning how to understand powerful feelings.',
    'Monthly Special',
    'yal',
    'Yal entered Archive Zero through a memory that felt too bright to name, then began learning which feelings were hers to keep.',
    'monthly_premium',
    'first_archive_card',
    1,
    true
  )
on conflict (title) do update set
  description = excluded.description,
  rarity = excluded.rarity,
  character_id = excluded.character_id,
  story_fragment = excluded.story_fragment,
  card_type = excluded.card_type,
  unlock_condition_type = excluded.unlock_condition_type,
  unlock_condition_value = excluded.unlock_condition_value,
  is_active = excluded.is_active;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, display_name)
  values (
    new.id,
    new.email,
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
      and (role = 'admin' or is_admin = true)
  );
$$;

create or replace function public.prevent_profile_role_self_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    old.role is distinct from new.role
    or old.is_admin is distinct from new.is_admin
    or old.status is distinct from new.status
  )
    and auth.uid() is not null
    and not public.is_admin()
  then
    raise exception 'Only admins can change profile admin access or status.';
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
alter table public.collectible_cards enable row level security;
alter table public.user_collectible_cards enable row level security;
alter table public.character_story_fragments enable row level security;

insert into storage.buckets (id, name, public)
values
  ('memory-proofs', 'memory-proofs', true),
  ('avatars', 'avatars', true),
  ('artist-images', 'artist-images', true),
  ('collectible-cards', 'collectible-cards', true)
on conflict (id) do update set public = excluded.public;

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
with check (
  auth.uid() = user_id
  and role = 'user'
  and is_admin = false
  and status = 'active'
);

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

drop policy if exists "Anyone can read active collectible cards" on public.collectible_cards;
create policy "Anyone can read active collectible cards"
on public.collectible_cards for select
using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage collectible cards" on public.collectible_cards;
create policy "Admins can manage collectible cards"
on public.collectible_cards for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read their collectible cards" on public.user_collectible_cards;
create policy "Users can read their collectible cards"
on public.user_collectible_cards for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can unlock their collectible cards" on public.user_collectible_cards;
create policy "Users can unlock their collectible cards"
on public.user_collectible_cards for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Admins can manage user collectible cards" on public.user_collectible_cards;
create policy "Admins can manage user collectible cards"
on public.user_collectible_cards for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Anyone can read active character story fragments" on public.character_story_fragments;
create policy "Anyone can read active character story fragments"
on public.character_story_fragments for select
using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage character story fragments" on public.character_story_fragments;
create policy "Admins can manage character story fragments"
on public.character_story_fragments for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Anyone can read FanVerse uploads" on storage.objects;
create policy "Anyone can read FanVerse uploads"
on storage.objects for select
using (bucket_id in ('memory-proofs', 'avatars', 'artist-images', 'collectible-cards'));

drop policy if exists "Authenticated users can upload FanVerse images" on storage.objects;
create policy "Authenticated users can upload FanVerse images"
on storage.objects for insert
to authenticated
with check (bucket_id in ('memory-proofs', 'avatars', 'artist-images'));

drop policy if exists "Admins can manage collectible card uploads" on storage.objects;
create policy "Admins can manage collectible card uploads"
on storage.objects for all
to authenticated
using (bucket_id = 'collectible-cards' and public.is_admin())
with check (bucket_id = 'collectible-cards' and public.is_admin());
