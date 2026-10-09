/**
 * Membaca konfigurasi Supabase. Mengembalikan null bila belum diisi,
 * supaya portal tetap bisa dibuka dan menampilkan petunjuk alih-alih error.
 */
export function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}
