begin;

-- The foundation migration preserves every source user UUID in Better Auth.
-- Stop here if that invariant no longer holds.
do $$
begin
  if exists (
    select 1
    from auth.users source_user
    where source_user.email is not null
      and not exists (
        select 1
        from app_auth."user" app_user
        where app_user.id = source_user.id
      )
  ) then
    raise exception 'app_auth user UUID parity check failed';
  end if;
end
$$;

alter table public.beta_access
  drop constraint beta_access_user_id_fkey,
  add constraint beta_access_user_id_fkey foreign key (user_id)
    references app_auth."user"(id) on delete cascade;

alter table public.beta_auth_events
  drop constraint beta_auth_events_actor_user_id_fkey,
  add constraint beta_auth_events_actor_user_id_fkey foreign key (actor_user_id)
    references app_auth."user"(id) on delete set null,
  drop constraint beta_auth_events_target_user_id_fkey,
  add constraint beta_auth_events_target_user_id_fkey foreign key (target_user_id)
    references app_auth."user"(id) on delete set null;

alter table public.bmad_action_items
  drop constraint bmad_action_items_assigned_to_fkey,
  add constraint bmad_action_items_assigned_to_fkey foreign key (assigned_to)
    references app_auth."user"(id);

alter table public.bmad_sessions
  drop constraint bmad_sessions_user_id_fkey,
  add constraint bmad_sessions_user_id_fkey foreign key (user_id)
    references app_auth."user"(id);

alter table public.conversations
  drop constraint conversations_user_id_fkey,
  add constraint conversations_user_id_fkey foreign key (user_id)
    references app_auth."user"(id);

alter table public.credit_transactions
  drop constraint credit_transactions_user_id_fkey,
  add constraint credit_transactions_user_id_fkey foreign key (user_id)
    references app_auth."user"(id) on delete cascade;

alter table public.feedback
  drop constraint feedback_user_id_fkey,
  add constraint feedback_user_id_fkey foreign key (user_id)
    references app_auth."user"(id) on delete cascade;

alter table public.message_bookmarks
  drop constraint message_bookmarks_user_id_fkey,
  add constraint message_bookmarks_user_id_fkey foreign key (user_id)
    references app_auth."user"(id);

alter table public.message_references
  drop constraint message_references_user_id_fkey,
  add constraint message_references_user_id_fkey foreign key (user_id)
    references app_auth."user"(id);

alter table public.payment_history
  drop constraint payment_history_user_id_fkey,
  add constraint payment_history_user_id_fkey foreign key (user_id)
    references app_auth."user"(id) on delete cascade;

alter table public.trial_feedback
  drop constraint trial_feedback_user_id_fkey,
  add constraint trial_feedback_user_id_fkey foreign key (user_id)
    references app_auth."user"(id) on delete cascade;

alter table public.user_credits
  drop constraint user_credits_user_id_fkey,
  add constraint user_credits_user_id_fkey foreign key (user_id)
    references app_auth."user"(id) on delete cascade;

alter table public.user_workspace
  drop constraint user_workspace_user_id_fkey,
  add constraint user_workspace_user_id_fkey foreign key (user_id)
    references app_auth."user"(id) on delete cascade;

alter table public.workspaces
  drop constraint workspaces_user_id_fkey,
  add constraint workspaces_user_id_fkey foreign key (user_id)
    references app_auth."user"(id) on delete cascade;

-- Authorization now happens in authenticated server routes with actor-scoped SQL.
do $$
declare
  item record;
begin
  for item in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      item.policyname,
      item.schemaname,
      item.tablename
    );
  end loop;

  for item in
    select namespace.nspname as schema_name, relation.relname as table_name
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and (relation.relrowsecurity or relation.relforcerowsecurity)
  loop
    execute format(
      'alter table %I.%I disable row level security',
      item.schema_name,
      item.table_name
    );
  end loop;
end
$$;

-- Remove Supabase-auth signup automation. Better Auth application flows own it now.
drop trigger if exists create_workspace_on_user_signup on auth.users;
drop trigger if exists on_auth_user_created_beta on auth.users;
drop trigger if exists on_auth_user_created_credits on auth.users;
drop trigger if exists trigger_grant_free_credit on auth.users;

-- These SECURITY DEFINER functions depended on auth.uid() or auth.users and have
-- been replaced by actor-scoped application transactions.
drop function if exists public.append_chat_message(uuid, jsonb);
drop function if exists public.deduct_credit_transaction(uuid, uuid);
drop function if exists public.ensure_user_workspaces();
drop function if exists public.increment_message_count(text);
drop function if exists public.merge_lean_canvas(uuid, jsonb);

-- Keep the imported auth schema until rollback verification is complete. It can
-- be removed only after the checks below return no dependencies.
do $$
begin
  if exists (
    select 1
    from pg_constraint constraint_row
    join pg_class relation on relation.oid = constraint_row.conrelid
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where constraint_row.contype = 'f'
      and constraint_row.confrelid = 'auth.users'::regclass
      and namespace.nspname = 'public'
  ) then
    raise exception 'public foreign keys still reference auth.users';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
  ) then
    raise exception 'public RLS policies remain';
  end if;

  if exists (
    select 1
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and (relation.relrowsecurity or relation.relforcerowsecurity)
  ) then
    raise exception 'public row-level security remains enabled';
  end if;
end
$$;

commit;
