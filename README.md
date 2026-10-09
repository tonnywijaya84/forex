# forex

Tiga situs dalam satu repo, memakai Next.js, TypeScript, Tailwind, dan Supabase (Postgres).

| Folder | Situs | Isi saat ini |
| --- | --- | --- |
| `apps/edukasi` | Edukasi forex (domain 1) | Beranda, silabus 10 sesi, materi dari file Markdown |
| `apps/toko` | Penjualan dan referral (domain 2) | Daftar produk, halaman produk, pencatatan kode referral |
| `apps/portal` | Setup EA (subdomain domain 2) | Login email, pendaftaran akun MT5, API lisensi untuk EA |
| `packages/ui` | Tampilan bersama | Warna, huruf, kepala dan kaki halaman |
| `packages/license` | Logika lisensi | Penentuan status dan tanda tangan jawaban API |
| `packages/db` | Uji database | Menjalankan migrasi dan menguji aturan aksesnya |
| `supabase/` | Database | Migrasi SQL dan contoh isi katalog EA |

## Menjalankan di komputer sendiri

Butuh Node.js 22 atau lebih baru dan pnpm 10.

```bash
pnpm install
pnpm dev:edukasi   # http://localhost:3001
pnpm dev:toko      # http://localhost:3002
pnpm dev:portal    # http://localhost:3003
```

Situs edukasi dan toko langsung bisa dibuka. Portal menampilkan petunjuk sampai disambungkan ke Supabase.

## Menyambungkan portal ke Supabase

1. Buat proyek di [supabase.com](https://supabase.com).
2. Buka SQL Editor, jalankan isi `supabase/migrations/20261009000000_init.sql`, lalu `supabase/seed.sql`.
3. Di Authentication, bagian URL Configuration, isi Site URL dengan alamat portal dan tambahkan
   `<alamat portal>/auth/callback` ke Redirect URLs. Untuk lokal: `http://localhost:3003/auth/callback`.
4. Salin `apps/portal/.env.example` menjadi `apps/portal/.env.local` dan isi nilainya.
5. Jalankan ulang `pnpm dev:portal`.

## Mengaktifkan lisensi

Akun yang baru didaftarkan pengguna selalu berstatus `pending`. Pengguna tidak bisa mengubahnya sendiri.
Aktifkan dari SQL Editor:

```sql
update public.mt5_accounts
set status = 'active', expires_at = now() + interval '1 year'
where account_number = 276170008 and broker_server = 'Exness-MT5Real26';
```

Kosongkan `expires_at` (null) untuk lisensi tanpa batas waktu. Ubah `status` menjadi `suspended` untuk menangguhkan.

Cara EA memeriksa lisensi dijelaskan di [docs/api-lisensi.md](docs/api-lisensi.md).

## Mengubah isi

- Materi edukasi: tambah atau ubah file di `apps/edukasi/content/sesi`. Hapus baris `published: false` saat isinya siap.
- Produk: ubah `apps/toko/src/lib/products.ts`. Data yang ada sekarang hanya contoh.
- Nama situs: ubah `packages/ui/src/sites.ts`.
- Warna dan huruf: ubah `packages/ui/src/tokens.css`.

## Memasang di Vercel

Buat tiga proyek Vercel dari repo ini. Di tiap proyek, isi Root Directory dengan `apps/edukasi`, `apps/toko`,
atau `apps/portal`, lalu pasang domainnya. Isi environment variable sesuai `.env.example` di folder masing-masing,
termasuk `NEXT_PUBLIC_URL_*` dengan alamat domain yang sebenarnya.

Situs yang `NEXT_PUBLIC_URL_*`-nya belum diisi dianggap belum terbit: di produksi, tautan ke situs itu
tidak ditampilkan. Isi variabelnya di ketiga proyek setelah situs tersebut dipasang, lalu pasang ulang.

## Memeriksa sebelum mengirim perubahan

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Yang belum ada

- Pembayaran. Halaman produk belum punya checkout.
- Kode di sisi EA (MQL5) untuk memanggil API lisensi.
- Halaman admin. Aktivasi lisensi masih lewat SQL Editor.
- Pembatasan jumlah permintaan (rate limit) pada API lisensi.
- Bukti kepemilikan akun MT5. Saat ini siapa pun yang login bisa mendaftarkan nomor akun mana pun,
  sehingga aktivasi oleh admin menjadi satu-satunya pemeriksaan.
- Materi sesi 2 sampai 10.
