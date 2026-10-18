import { Notice } from "@forex/ui";

/** Ditampilkan bila kunci Supabase belum diisi di .env.local. */
export function NotConnected() {
  return (
    <div className="max-w-xl">
      <Notice title="Portal belum tersambung ke database">
        Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY di file .env.local, lalu jalankan ulang
        aplikasi. Langkah lengkapnya ada di README.
      </Notice>
    </div>
  );
}
