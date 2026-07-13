-- SBZ SellImage Pro - one-time owner bootstrap
-- First create and verify this owner account through /login, then run once.

update public.seller_profiles
set is_admin = true, updated_at = now()
where id = (
  select id from auth.users where lower(email) = lower('shahbaznetcafe@gmail.com')
);

-- Confirm the owner account. This query should return exactly one row.
select
  au.email,
  sp.business_name,
  sp.plan,
  sp.is_admin
from public.seller_profiles sp
join auth.users au on au.id = sp.id
where sp.is_admin = true;

-- Payment approvals and rejections are performed from /dashboard/admin/payments.
-- That page calls protected, atomic database functions; normal users cannot call
-- them successfully because seller_is_admin() is checked inside each function.
