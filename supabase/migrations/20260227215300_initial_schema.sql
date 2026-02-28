-- Clean slate (cascade drops policies + triggers too)
drop table if exists public.forum_upvotes cascade;
drop table if exists public.forum_comments cascade;
drop table if exists public.forum_posts cascade;
drop table if exists public.sessions cascade;
drop table if exists public.profiles cascade;

-- ============================================
-- PROFILES
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  role text not null check (role in ('npo', 'researcher')),
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ============================================
-- SESSIONS
-- ============================================
create table public.sessions (
  id text primary key,
  npo_user_id uuid references public.profiles not null,
  researcher_user_id uuid references public.profiles,
  current_phase int not null default 1,
  tags jsonb not null default '[]'::jsonb,
  combination_history jsonb not null default '[]'::jsonb,
  problem_statement jsonb,
  scoping_questions jsonb not null default '[]'::jsonb,
  current_question_index int not null default 0,
  sidebar jsonb not null default '{"agreedRequirements":[],"constraints":[],"openQuestions":[]}'::jsonb,
  charter jsonb,
  phase1_complete boolean not null default false,
  phase2_complete boolean not null default false,
  npo_agreed_phase2 boolean not null default false,
  researcher_agreed_phase2 boolean not null default false,
  phase2_both_agreed boolean not null default false,
  npo_signed_off boolean not null default false,
  researcher_signed_off boolean not null default false,
  published_to_forum boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sessions enable row level security;

create policy "Session participants can read"
  on public.sessions for select using (
    auth.uid() = npo_user_id or auth.uid() = researcher_user_id
  );

create policy "NPO can update own session"
  on public.sessions for update using (
    auth.uid() = npo_user_id or auth.uid() = researcher_user_id
  );

create policy "Authenticated users can create sessions"
  on public.sessions for insert with check (auth.uid() = npo_user_id);

create policy "Anyone authenticated can check session existence"
  on public.sessions for select using (auth.uid() is not null);

-- ============================================
-- FORUM POSTS
-- ============================================
create table public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  session_id text references public.sessions not null,
  author_id uuid references public.profiles not null,
  title text not null,
  plain_english text not null,
  technical_interpretation text not null,
  tags jsonb not null default '[]'::jsonb,
  category text not null default 'general',
  upvote_count int not null default 0,
  comment_count int not null default 0,
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed')),
  created_at timestamptz not null default now()
);

alter table public.forum_posts enable row level security;

create policy "Forum posts are viewable by everyone authenticated"
  on public.forum_posts for select using (auth.uid() is not null);

create policy "Authors can create forum posts"
  on public.forum_posts for insert with check (auth.uid() = author_id);

create policy "Authors can update own posts"
  on public.forum_posts for update using (auth.uid() = author_id);

-- ============================================
-- FORUM COMMENTS
-- ============================================
create table public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.forum_posts on delete cascade not null,
  author_id uuid references public.profiles not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.forum_comments enable row level security;

create policy "Comments are viewable by everyone authenticated"
  on public.forum_comments for select using (auth.uid() is not null);

create policy "Authenticated users can create comments"
  on public.forum_comments for insert with check (auth.uid() = author_id);

create policy "Authors can update own comments"
  on public.forum_comments for update using (auth.uid() = author_id);

create policy "Authors can delete own comments"
  on public.forum_comments for delete using (auth.uid() = author_id);

-- ============================================
-- FORUM UPVOTES
-- ============================================
create table public.forum_upvotes (
  post_id uuid references public.forum_posts on delete cascade not null,
  user_id uuid references public.profiles not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.forum_upvotes enable row level security;

create policy "Upvotes are viewable by everyone authenticated"
  on public.forum_upvotes for select using (auth.uid() is not null);

create policy "Authenticated users can upvote"
  on public.forum_upvotes for insert with check (auth.uid() = user_id);

create policy "Users can remove own upvote"
  on public.forum_upvotes for delete using (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_session_update
  before update on public.sessions
  for each row execute function public.handle_updated_at();

create or replace function public.handle_upvote_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.forum_posts set upvote_count = upvote_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.forum_posts set upvote_count = upvote_count - 1 where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger on_upvote_change
  after insert or delete on public.forum_upvotes
  for each row execute function public.handle_upvote_count();

create or replace function public.handle_comment_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.forum_posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.forum_posts set comment_count = comment_count - 1 where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger on_comment_change
  after insert or delete on public.forum_comments
  for each row execute function public.handle_comment_count();

-- Enable realtime
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.forum_posts;
alter publication supabase_realtime add table public.forum_comments;
