-- Allow authors to delete their own forum posts (e.g. NPO unpublishing)
create policy "Authors can delete own forum posts"
  on public.forum_posts for delete
  using (auth.uid() = author_id);
