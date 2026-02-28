-- Allow any authenticated user to join a session that has no researcher yet
create policy "Authenticated users can join open sessions"
  on public.sessions for update
  using (auth.uid() is not null and researcher_user_id is null);

-- Allow any authenticated user to update forum post status (for join flow)
create policy "Authenticated users can update forum post status"
  on public.forum_posts for update
  using (auth.uid() is not null);
