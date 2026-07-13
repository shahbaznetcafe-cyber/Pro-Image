-- SBZ SellImage Pro - Phase 8 SaaS schema
-- The seller_* prefix keeps this product isolated inside a shared Supabase project.

create schema if not exists private;

create table if not exists public.seller_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  business_name text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro', 'agency')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_image_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.seller_profiles(id) on delete cascade,
  job_type text not null,
  original_filename text,
  original_size_kb integer,
  output_count integer not null default 0,
  total_output_size_kb integer not null default 0,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.seller_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.seller_profiles(id) on delete cascade,
  job_id uuid not null unique references public.seller_image_jobs(id) on delete cascade,
  action text not null,
  file_count integer not null default 1 check (file_count > 0),
  status text not null default 'reserved'
    check (status in ('reserved', 'consumed', 'released')),
  created_at timestamptz not null default now()
);

create table if not exists public.seller_payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.seller_profiles(id) on delete cascade,
  plan text not null check (plan in ('starter', 'pro', 'agency')),
  method text not null check (method in ('PayPal', 'Wise', 'Bank Transfer', 'Other', 'JazzCash', 'Easypaisa')),
  transaction_ref text not null check (char_length(trim(transaction_ref)) between 4 and 120),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.seller_profiles(id) on delete set null
);

-- Keep existing local-launch payment records valid while exposing international
-- methods for all new requests.
alter table public.seller_payment_requests
  drop constraint if exists seller_payment_requests_method_check;
alter table public.seller_payment_requests
  add constraint seller_payment_requests_method_check
  check (method in ('PayPal', 'Wise', 'Bank Transfer', 'Other', 'JazzCash', 'Easypaisa'));

create table if not exists public.seller_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.seller_profiles(id) on delete cascade,
  payment_request_id uuid unique references public.seller_payment_requests(id) on delete set null,
  plan text not null check (plan in ('starter', 'pro', 'agency')),
  status text not null default 'active'
    check (status in ('active', 'expired', 'cancelled')),
  start_date timestamptz not null default now(),
  end_date timestamptz
);

create index if not exists seller_usage_logs_user_created_idx
  on public.seller_usage_logs (user_id, created_at desc);
create index if not exists seller_image_jobs_user_created_idx
  on public.seller_image_jobs (user_id, created_at desc);
create index if not exists seller_payment_requests_status_created_idx
  on public.seller_payment_requests (status, created_at asc);
create index if not exists seller_payment_requests_user_idx
  on public.seller_payment_requests (user_id);
create index if not exists seller_payment_requests_reviewer_idx
  on public.seller_payment_requests (reviewed_by)
  where reviewed_by is not null;
create index if not exists seller_subscriptions_user_idx
  on public.seller_subscriptions (user_id);
create unique index if not exists seller_payment_transaction_unique_idx
  on public.seller_payment_requests (method, lower(transaction_ref));

create or replace function private.seller_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.seller_profiles
    where id = (select auth.uid())
      and is_admin = true
  );
$$;

revoke all on function private.seller_is_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.seller_is_admin() to authenticated;

