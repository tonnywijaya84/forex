/**
 * Nama dan alamat ketiga situs. Ganti nama di sini bila merek sudah ditetapkan.
 * Alamat dibaca dari environment supaya domain produksi tidak tertanam di kode.
 */
export type SiteKey = "edukasi" | "toko" | "portal";

export const sites: Record<SiteKey, { name: string; tagline: string; url: string }> = {
  edukasi: {
    name: "Kelas Forex",
    tagline: "Materi belajar membaca struktur pasar",
    url: process.env.NEXT_PUBLIC_URL_EDUKASI ?? "http://localhost:3001",
  },
  toko: {
    name: "Toko EA",
    tagline: "Expert Advisor dan tautan referral",
    url: process.env.NEXT_PUBLIC_URL_TOKO ?? "http://localhost:3002",
  },
  portal: {
    name: "Portal EA",
    tagline: "Daftarkan akun MT5 untuk lisensi EA",
    url: process.env.NEXT_PUBLIC_URL_PORTAL ?? "http://localhost:3003",
  },
};
