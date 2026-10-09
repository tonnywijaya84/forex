import { sites } from "@forex/ui";

/**
 * Penyebutan toko EA yang tenang di akhir tulisan: satu kalimat dengan tautan teks, tanpa tombol.
 * Tidak tampil bila alamat toko belum diatur.
 */
export function StoreMention({ lead }: { lead?: string }) {
  if (!sites.toko.url) return null;
  return (
    <aside aria-label={sites.toko.name} className="mt-12 max-w-[68ch] text-ink-soft">
      <p>
        {lead ? `${lead} ` : null}
        Kalau ingin melihat bagaimana aturan trading dijalankan secara otomatis, ada contoh Expert Advisor gratis
        di{" "}
        <a href={sites.toko.url} className="text-ink underline hover:text-bull-deep">
          {sites.toko.name}
        </a>{" "}
        yang bisa dicoba, sebaiknya di akun demo lebih dulu. EA hanya alat bantu, dan risiko rugi tetap ada.
      </p>
    </aside>
  );
}
