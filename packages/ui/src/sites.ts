/**
 * Nama dan alamat ketiga situs. Ganti nama di sini bila merek sudah ditetapkan.
 * Alamat dibaca dari environment supaya domain produksi tidak tertanam di kode.
 */
export type SiteKey = "edukasi" | "toko" | "portal";

/**
 * Alamat sebuah situs. Di produksi, situs yang alamatnya belum diisi dianggap belum terbit (null)
 * sehingga tautan ke sana tidak ditampilkan. Di komputer lokal dipakai alamat localhost.
 */
function siteUrl(configured: string | undefined, localUrl: string): string | null {
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : localUrl;
}

export const sites: Record<SiteKey, { name: string; tagline: string; url: string | null }> = {
  edukasi: {
    name: "FxSpot",
    tagline: "Materi belajar membaca struktur pasar",
    url: siteUrl(process.env.NEXT_PUBLIC_URL_EDUKASI, "http://localhost:3001"),
  },
  toko: {
    name: "Dewa Pips",
    tagline: "Expert Advisor dan tautan referral",
    url: siteUrl(process.env.NEXT_PUBLIC_URL_TOKO, "http://localhost:3002"),
  },
  portal: {
    name: "Portal Dewa Pips",
    tagline: "Daftarkan akun MT5 untuk lisensi EA",
    url: siteUrl(process.env.NEXT_PUBLIC_URL_PORTAL, "http://localhost:3003"),
  },
};
