-- =====================================================================
-- Wildlands database schema for Supabase (Postgres)
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
-- Then run seed.sql the same way to load the nine houses and demo data.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists public.houses (
  id text primary key,                       -- slug, e.g. 'saranda'
  name text not null,
  place text not null,
  region text not null,
  landscape text not null,
  legendary text not null,
  legendary_emoji text not null default '🐾',
  mascot text not null,
  mascot_emoji text not null default '🐾',
  motto text not null default '',
  lore text not null default '',
  "values" jsonb not null default '[]'::jsonb,   -- ["Courage", ...]
  leaders jsonb not null default '[]'::jsonb,    -- [{"name": "...", "role": "..."}]
  color_primary text not null default '#2f6b3f',
  color_accent text not null default '#e3a72f',
  tree_kinds jsonb not null default '{"tech":"sal","sports":"sal","culture":"flower"}'::jsonb,
  total_seeds integer not null default 0
);

create table if not exists public.profiles (
  id uuid primary key,                       -- same id as auth.users for real accounts
  name text not null,
  handle text not null unique,
  avatar_url text,
  house_id text references public.houses(id),
  role text not null default 'member' check (role in ('member', 'house_admin', 'super_admin')),
  total_seeds integer not null default 0,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  track text not null check (track in ('tech', 'sports', 'culture')),
  seeds integer not null check (seeds > 0 and seeds <= 1000),
  starts_at timestamptz,
  ends_at timestamptz,
  house_id text references public.houses(id),   -- null = every house
  active boolean not null default true,
  needs_proof boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null,
  quest_id uuid not null,
  house_id text not null references public.houses(id),
  proof_url text,
  proof_text text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid,
  note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint submissions_member_id_fkey foreign key (member_id) references public.profiles(id) on delete cascade,
  constraint submissions_quest_id_fkey foreign key (quest_id) references public.quests(id) on delete cascade,
  constraint submissions_reviewed_by_fkey foreign key (reviewed_by) references public.profiles(id) on delete set null
);
-- A member can have at most one live (pending or approved) attempt per quest.
create unique index if not exists submissions_one_live_attempt
  on public.submissions (member_id, quest_id) where status <> 'rejected';
create index if not exists submissions_house_status on public.submissions (house_id, status);

create table if not exists public.forest_items (
  id uuid primary key default gen_random_uuid(),
  house_id text not null references public.houses(id),
  kind text not null,
  x integer not null check (x between 0 and 1000),
  y integer not null check (y between 0 and 1000),
  planted_by uuid,
  submission_id uuid references public.submissions(id) on delete set null,
  quest_id uuid references public.quests(id) on delete set null,
  source text not null default 'quest' check (source in ('quest', 'onboarding')),
  label text not null default '',
  track text check (track in ('tech', 'sports', 'culture')),
  seeds integer not null default 0,
  created_at timestamptz not null default now(),
  constraint forest_items_planted_by_fkey foreign key (planted_by) references public.profiles(id) on delete set null
);
create index if not exists forest_items_house on public.forest_items (house_id, created_at);

create table if not exists public.badges (
  id text primary key,
  name text not null,
  icon text not null,
  description text not null default '',
  rule jsonb not null default '{"type":"manual"}'::jsonb
);

create table if not exists public.member_badges (
  member_id uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (member_id, badge_id)
);

create table if not exists public.lore_cards (
  id uuid primary key default gen_random_uuid(),
  house_id text not null references public.houses(id) on delete cascade,
  position integer not null default 1,
  title text not null,
  body text not null default '',
  emoji text not null default '🌿'
);

create table if not exists public.trivia_questions (
  id uuid primary key default gen_random_uuid(),
  house_id text not null references public.houses(id) on delete cascade,
  position integer not null default 1,
  question text not null,
  options jsonb not null,            -- ["A", "B", "C", "D"]
  answer_index integer not null default 0
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  details text not null default '',
  house_id text references public.houses(id),
  created_at timestamptz not null default now(),
  constraint activity_log_actor_id_fkey foreign key (actor_id) references public.profiles(id) on delete set null
);

-- ---------------------------------------------------------------------
-- Helper functions used by the security rules
-- ---------------------------------------------------------------------

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.my_house() returns text
language sql stable security definer set search_path = public as $$
  select house_id from public.profiles where id = auth.uid()
$$;

-- True for super admins (any house, or house = null meaning "all houses"),
-- and for house admins when the house is their own.
create or replace function public.can_manage_house(p_house text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role = 'super_admin' or (role = 'house_admin' and p_house is not null and house_id = p_house)
       from public.profiles where id = auth.uid()),
    false)
$$;

