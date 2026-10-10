-- Data diri member portal, wajib diisi sebelum mendaftarkan akun MT5.
-- Dijalankan di Supabase (SQL Editor atau `supabase db push`) setelah migrasi sebelumnya.

-- Satu baris per pengguna. Bentuk isinya juga diperiksa di portal (packages/license, parseProfile);
-- batasan di bawah menjaga data tetap rapi bila ada yang menulis langsung lewat API.
create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  -- Format internasional, misalnya +6281234567890.
  phone text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  city text not null check (char_length(city) between 2 and 80),
  -- Tanpa tanda @. Boleh kosong: tidak semua orang memakai Telegram.
  telegram text check (telegram ~ '^[A-Za-z][A-Za-z0-9_]{4,31}$'),
  birth_date date not null check (birth_date >= date '1900-01-01'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Supabase memberi hak bawaan pada tabel baru; sisakan hanya yang dipakai portal.
revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;

create policy "Pengguna melihat data dirinya"
  on public.profiles for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Pengguna mengisi data dirinya"
  on public.profiles for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Pengguna mengubah data dirinya"
  on public.profiles for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Tidak ada policy delete: data diri ikut terhapus bila akun penggunanya dihapus.

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Akun MT5 baru hanya bisa didaftarkan oleh pengguna yang sudah mengisi data diri.
-- Akun yang sudah terdaftar sebelumnya tidak terpengaruh.
alter policy "Pengguna mendaftarkan akun untuk dirinya"
  on public.mt5_accounts
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and expires_at is null
    and exists (select 1 from public.profiles p where p.user_id = (select auth.uid()))
  );

-- Daftar akun untuk admin kini menyertakan data diri pemilik, supaya admin bisa menghubungi
-- dan memeriksa syarat. Tanggal lahir tidak ikut: admin tidak memerlukannya untuk itu.
-- Bentuk hasil berubah, jadi fungsi lama dihapus lalu dibuat ulang.
drop function public.admin_list_accounts();

create function public.admin_list_accounts()
returns table (
  id uuid,
  owner_email text,
  owner_name text,
  owner_phone text,
  owner_city text,
  owner_telegram text,
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
  select a.id, u.email::text, p.full_name, p.phone, p.city, p.telegram,
    a.account_number, a.broker_server, e.code, e.name, a.status, a.expires_at, a.created_at
  from public.mt5_accounts a
  join public.eas e on e.id = a.ea_id
  join auth.users u on u.id = a.user_id
  left join public.profiles p on p.user_id = a.user_id
  where public.is_admin()
  order by (a.status = 'pending') desc, a.created_at desc
$$;

revoke all on function public.admin_list_accounts() from public, anon;
grant execute on function public.admin_list_accounts() to authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
