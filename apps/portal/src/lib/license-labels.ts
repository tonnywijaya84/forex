import type { LicenseState, StoredStatus } from "@forex/license";

/** Teks dan warna status lisensi, sama di halaman pengguna dan halaman admin. */
export const stateLabel: Record<LicenseState, { text: string; className: string }> = {
  active: { text: "Aktif", className: "text-bull-deep" },
  pending: { text: "Menunggu aktivasi", className: "text-mark-deep" },
  suspended: { text: "Ditangguhkan", className: "text-bear-deep" },
  expired: { text: "Masa berlaku habis", className: "text-bear-deep" },
  unknown: { text: "Tidak terdaftar", className: "text-ink-soft" },
};

/** Pilihan status yang bisa disimpan admin, dalam urutan yang ditampilkan di formulir. */
export const statusOptions: { value: StoredStatus; label: string }[] = [
  { value: "pending", label: stateLabel.pending.text },
  { value: "active", label: stateLabel.active.text },
  { value: "suspended", label: stateLabel.suspended.text },
];

export const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" });
