/**
 * Program EA gratis lewat referral broker.
 *
 * Broker mitra bisa lebih dari satu. Yang tampil di situs hanya broker yang `referralUrl`-nya sudah diisi,
 * jadi broker bisa disiapkan di sini lebih dulu tanpa ikut terbit.
 * Isi `referralUrl` hanya untuk broker yang memang boleh dipromosikan kepada pembaca situs ini.
 */
export type PartnerBroker = {
  code: string;
  name: string;
  /** Tautan referral kita di broker ini. null = belum ada, broker belum ditampilkan. */
  referralUrl: string | null;
};

export const partnerBrokers: PartnerBroker[] = [{ code: "vt-markets", name: "VT Markets", referralUrl: null }];

type ListedBroker = PartnerBroker & { referralUrl: string };

/** Broker yang sudah punya tautan referral dan karena itu ditampilkan. */
export function getListedBrokers(): ListedBroker[] {
  return partnerBrokers.filter((broker): broker is ListedBroker => broker.referralUrl !== null);
}

/**
 * Syarat EA gratis, sudah ditetapkan pemilik situs. Bila `isFinal` diubah menjadi false, situs menampilkan
 * tanda "masih contoh" di atas daftar ini.
 */
export const freeAccessTerms: { isFinal: boolean; items: string[] } = {
  isFinal: true,
  items: [
    "Akun trading dibuka lewat tautan referral broker mitra di halaman ini.",
    "Akun sudah terverifikasi dan sudah menerima deposit pertama.",
  ],
};
