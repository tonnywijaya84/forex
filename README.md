# forex

Tiga situs dalam satu repo, memakai Next.js, TypeScript, Tailwind, dan Supabase (Postgres).

| Folder | Situs | Isi saat ini |
| --- | --- | --- |
| `apps/edukasi` | Edukasi forex (domain 1) | Beranda, silabus 10 sesi, materi dan berita dari file Markdown |
| `apps/toko` | Penjualan dan referral (domain 2) | Daftar produk, halaman produk, pencatatan kode referral |
| `apps/portal` | Setup EA (subdomain domain 2) | Login email, data diri member, pendaftaran akun MT5, halaman admin lisensi, API lisensi untuk EA |
| `packages/ui` | Tampilan bersama | Warna, huruf, kepala dan kaki halaman |
| `packages/license` | Logika lisensi | Penentuan status, tanda tangan jawaban API, validasi formulir admin dan data diri member |
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
2. Buka SQL Editor, jalankan isi setiap file di `supabase/migrations` menurut urutan namanya, lalu `supabase/seed.sql`.
3. Di Authentication, bagian URL Configuration, isi Site URL dengan alamat portal dan tambahkan
   `<alamat portal>/auth/callback` ke Redirect URLs. Untuk lokal: `http://localhost:3003/auth/callback`.
4. Salin `apps/portal/.env.example` menjadi `apps/portal/.env.local` dan isi nilainya.
5. Jalankan ulang `pnpm dev:portal`.

Untuk dipakai orang luar, dua hal lagi perlu diatur di Supabase:

- **Layanan email sendiri.** Email bawaan Supabase hanya untuk uji coba (beberapa email per jam, hanya ke anggota
  tim proyek). Di Authentication, Emails, SMTP Settings, sambungkan layanan email seperti Resend dengan domain
  pengirim yang sudah diverifikasi.
- **Isi email.** Di Authentication, Emails, Templates, ganti isi "Confirm sign up" dan "Magic link" dengan
  `supabase/templates/confirm-signup.html` dan `supabase/templates/magic-link.html`. Tautan di dalamnya menuju
  `/auth/confirm` di portal, sehingga alamat tautan sama dengan domain pengirim dan login bisa diselesaikan di
  perangkat mana pun.

## Data diri member

Sebelum bisa mendaftarkan akun MT5, member mengisi halaman `/profil`: nama lengkap, nomor telepon atau WhatsApp,
kota domisili, tanggal lahir (minimal 18 tahun), dan username Telegram (boleh kosong). Kewajiban ini juga dijaga
database, bukan hanya tampilan. Member hanya bisa melihat dan mengubah data dirinya sendiri; admin melihat nama,
telepon, kota, dan Telegram di halaman `/admin`, tanpa tanggal lahir.

Nomor KTP sengaja tidak dikumpulkan. Bila suatu saat diperlukan, tambahkan lewat migrasi baru dan pertimbangkan
dulu kewajiban perlindungan data pribadi yang menyertainya.

## Mengaktifkan lisensi

Akun yang baru didaftarkan pengguna selalu berstatus `pending`. Pengguna tidak bisa mengubahnya sendiri.

Admin mengaktifkannya di halaman `/admin` portal: pilih status, isi tanggal "Berlaku sampai", lalu Simpan.
Lisensi berlaku sampai akhir tanggal itu (WIB). Kosongkan tanggal untuk lisensi tanpa batas waktu.
Halaman ini hanya terbuka untuk pengguna yang terdaftar di tabel `admins`; pengguna lain melihat halaman tidak ditemukan.

Menambah admin dilakukan dari SQL Editor, setelah orangnya pernah login ke portal:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'email-admin@contoh.com';
```

Mencabut hak admin: hapus barisnya dari tabel `admins`. Daftar admin sengaja tidak disimpan di kode
karena repo ini terbuka.

Cara EA memeriksa lisensi dijelaskan di [docs/api-lisensi.md](docs/api-lisensi.md).

## Mengubah isi

- Materi edukasi: tambah atau ubah file di `apps/edukasi/content/sesi`. Hapus baris `published: false` saat isinya siap.
  Gambar di dalam materi dipanggil dengan baris `<!-- gambar: nama -->`; gambarnya didefinisikan di
  `apps/edukasi/src/lib/figures.ts`.
  Ikon sesi dipilih lewat baris `icon:` di bagian atas file materi; ikonnya digambar di
  `apps/edukasi/src/components/session-icon.tsx`.
- Berita: tambah satu file per artikel di `apps/edukasi/content/berita`, dengan nama `TTTT-BB-HH-judul-singkat.md`
  (nama file menjadi alamat artikel). Bagian atas file berisi `title`, `date` (TTTT-BB-HH), `summary`, dan
  `category` bila perlu. Tambahkan `published: false` selama masih draf. Contoh: `2026-10-09-fxspot-dibuka.md`.
- Kalimat penyebutan toko EA di akhir materi dan berita: `apps/edukasi/src/components/store-mention.tsx`.
  Sesi awal yang menampilkannya diatur lewat `STORE_CTA_FROM_SESSION` di `apps/edukasi/src/lib/lessons.ts`.
- Produk: ubah `apps/toko/src/lib/products.ts`. Data yang ada sekarang hanya contoh.
  `access: "free_with_referral"` menjadikan produk gratis dengan syarat program referral broker.
- Program referral broker: `apps/toko/src/lib/referral-program.ts`. Broker mitra bisa lebih dari satu dan hanya
  tampil setelah `referralUrl`-nya diisi. Syarat EA gratis ada di `freeAccessTerms` pada file itu; bila `isFinal`
  diubah menjadi `false`, situs menampilkan tanda "Syarat masih contoh" di atas daftar syarat.
- Nama situs: ubah `packages/ui/src/sites.ts`.
- Warna dan huruf: ubah `packages/ui/src/tokens.css`.
  Dewa Pips dan Portal Dewa Pips memakai tema hitam putih berlatar hitam (`data-theme="mono"` di `src/app/layout.tsx`
  masing-masing); warnanya ada di blok `:root[data-theme="mono"]` pada file yang sama.
- Logo Dewa Pips: `src/assets/dewa-pips-logo.png`. Favicon: `src/app/icon.png` dan `apple-icon.png`.
  Ketiga file itu ada di `apps/toko` dan `apps/portal`; bila logo berganti, ganti di kedua folder.

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
- Catatan siapa mengaktifkan lisensi dan kapan (riwayat perubahan oleh admin).
- Halaman kebijakan privasi yang menjelaskan data diri apa yang disimpan portal dan untuk apa.
- Pembatasan jumlah permintaan (rate limit) pada API lisensi.
- Bukti kepemilikan akun MT5. Saat ini siapa pun yang login bisa mendaftarkan nomor akun mana pun,
  sehingga aktivasi oleh admin menjadi satu-satunya pemeriksaan.
- Tautan referral broker. Pemeriksaan syarat EA gratis masih manual sebelum lisensi diaktifkan.
