-- Upgrade an existing SK One Tech Billing database to multi-company accounts.
-- Safe to run more than once in the Supabase SQL Editor.

alter table public.companies add column if not exists legal_name text;
alter table public.companies add column if not exists gstin text;
alter table public.companies add column if not exists phone text;
alter table public.companies add column if not exists email text;
alter table public.companies add column if not exists address text;
alter table public.companies add column if not exists invoice_prefix text not null default 'INV';
alter table public.companies add column if not exists bank_name text;
alter table public.companies add column if not exists bank_branch text;
alter table public.companies add column if not exists bank_account text;
alter table public.companies add column if not exists bank_ifsc text;
alter table public.companies add column if not exists logo_data text;

alter table public.company_members drop constraint if exists company_members_user_id_key;

drop policy if exists "Admins can update their company" on public.companies;
create policy "Admins can update their company"
on public.companies for update
to authenticated
using (exists (
  select 1 from public.company_members member
  where member.company_id=companies.id and member.user_id=auth.uid() and member.role in ('owner','admin')
))
with check (exists (
  select 1 from public.company_members member
  where member.company_id=companies.id and member.user_id=auth.uid() and member.role in ('owner','admin')
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
  if company_name is null or char_length(trim(company_name))<2 then
    raise exception 'A valid company name is required';
  end if;
  insert into public.companies(name,created_by)
  values (trim(company_name),current_user_id)
  returning id into new_company_id;
  insert into public.company_members(company_id,user_id,role)
  values (new_company_id,current_user_id,'owner');
  insert into public.company_data(company_id) values (new_company_id);
  return new_company_id;
end;
$$;

revoke all on function public.create_company_for_current_user(text) from public;
grant execute on function public.create_company_for_current_user(text) to authenticated;
grant update on public.companies to authenticated;
