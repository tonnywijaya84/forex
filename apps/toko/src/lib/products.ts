/**
 * Katalog produk. Data di bawah adalah CONTOH untuk mengisi kerangka;
 * ganti dengan produk, deskripsi, dan harga yang sebenarnya.
 * `eaCode` harus sama dengan kolom `code` di tabel `eas` supaya lisensinya terhubung.
 */
/** Cara mendapatkan lisensi: dibeli, atau gratis dengan syarat program referral broker. */
export type Access = "paid" | "free_with_referral";

export type Product = {
  slug: string;
  name: string;
  eaCode: string;
  summary: string;
  features: string[];
  access: Access;
  /** Harga dalam rupiah untuk produk berbayar. null = belum ditetapkan. */
  priceIdr: number | null;
};

export const products: Product[] = [
  {
    slug: "ea-averaging",
    name: "EA Averaging",
    eaCode: "averaging-v1",
    summary: "Menambah posisi bertahap saat harga bergerak melawan, dengan jarak dan lot tiap level yang diatur sendiri.",
    features: ["Jarak antar level dan lot tiap level diatur terpisah", "Take profit dihitung dari harga rata-rata posisi", "Entry pertama bisa dibuka manual"],
    access: "paid",
    priceIdr: null,
  },
  {
    slug: "ea-trend-following",
    name: "EA Trend Following",
    eaCode: "trend-following-v1",
    summary: "Masuk searah tren dengan stop-loss tetap dan trailing stop.",
    features: ["Stop-loss dan trailing stop dalam pip", "Satu posisi per sinyal", "Parameter indikator bisa diubah"],
    access: "free_with_referral",
    priceIdr: null,
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

/**
 * Label harga untuk ditampilkan, atau null bila tidak ada yang perlu ditulis:
 * produk gratis lewat referral dan produk yang harganya belum ditetapkan tidak diberi label.
 */
export function priceLabel(product: Pick<Product, "access" | "priceIdr">): string | null {
  if (product.access !== "paid" || product.priceIdr === null) return null;
  return rupiah.format(product.priceIdr);
}