create or replace function public.seller_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.seller_profiles (id, full_name, business_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'business_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists seller_on_auth_user_created on auth.users;
create trigger seller_on_auth_user_created
  after insert on auth.users
  for each row execute function public.seller_handle_new_user();

insert into public.seller_profiles (id, full_name, business_name)
select
  id,
  nullif(trim(coalesce(raw_user_meta_data ->> 'full_name', '')), ''),
  nullif(trim(coalesce(raw_user_meta_data ->> 'business_name', '')), '')
from auth.users
on conflict (id) do nothing;

create or replace function public.seller_reserve_usage(
  p_action text,
  p_file_count integer,
  p_original_filename text default null,
  p_original_size_kb integer default null,
  p_expected_output_count integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan text;
  v_monthly_limit integer;
  v_batch_limit integer;
  v_monthly_used integer;
  v_daily_used integer;
  v_job_id uuid;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_file_count is null or p_file_count < 1 then
    raise exception 'INVALID_FILE_COUNT';
  end if;
  if p_action not in ('seller_pack', 'batch_seller_pack') then
    raise exception 'INVALID_ACTION';
  end if;

  select plan into v_plan
  from public.seller_profiles
  where id = v_user_id
  for update;

  if v_plan is null then
    raise exception 'PROFILE_NOT_READY';
  end if;

  v_monthly_limit := case v_plan
    when 'starter' then 300
    when 'pro' then 1500
    when 'agency' then 5000
    else 150
  end;
  v_batch_limit := case v_plan
    when 'starter' then 10
    when 'pro' then 30
    when 'agency' then 100
    else 1
  end;

  if p_file_count > v_batch_limit then
    raise exception 'BATCH_LIMIT_EXCEEDED:%', v_batch_limit;
  end if;

  select coalesce(sum(file_count), 0)::integer into v_monthly_used
  from public.seller_usage_logs
  where user_id = v_user_id
    and (status = 'consumed' or (status = 'reserved' and created_at >= now() - interval '1 hour'))
    and created_at >= date_trunc('month', now());

  if v_monthly_used + p_file_count > v_monthly_limit then
    raise exception 'MONTHLY_LIMIT_EXCEEDED:%', v_monthly_limit;
  end if;

  if v_plan = 'free' then
    select coalesce(sum(file_count), 0)::integer into v_daily_used
    from public.seller_usage_logs
    where user_id = v_user_id
      and (status = 'consumed' or (status = 'reserved' and created_at >= now() - interval '1 hour'))
      and created_at >= date_trunc('day', now());

    if v_daily_used + p_file_count > 5 then
      raise exception 'DAILY_LIMIT_EXCEEDED:5';
    end if;
  end if;

  insert into public.seller_image_jobs (
    user_id,
    job_type,
    original_filename,
    original_size_kb,
    output_count,
    status,
    completed_at
  )
  values (
    v_user_id,
    p_action,
    left(p_original_filename, 255),
    greatest(coalesce(p_original_size_kb, 0), 0),
    greatest(coalesce(p_expected_output_count, 0), 0),
    'completed',
    now()
  )
  returning id into v_job_id;

  insert into public.seller_usage_logs (user_id, job_id, action, file_count, status)
  values (v_user_id, v_job_id, p_action, p_file_count, 'consumed');

  return jsonb_build_object(
    'job_id', v_job_id,
    'plan', v_plan,
    'monthly_limit', v_monthly_limit,
    'monthly_used', v_monthly_used + p_file_count,
    'monthly_remaining', v_monthly_limit - v_monthly_used - p_file_count,
    'batch_limit', v_batch_limit
  );
end;
$$;

-- Job completion is intentionally not client-callable. Quota is consumed when
-- processing starts so users cannot release or rewrite their own usage records.
drop function if exists public.seller_complete_job(uuid, integer, integer, text);

-- Quota refund for undelivered work (e.g. a strict-quality block where the user
-- receives no ZIP). Deliberately NOT gated on auth.uid(): it is authorised by a
-- server-held secret, so a client cannot un-charge its own *delivered* packs.
-- Only the backend, which knows a job produced no deliverable, holds the secret.
-- Flipping 'consumed' -> 'released' removes the row from the monthly usage sum.
create table if not exists private.seller_release_secret (
  id boolean primary key default true check (id),
  secret text not null
);
-- Set once with a long random value that matches the backend SELLER_RELEASE_SECRET:
--   insert into private.seller_release_secret (secret) values ('<long-random-secret>')
--   on conflict (id) do update set secret = excluded.secret;

create or replace function public.seller_release_usage(
  p_job_id uuid,
  p_secret text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expected text;
  v_user_id uuid;
begin
  select secret into v_expected from private.seller_release_secret where id = true;
  if v_expected is null or p_secret is null or p_secret <> v_expected then
    raise exception 'RELEASE_NOT_ALLOWED';
  end if;

  update public.seller_usage_logs
  set status = 'released'
  where job_id = p_job_id and status = 'consumed'
  returning user_id into v_user_id;

  if v_user_id is null then
    -- Unknown job or already released: idempotent no-op.
    return jsonb_build_object('job_id', p_job_id, 'released', false);
  end if;

  update public.seller_image_jobs
  set status = 'failed', completed_at = now()
  where id = p_job_id;

  return jsonb_build_object('job_id', p_job_id, 'released', true);
end;
$$;

revoke all on function public.seller_release_usage(uuid, text) from public;
-- anon is required because the arq worker calls this with the publishable key;
-- the shared secret is the actual gate, not the caller's role.
grant execute on function public.seller_release_usage(uuid, text) to anon, authenticated;

create or replace function public.seller_approve_payment_request(
  p_request_id uuid,
  p_admin_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.seller_payment_requests%rowtype;
begin
  if not private.seller_is_admin() then
    raise exception 'ADMIN_REQUIRED';
  end if;

  select * into v_request
  from public.seller_payment_requests
  where id = p_request_id
    and status = 'pending'
  for update;

  if not found then
    raise exception 'PENDING_REQUEST_NOT_FOUND';
  end if;

  update public.seller_payment_requests
  set status = 'approved',
      admin_note = nullif(trim(coalesce(p_admin_note, '')), ''),
      reviewed_at = now(),
      reviewed_by = auth.uid()
  where id = p_request_id;

  update public.seller_profiles
  set plan = v_request.plan, updated_at = now()
  where id = v_request.user_id;

  update public.seller_subscriptions
  set status = 'expired', end_date = least(coalesce(end_date, now()), now())
  where user_id = v_request.user_id and status = 'active';

  insert into public.seller_subscriptions (
    user_id, payment_request_id, plan, status, start_date, end_date
  ) values (
    v_request.user_id, v_request.id, v_request.plan, 'active', now(), now() + interval '30 days'
  );

  return jsonb_build_object(
    'request_id', v_request.id,
    'user_id', v_request.user_id,
    'plan', v_request.plan,
    'status', 'approved'
  );
end;
$$;

create or replace function public.seller_reject_payment_request(
  p_request_id uuid,
  p_admin_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  if not private.seller_is_admin() then
    raise exception 'ADMIN_REQUIRED';
  end if;

  update public.seller_payment_requests
  set status = 'rejected',
      admin_note = nullif(trim(coalesce(p_admin_note, '')), ''),
      reviewed_at = now(),
      reviewed_by = auth.uid()
  where id = p_request_id
    and status = 'pending'
  returning user_id into v_user_id;

  if not found then
    raise exception 'PENDING_REQUEST_NOT_FOUND';
  end if;

  return jsonb_build_object(
    'request_id', p_request_id,
    'user_id', v_user_id,
    'status', 'rejected'
  );
end;
$$;

revoke all on function public.seller_handle_new_user() from public, anon, authenticated;
revoke all on function public.seller_reserve_usage(text, integer, text, integer, integer) from public, anon;
revoke all on function public.seller_approve_payment_request(uuid, text) from public, anon;
revoke all on function public.seller_reject_payment_request(uuid, text) from public, anon;
grant execute on function public.seller_reserve_usage(text, integer, text, integer, integer) to authenticated;
grant execute on function public.seller_approve_payment_request(uuid, text) to authenticated;
grant execute on function public.seller_reject_payment_request(uuid, text) to authenticated;

alter table public.seller_profiles enable row level security;
alter table public.seller_image_jobs enable row level security;
alter table public.seller_usage_logs enable row level security;
alter table public.seller_payment_requests enable row level security;
alter table public.seller_subscriptions enable row level security;

revoke all on table public.seller_profiles from anon, authenticated;
revoke all on table public.seller_image_jobs from anon, authenticated;
revoke all on table public.seller_usage_logs from anon, authenticated;
revoke all on table public.seller_payment_requests from anon, authenticated;
revoke all on table public.seller_subscriptions from anon, authenticated;

grant select on public.seller_profiles to authenticated;
grant update (full_name, business_name, updated_at) on public.seller_profiles to authenticated;
grant select on public.seller_image_jobs to authenticated;
grant select on public.seller_usage_logs to authenticated;
grant select on public.seller_payment_requests to authenticated;
grant insert (user_id, plan, method, transaction_ref) on public.seller_payment_requests to authenticated;
grant select on public.seller_subscriptions to authenticated;

drop policy if exists "seller profile read" on public.seller_profiles;
create policy "seller profile read"
on public.seller_profiles for select to authenticated
using ((select auth.uid()) = id or private.seller_is_admin());

drop policy if exists "seller profile update basics" on public.seller_profiles;
create policy "seller profile update basics"
on public.seller_profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "seller jobs read" on public.seller_image_jobs;
create policy "seller jobs read"
on public.seller_image_jobs for select to authenticated
using ((select auth.uid()) = user_id or private.seller_is_admin());

drop policy if exists "seller usage read" on public.seller_usage_logs;
create policy "seller usage read"
on public.seller_usage_logs for select to authenticated
using ((select auth.uid()) = user_id or private.seller_is_admin());

drop policy if exists "seller payments read" on public.seller_payment_requests;
create policy "seller payments read"
on public.seller_payment_requests for select to authenticated
using ((select auth.uid()) = user_id or private.seller_is_admin());

drop policy if exists "seller payments submit" on public.seller_payment_requests;
create policy "seller payments submit"
on public.seller_payment_requests for insert to authenticated
with check ((select auth.uid()) = user_id and status = 'pending');

drop policy if exists "seller subscriptions read" on public.seller_subscriptions;
create policy "seller subscriptions read"
run kar di haion public.seller_subscriptions for select to authenticated
using ((select auth.uid()) = user_id or private.seller_is_admin());
