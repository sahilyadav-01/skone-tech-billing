-- SK One Tech Billing: multi-company database and Row Level Security
-- Run this file once in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (company_id,user_id),
  unique (user_id)
);

create table if not exists public.company_data (
  company_id uuid primary key references public.companies(id) on delete cascade,
  data jsonb not null default '{"customers":[],"items":[],"invoices":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.company_data enable row level security;

drop policy if exists "Members can read their company" on public.companies;
create policy "Members can read their company"
on public.companies for select
to authenticated
using (exists (
  select 1 from public.company_members member
  where member.company_id=companies.id and member.user_id=auth.uid()
));

drop policy if exists "Users can read their membership" on public.company_members;
create policy "Users can read their membership"
on public.company_members for select
to authenticated
using (user_id=auth.uid());

drop policy if exists "Members can read company data" on public.company_data;
create policy "Members can read company data"
on public.company_data for select
to authenticated
using (exists (
  select 1 from public.company_members member
  where member.company_id=company_data.company_id and member.user_id=auth.uid()
));

drop policy if exists "Members can insert company data" on public.company_data;
create policy "Members can insert company data"
on public.company_data for insert
to authenticated
with check (exists (
  select 1 from public.company_members member
  where member.company_id=company_data.company_id and member.user_id=auth.uid()
));

drop policy if exists "Members can update company data" on public.company_data;
create policy "Members can update company data"
on public.company_data for update
to authenticated
using (exists (
  select 1 from public.company_members member
  where member.company_id=company_data.company_id and member.user_id=auth.uid()
))
with check (exists (
  select 1 from public.company_members member
  where member.company_id=company_data.company_id and member.user_id=auth.uid()
));

create or replace function public.create_company_for_current_user(company_name text)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  current_user_id uuid:=auth.uid();
  new_company_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select company_id into new_company_id
  from public.company_members
  where user_id=current_user_id;

  if new_company_id is not null then
    return new_company_id;
  end if;

  if company_name is null or char_length(trim(company_name))<2 then
    raise exception 'A valid company name is required';
  end if;

  insert into public.companies(name,created_by)
  values (trim(company_name),current_user_id)
  returning id into new_company_id;

  insert into public.company_members(company_id,user_id,role)
  values (new_company_id,current_user_id,'owner');

  insert into public.company_data(company_id)
  values (new_company_id);

  return new_company_id;
end;
$$;

revoke all on function public.create_company_for_current_user(text) from public;
grant execute on function public.create_company_for_current_user(text) to authenticated;

grant select on public.companies to authenticated;
grant select on public.company_members to authenticated;
grant select,insert,update on public.company_data to authenticated;
