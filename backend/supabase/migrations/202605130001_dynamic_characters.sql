create table if not exists public.characters (
  id text primary key,
  name text not null,
  title text not null default '',
  description text not null default '',
  quote text not null default '',
  gender text not null default '',
  image_url text,
  theme_color text not null default 'purple-blue',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.characters
add column if not exists title text not null default '';

alter table public.characters
add column if not exists description text not null default '';

alter table public.characters
add column if not exists quote text not null default '';

alter table public.characters
add column if not exists gender text not null default '';

alter table public.characters
add column if not exists image_url text;

alter table public.characters
add column if not exists theme_color text not null default 'purple-blue';

alter table public.characters
add column if not exists is_active boolean not null default true;

create index if not exists characters_active_name_idx
on public.characters (is_active, name);

insert into public.characters
  (id, name, title, description, quote, gender, theme_color, is_active)
values
  ('en', 'En', 'The Distant Devotee', 'A hidden supporter who protects memories from far away.', 'Even if I never reach your world, I''ll help your light travel farther.', 'boy', 'purple-blue', true),
  ('uan', 'Uan', 'The Endless Heart', 'A searching heart who notices the hidden details others miss.', 'I keep mistaking fascination for fate.', 'girl', 'pink-lavender', true),
  ('on', 'On', 'The Unbreakable Pulse', 'A bright pulse who keeps support gentle, patient, and alive.', 'If you truly support someone, you don''t disappear when things become difficult.', 'girl', 'gold-blue', true),
  ('yal', 'Yal', 'The One Who Wanted More', 'A powerful feeling trying to understand itself without disappearing.', 'I don''t want to admire from far away. I want to understand what I''m really feeling.', 'girl', 'violet-rose', true),
  ('soren', 'Soren', 'The Silent Vow', 'In quiet resolve, forgotten stories find their keeper.', '', '', 'purple-blue', true),
  ('mira', 'Mira', 'The Playful Prism', 'Where joy leaps forward, colors follow.', '', '', 'pink-lavender', true),
  ('lyra', 'Lyra', 'The Celestial Echo', 'Where starlight lingers, untold memories begin to sing.', '', '', 'gold-blue', true),
  ('aster', 'Aster', 'The Veil Toucher', 'Between shards of light, a hidden story awakens.', '', '', 'violet-rose', true)
on conflict (id) do nothing;

alter table public.profiles
drop constraint if exists profiles_first_character_id_check;

alter table public.profiles
drop constraint if exists profiles_first_archive_character_id_check;

alter table public.collectible_cards
drop constraint if exists collectible_cards_character_id_check;

alter table public.character_story_fragments
drop constraint if exists character_story_fragments_character_id_check;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_first_character_id_fkey'
  ) then
    alter table public.profiles
    add constraint profiles_first_character_id_fkey
    foreign key (first_character_id)
    references public.characters(id)
    on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_first_archive_character_id_fkey'
  ) then
    alter table public.profiles
    add constraint profiles_first_archive_character_id_fkey
    foreign key (first_archive_character_id)
    references public.characters(id)
    on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'collectible_cards_character_id_fkey'
  ) then
    alter table public.collectible_cards
    add constraint collectible_cards_character_id_fkey
    foreign key (character_id)
    references public.characters(id)
    on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'character_story_fragments_character_id_fkey'
  ) then
    alter table public.character_story_fragments
    add constraint character_story_fragments_character_id_fkey
    foreign key (character_id)
    references public.characters(id)
    on delete cascade;
  end if;
end;
$$;

alter table public.characters enable row level security;

insert into storage.buckets (id, name, public)
values ('character-images', 'character-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Anyone can read active characters" on public.characters;
create policy "Anyone can read active characters"
on public.characters for select
using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage characters" on public.characters;
create policy "Admins can manage characters"
on public.characters for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Anyone can read FanVerse uploads" on storage.objects;
create policy "Anyone can read FanVerse uploads"
on storage.objects for select
using (bucket_id in ('memory-proofs', 'avatars', 'artist-images', 'character-images', 'collectible-cards'));

drop policy if exists "Admins can manage character uploads" on storage.objects;
create policy "Admins can manage character uploads"
on storage.objects for all
to authenticated
using (bucket_id = 'character-images' and public.is_admin())
with check (bucket_id = 'character-images' and public.is_admin());
