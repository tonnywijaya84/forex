# Panduan proyek

Monorepo pnpm berisi tiga situs Next.js (lihat README.md untuk peta folder).

## Perintah

- `pnpm install` lalu `pnpm dev:edukasi`, `pnpm dev:toko`, atau `pnpm dev:portal` (port 3001, 3002, 3003).
- Sebelum commit: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Aturan kerja

- Next.js di repo ini versi 16 dengan Cache Components. Banyak yang berbeda dari versi lama: baca panduan di
  `apps/<nama>/node_modules/next/dist/docs/` sebelum menulis kode Next.js.
  - Membaca `cookies()`, `headers()`, `searchParams`, atau data per pengguna harus di dalam `<Suspense>`.
  - Middleware sekarang bernama Proxy (`src/proxy.ts`).
  - `dynamicParams` tidak tersedia; panggil `notFound()` untuk parameter yang tidak dikenal.
- Teks yang dilihat pengguna ditulis dalam bahasa Indonesia. Nama variabel, fungsi, tabel, dan kolom dalam bahasa Inggris.
- Warna dan huruf hanya didefinisikan di `packages/ui/src/tokens.css`. Jangan menulis kode warna langsung di komponen.
- Logika lisensi yang bisa diuji tanpa database masuk ke `packages/license`, lengkap dengan ujinya.
- Setiap perubahan skema database berupa file migrasi baru di `supabase/migrations`, dan aturan aksesnya
  diuji di `packages/db/test`. Jangan mengubah migrasi yang sudah dijalankan.
- Pengguna tidak boleh bisa mengaktifkan lisensinya sendiri. Jangan menambah policy `update` pada `mt5_accounts`
  untuk role `authenticated`.
- Rahasia hanya di `.env.local` (tidak ikut Git). `.env.example` hanya berisi nama variabel.
- Situs ini menyangkut produk keuangan berisiko: jangan menulis janji profit, dan pertahankan peringatan risiko di kaki halaman.
