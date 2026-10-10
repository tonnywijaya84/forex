-- Halaman admin portal: siapa yang boleh mengaktifkan lisensi, dan fungsi yang mereka pakai.
-- Dijalankan di Supabase (SQL Editor atau `supabase db push`) setelah migrasi awal.

-- Daftar admin. Hanya diisi dari SQL Editor:
--   insert into public.admins (user_id) select id from auth.users where email = '<email admin>';
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Supabase memberi hak bawaan pada tabel baru di schema public. Cabut semuanya:
-- tanpa hak dan tanpa policy, pengguna tidak bisa membaca daftar admin atau menambahkan dirinya.
revoke all on public.admins from anon, authenticated;

-- Hal yang sama untuk tabel lama, supaya perlindungannya tidak hanya bergantung pada Row Level Security.
revoke all on public.mt5_accounts from anon;
revoke update, truncate, references, trigger on public.mt5_accounts from authenticated;
revoke insert, update, delete, truncate, references, trigger on public.eas from anon, authenticated;

-- Apakah pengguna yang sedang login terdaftar sebagai admin.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()))
$$;

-- Semua akun MT5 beserta email pemiliknya. Bukan admin mendapat daftar kosong.
-- Yang menunggu aktivasi muncul lebih dulu.
create function public.admin_list_accounts()
returns table (
  id uuid,
  owner_email text,
  account_number bigint,
  broker_server text,
  ea_code text,
  ea_name text,
  status text,
  expires_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, u.email::text, a.account_number, a.broker_server, e.code, e.name, a.status, a.expires_at, a.created_at
  from public.mt5_accounts a
  join public.eas e on e.id = a.ea_id
  join auth.users u on u.id = a.user_id
  where public.is_admin()
  order by (a.status = 'pending') desc, a.created_at desc
$$;

-- Mengubah status dan masa berlaku satu lisensi. Mengembalikan false bila akunnya tidak ada.
-- Ini bukan policy update: pengguna biasa tetap tidak bisa mengubah baris mt5_accounts.
create function public.admin_set_license(p_account_id uuid, p_status text, p_expires_at timestamptz)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh mengubah lisensi' using errcode = '42501';
  end if;

  update public.mt5_accounts
  set status = p_status, expires_at = p_expires_at
  where id = p_account_id;

  return found;
end
$$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.admin_list_accounts() from public, anon;
revoke all on function public.admin_set_license(uuid, text, timestamptz) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_list_accounts() to authenticated;
grant execute on function public.admin_set_license(uuid, text, timestamptz) to authenticated;