-- ---------------------------------------------------------------------
-- Row Level Security: "staff only" signs inside the database
-- ---------------------------------------------------------------------

alter table public.houses enable row level security;
alter table public.profiles enable row level security;
alter table public.quests enable row level security;
alter table public.submissions enable row level security;
alter table public.forest_items enable row level security;
alter table public.badges enable row level security;
alter table public.member_badges enable row level security;
alter table public.lore_cards enable row level security;
alter table public.trivia_questions enable row level security;
alter table public.activity_log enable row level security;

-- Public, read-only for everyone (forests are meant to be seen).
drop policy if exists "houses are public" on public.houses;
create policy "houses are public" on public.houses for select using (true);
drop policy if exists "admins edit their house" on public.houses;
create policy "admins edit their house" on public.houses for update
  using (public.can_manage_house(id)) with check (public.can_manage_house(id));

drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles for select using (true);
drop policy if exists "members edit own profile" on public.profiles;
create policy "members edit own profile" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "quests are public" on public.quests;
create policy "quests are public" on public.quests for select using (true);
drop policy if exists "admins create quests" on public.quests;
create policy "admins create quests" on public.quests for insert with check (public.can_manage_house(house_id));
drop policy if exists "admins update quests" on public.quests;
create policy "admins update quests" on public.quests for update
  using (public.can_manage_house(house_id)) with check (public.can_manage_house(house_id));
drop policy if exists "admins delete quests" on public.quests;
create policy "admins delete quests" on public.quests for delete using (public.can_manage_house(house_id));

drop policy if exists "see own or managed submissions" on public.submissions;
create policy "see own or managed submissions" on public.submissions for select
  using (member_id = auth.uid() or public.can_manage_house(house_id));
drop policy if exists "members submit own proof" on public.submissions;
create policy "members submit own proof" on public.submissions for insert
  with check (
    member_id = auth.uid()
    and status = 'pending'
    and reviewed_by is null
    and house_id = public.my_house()
    and exists (
      select 1 from public.quests q
      where q.id = quest_id and q.active and (q.house_id is null or q.house_id = public.my_house())
    )
  );

drop policy if exists "forest is public" on public.forest_items;
create policy "forest is public" on public.forest_items for select using (true);

drop policy if exists "badges are public" on public.badges;
create policy "badges are public" on public.badges for select using (true);
drop policy if exists "super admins create badges" on public.badges;
create policy "super admins create badges" on public.badges for insert with check (public.my_role() = 'super_admin');

drop policy if exists "earned badges are public" on public.member_badges;
create policy "earned badges are public" on public.member_badges for select using (true);

drop policy if exists "lore is public" on public.lore_cards;
create policy "lore is public" on public.lore_cards for select using (true);
drop policy if exists "admins manage lore" on public.lore_cards;
create policy "admins manage lore" on public.lore_cards for all
  using (public.can_manage_house(house_id)) with check (public.can_manage_house(house_id));

drop policy if exists "trivia is public" on public.trivia_questions;
create policy "trivia is public" on public.trivia_questions for select using (true);
drop policy if exists "admins manage trivia" on public.trivia_questions;
create policy "admins manage trivia" on public.trivia_questions for all
  using (public.can_manage_house(house_id)) with check (public.can_manage_house(house_id));

drop policy if exists "admins read the log" on public.activity_log;
create policy "admins read the log" on public.activity_log for select using (public.can_manage_house(house_id));
drop policy if exists "admins write the log" on public.activity_log;
create policy "admins write the log" on public.activity_log for insert
  with check (actor_id = auth.uid() and public.can_manage_house(house_id));

-- Column-level rules: members may only change their name and photo, and may
-- only fill in the proof fields of a submission. Seeds, roles and statuses are
-- changed exclusively by the functions below.
revoke update on public.profiles from anon, authenticated;
grant update (name, avatar_url) on public.profiles to authenticated;
revoke insert, update, delete on public.submissions from anon, authenticated;
grant insert (member_id, quest_id, house_id, proof_url, proof_text) on public.submissions to authenticated;
revoke insert, update, delete on public.forest_items, public.member_badges from anon, authenticated;

-- Helpful read-only views (they respect the rules above).
create or replace view public.house_last_growth with (security_invoker = true) as
  select house_id, max(created_at) as last_at
  from public.forest_items where source = 'quest' group by house_id;

create or replace view public.quest_completions with (security_invoker = true) as
  select quest_id, count(*)::int as completions
  from public.forest_items where source = 'quest' and quest_id is not null group by quest_id;

