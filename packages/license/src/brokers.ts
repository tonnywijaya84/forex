/**
 * Broker yang akunnya bisa didaftarkan di portal. Member memilih broker dari daftar, bukan mengetik nama server.
 * Nama broker disimpan di kolom `broker_server` tabel `mt5_accounts`.
 *
 * EA tetap mengirim nama server MT5 lengkap, misalnya "VTMarkets-Live 3". API lisensi mencocokkannya ke broker
 * lewat awalan nama server, sehingga satu pendaftaran berlaku di semua server broker itu.
 */
export type Broker = {
  /** Nama yang tampil di formulir dan disimpan di database. */
  name: string;
  /** Awalan nama server MT5 broker ini, dicocokkan tanpa membedakan huruf besar dan kecil. */
  serverPrefix: string;
};

export const BROKERS: readonly Broker[] = [{ name: "VT Markets", serverPrefix: "VTMarkets" }];

/** Broker dengan nama persis seperti di daftar, atau null. */
export function findBroker(name: unknown): Broker | null {
  return BROKERS.find((broker) => broker.name === name) ?? null;
}

/**
 * Broker pemilik sebuah nama server MT5, atau null. Awalannya harus diikuti akhir teks atau tanda baca,
 * supaya "VTMarkets-Live" cocok tetapi "VTMarketsX" tidak.
 */
export function brokerForServer(server: string): Broker | null {
  const lower = server.toLowerCase();
  return (
    BROKERS.find((broker) => {
      const prefix = broker.serverPrefix.toLowerCase();
      if (!lower.startsWith(prefix)) return false;
      const next = lower.charAt(prefix.length);
      return next === "" || !/[a-z0-9]/.test(next);
    }) ?? null
  );
}

/**
 * Nilai `broker_server` yang dicari untuk satu nama server dari EA, berurutan. Nama broker didahulukan;
 * nama server persis tetap dicari untuk akun yang didaftarkan sebelum ada pilihan broker.
 */
export function serverCandidates(server: string): string[] {
  const broker = brokerForServer(server);
  return broker && broker.name !== server ? [broker.name, server] : [server];
}
