-- Skema awal portal lisensi EA.
-- Dijalankan di Supabase (SQL Editor atau `supabase db push`).

-- Katalog EA yang bisa dilisensikan.
create table public.eas (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9][a-z0-9-]{1,39}$'),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Akun MT5 yang didaftarkan pengguna untuk satu EA.
-- Satu baris = satu lisensi. Status dan masa berlaku hanya diubah oleh admin.
create table public.mt5_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ea_id uuid not null references public.eas (id),
  account_number bigint not null check (account_number > 0),
  broker_server text not null check (broker_server ~ '^[A-Za-z0-9][A-Za-z0-9 ._-]{1,63}$'),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (ea_id, account_number, broker_server)
);

create index mt5_accounts_user_id_idx on public.mt5_accounts (user_id);

-- Hak akses dasar. Row Level Security di bawah yang menentukan baris mana yang terlihat.
grant select on public.eas to anon, authenticated;
grant select, insert, delete on public.mt5_accounts to authenticated;

alter table public.eas enable row level security;
alter table public.mt5_accounts enable row level security;

create policy "EA aktif bisa dilihat semua orang"
  on public.eas for select
  to anon, authenticated
  using (is_active);

create policy "Pengguna melihat akun miliknya"
  on public.mt5_accounts for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Pendaftaran baru selalu berstatus pending dan tanpa masa berlaku,
-- supaya pengguna tidak bisa mengaktifkan lisensinya sendiri.
create policy "Pengguna mendaftarkan akun untuk dirinya"
  on public.mt5_accounts for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and expires_at is null
  );

create policy "Pengguna menghapus akun miliknya"
  on public.mt5_accounts for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Tidak ada policy update: aktivasi dilakukan admin lewat SQL Editor atau service role.

-- Dipanggil API lisensi. Hanya mengembalikan status dan masa berlaku,
-- tidak pernah mengembalikan siapa pemilik akun.
create function public.verify_license(p_account bigint, p_server text, p_ea text)
returns table (status text, expires_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select a.status, a.expires_at
  from public.mt5_accounts a
  join public.eas e on e.id = a.ea_id
  where a.account_number = p_account
    and a.broker_server = p_server
    and e.code = p_ea
    and e.is_active
$$;

revoke all on function public.verify_license(bigint, text, text) from public;
grant execute on function public.verify_license(bigint, text, text) to anon, authenticated;