-- ---------------------------------------------------------------------
-- New sign-ups get a profile automatically
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_name text := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(new.email, '@', 1),
    'Ranger');
  v_base text := left(regexp_replace(lower(coalesce(split_part(new.email, '@', 1), v_name)), '[^a-z0-9]', '', 'g'), 16);
  v_handle text;
  v_n int := 1;
begin
  if v_base = '' then v_base := 'ranger'; end if;
  v_handle := v_base;
  while exists (select 1 from public.profiles where handle = v_handle) loop
    v_n := v_n + 1;
    v_handle := v_base || v_n;
  end loop;
  insert into public.profiles (id, name, handle, avatar_url)
  values (new.id, v_name, v_handle, new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Game logic (each function runs as one transaction: all steps or none)
-- ---------------------------------------------------------------------

-- Checks every rule-based badge for a member and awards the new ones.
create or replace function public.award_earned_badges(p_member uuid) returns setof text
language plpgsql security definer set search_path = public as $$
declare
  b record;
  v_onboarded boolean;
  v_tech int; v_sports int; v_culture int;
  v_streak int;
  v_met boolean;
begin
  select onboarded into v_onboarded from public.profiles where id = p_member;

  select count(*) filter (where q.track = 'tech'),
         count(*) filter (where q.track = 'sports'),
         count(*) filter (where q.track = 'culture')
    into v_tech, v_sports, v_culture
    from public.submissions s join public.quests q on q.id = s.quest_id
   where s.member_id = p_member and s.status = 'approved';

  -- Longest run of consecutive weeks with an approved quest.
  select coalesce(max(run), 0) into v_streak from (
    select count(*) as run from (
      select wk, wk - row_number() over (order by wk) as grp
      from (select distinct (extract(epoch from date_trunc('week', created_at)) / 604800)::bigint as wk
              from public.submissions where member_id = p_member and status = 'approved') w
    ) g group by grp
  ) runs;

  for b in select * from public.badges
           where id not in (select badge_id from public.member_badges where member_id = p_member) loop
    v_met := case b.rule ->> 'type'
      when 'onboarding' then coalesce(v_onboarded, false)
      when 'quests_total' then v_tech + v_sports + v_culture >= (b.rule ->> 'count')::int
      when 'track_count' then
        case b.rule ->> 'track'
          when 'tech' then v_tech when 'sports' then v_sports else v_culture
        end >= (b.rule ->> 'count')::int
      when 'all_tracks' then v_tech > 0 and v_sports > 0 and v_culture > 0
      when 'streak_weeks' then v_streak >= (b.rule ->> 'count')::int
      else false
    end;
    if v_met then
      insert into public.member_badges (member_id, badge_id) values (p_member, b.id) on conflict do nothing;
      return next b.name;
    end if;
  end loop;
end $$;

create or replace function public.choose_house(p_house text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.houses where id = p_house) then
    raise exception 'Unknown house';
  end if;
  update public.profiles set house_id = p_house where id = auth.uid() and house_id is null;
  if not found then raise exception 'You have already picked a house.'; end if;
end $$;

create or replace function public.complete_onboarding() returns void
language plpgsql security definer set search_path = public as $$
declare
  p public.profiles;
begin
  select * into p from public.profiles where id = auth.uid() for update;
  if p.id is null or p.onboarded or p.house_id is null then return; end if;
  update public.profiles set onboarded = true where id = p.id;
  insert into public.forest_items (house_id, kind, x, y, planted_by, source, label)
  values (p.house_id, 'seedling', 30 + floor(random() * 940)::int, floor(random() * 1000)::int,
          p.id, 'onboarding', 'finishing Ranger Onboarding');
  perform public.award_earned_badges(p.id);
  insert into public.activity_log (actor_id, action, details, house_id)
  values (p.id, 'onboarded', p.name || ' finished Ranger Onboarding and planted a first seed', p.house_id);
end $$;

-- What happens when an admin presses "Approve" (or "Reject"):
-- 1. status changes  2. Seeds go to member and house  3. a forest item is planted
-- 4. badges are checked  5. the activity log gets a line. All or nothing.
create or replace function public.review_submissions(p_ids uuid[], p_decision text, p_note text default null)
returns json
language plpgsql security definer set search_path = public as $$
declare
  s public.submissions;
  q public.quests;
  m public.profiles;
  v_kind text;
  v_badge text;
  v_approved int := 0;
  v_rejected int := 0;
  v_badges text[] := '{}';
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;

  for s in select * from public.submissions where id = any(p_ids) and status = 'pending' for update loop
    if not public.can_manage_house(s.house_id) then
      raise exception 'You do not have permission to review this submission.';
    end if;
    select * into q from public.quests where id = s.quest_id;
    select * into m from public.profiles where id = s.member_id;

    update public.submissions
       set status = p_decision, reviewed_by = auth.uid(), reviewed_at = now(), note = nullif(p_note, '')
     where id = s.id;

    if p_decision = 'approved' then
      update public.profiles set total_seeds = total_seeds + q.seeds where id = s.member_id;
      update public.houses set total_seeds = total_seeds + q.seeds where id = s.house_id;
      select coalesce(tree_kinds ->> q.track, 'sal') into v_kind from public.houses where id = s.house_id;
      insert into public.forest_items (house_id, kind, x, y, planted_by, submission_id, quest_id, source, label, track, seeds)
      values (s.house_id, v_kind, 30 + floor(random() * 940)::int, floor(random() * 1000)::int,
              s.member_id, s.id, q.id, 'quest', q.title, q.track, q.seeds);
      for v_badge in select * from public.award_earned_badges(s.member_id) loop
        v_badges := v_badges || (m.name || ': ' || v_badge);
      end loop;
      v_approved := v_approved + 1;
    else
      v_rejected := v_rejected + 1;
    end if;

    insert into public.activity_log (actor_id, action, details, house_id)
    values (auth.uid(), p_decision,
            initcap(p_decision) || ' "' || q.title || '" for ' || m.name
              || coalesce(' (note: ' || nullif(p_note, '') || ')', ''),
            s.house_id);
  end loop;

  return json_build_object('approved', v_approved, 'rejected', v_rejected, 'new_badges', to_json(v_badges));
end $$;

create or replace function public.award_bonus(p_member uuid, p_seeds int, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare
  m public.profiles;
begin
  select * into m from public.profiles where id = p_member for update;
  if m.id is null then raise exception 'Member not found'; end if;
  if not public.can_manage_house(m.house_id) then raise exception 'You do not have permission to do that.'; end if;
  if p_seeds is null or p_seeds = 0 or abs(p_seeds) > 1000 then raise exception 'Seeds must be between -1000 and 1000'; end if;
  update public.profiles set total_seeds = greatest(0, total_seeds + p_seeds) where id = m.id;
  update public.houses set total_seeds = greatest(0, total_seeds + p_seeds) where id = m.house_id;
  insert into public.activity_log (actor_id, action, details, house_id)
  values (auth.uid(), 'bonus', 'Gave ' || p_seeds || ' bonus Seeds to ' || m.name || ': ' || coalesce(p_reason, ''), m.house_id);
end $$;

create or replace function public.award_badge(p_member uuid, p_badge text) returns void
language plpgsql security definer set search_path = public as $$
declare
  m public.profiles;
  b public.badges;
begin
  select * into m from public.profiles where id = p_member;
  select * into b from public.badges where id = p_badge;
  if m.id is null or b.id is null then raise exception 'Member or badge not found'; end if;
  if not public.can_manage_house(m.house_id) then raise exception 'You do not have permission to do that.'; end if;
  insert into public.member_badges (member_id, badge_id) values (m.id, b.id) on conflict do nothing;
  if found then
    insert into public.activity_log (actor_id, action, details, house_id)
    values (auth.uid(), 'badge_awarded', 'Awarded ' || b.icon || ' ' || b.name || ' to ' || m.name, m.house_id);
  end if;
end $$;

create or replace function public.set_member_role(p_member uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
declare
  m public.profiles;
begin
  if public.my_role() is distinct from 'super_admin' then raise exception 'Only super admins can change roles.'; end if;
  if p_role not in ('member', 'house_admin', 'super_admin') then raise exception 'Unknown role'; end if;
  update public.profiles set role = p_role where id = p_member returning * into m;
  if m.id is null then raise exception 'Member not found'; end if;
  insert into public.activity_log (actor_id, action, details, house_id)
  values (auth.uid(), 'role_changed', 'Changed ' || m.name || '''s role to ' || replace(p_role, '_', ' '), m.house_id);
end $$;

-- Only signed-in users may call the game functions; the internal helper is private.
revoke execute on function public.award_earned_badges(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.choose_house(text), public.complete_onboarding(),
  public.review_submissions(uuid[], text, text), public.award_bonus(uuid, int, text),
  public.award_badge(uuid, text), public.set_member_role(uuid, text) from public, anon;
grant execute on function public.choose_house(text), public.complete_onboarding(),
  public.review_submissions(uuid[], text, text), public.award_bonus(uuid, int, text),
  public.award_badge(uuid, text), public.set_member_role(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- File storage for proof photos (public bucket, members upload into their own folder)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', true)
on conflict (id) do nothing;

drop policy if exists "members upload own proofs" on storage.objects;
create policy "members upload own proofs" on storage.objects for insert to authenticated
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
