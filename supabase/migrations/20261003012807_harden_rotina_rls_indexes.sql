create index if not exists habits_user_id_idx on public.habits using btree (user_id);
create index if not exists habits_user_created_at_idx on public.habits using btree (user_id, created_at);
create index if not exists habit_completions_user_id_idx on public.habit_completions using btree (user_id);
create index if not exists habit_completions_user_completed_on_idx on public.habit_completions using btree (user_id, completed_on);
create index if not exists notes_user_id_idx on public.notes using btree (user_id);
create index if not exists notes_user_created_at_idx on public.notes using btree (user_id, created_at);

drop policy if exists "profiles own rows" on public.profiles;
create policy "profiles own rows" on public.profiles
for all to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "habits own rows" on public.habits;
create policy "habits own rows" on public.habits
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "completions own rows" on public.habit_completions;
create policy "completions own rows" on public.habit_completions
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "notes own rows" on public.notes;
create policy "notes own rows" on public.notes
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "settings own rows" on public.user_settings;
create policy "settings own rows" on public.user_settings
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
