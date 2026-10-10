/**
 * Validasi data diri member portal. Tidak bergantung pada database atau framework,
 * supaya bisa diuji sendiri. Batasannya sama dengan tabel `profiles` (lihat migrasi).
 */

export type Profile = {
  fullName: string;
  /** Format internasional, misalnya +6281234567890. */
  phone: string;
  city: string;
  /** Username Telegram tanpa tanda @, atau null bila tidak diisi. */
  telegram: string | null;
  /** TTTT-BB-HH. */
  birthDate: string;
};

export type ProfileInput = Record<"fullName" | "phone" | "city" | "telegram" | "birthDate", unknown>;

/** Usia termuda yang boleh mendaftar. Produk di situs ini menyangkut trading berisiko tinggi. */
export const MINIMUM_AGE = 18;

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

/**
 * Merapikan nomor telepon ke format internasional. Nomor Indonesia boleh ditulis 0812..., 62812..., atau +62812...;
 * nomor negara lain harus diawali tanda +. Mengembalikan null bila hasilnya bukan nomor yang wajar.
 */
export function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const compact = value.replace(/[\s().-]/g, "");
  let digits: string;
  if (compact.startsWith("+")) digits = compact.slice(1);
  else if (compact.startsWith("0")) digits = `62${compact.slice(1)}`;
  else if (compact.startsWith("62")) digits = compact;
  else return null;
  return /^[1-9][0-9]{7,14}$/.test(digits) ? `+${digits}` : null;
}

/** Usia dalam tahun penuh pada tanggal `today` (keduanya TTTT-BB-HH). */
function ageOn(birthDate: string, today: string): number {
  const [birthYear, birthRest] = [Number(birthDate.slice(0, 4)), birthDate.slice(5)];
  const [year, rest] = [Number(today.slice(0, 4)), today.slice(5)];
  return year - birthYear - (rest < birthRest ? 1 : 0);
}

/**
 * Memeriksa isian formulir data diri. `now` dipakai untuk menghitung usia menurut tanggal di WIB.
 * Pesan kesalahan bisa ditampilkan apa adanya.
 */
export function parseProfile(input: ProfileInput, now: Date): { ok: true; value: Profile } | { ok: false; error: string } {
  const fullName = text(input.fullName);
  if (fullName.length < 2 || fullName.length > 100) {
    return { ok: false, error: "Tulis nama lengkap Anda, 2 sampai 100 huruf." };
  }

  const phone = normalizePhone(input.phone);
  if (!phone) {
    return { ok: false, error: "Tulis nomor telepon yang aktif, misalnya 0812 3456 7890. Nomor luar Indonesia diawali tanda +." };
  }

  const city = text(input.city);
  if (city.length < 2 || city.length > 80) {
    return { ok: false, error: "Tulis kota domisili Anda, misalnya Jakarta." };
  }

  const telegramText = text(input.telegram).replace(/^@/, "");
  if (telegramText !== "" && !/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(telegramText)) {
    return { ok: false, error: "Username Telegram berisi 5 sampai 32 huruf, angka, atau garis bawah, misalnya @nama_anda. Kosongkan bila tidak punya." };
  }

  const birthDate = text(input.birthDate);
  const birth = /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? new Date(`${birthDate}T00:00:00Z`) : null;
  // Tanggal seperti 1990-02-30 digeser JavaScript ke bulan berikutnya; tolak dengan mencocokkan ulang.
  if (!birth || Number.isNaN(birth.getTime()) || birth.toISOString().slice(0, 10) !== birthDate) {
    return { ok: false, error: "Tanggal lahir tidak dikenali. Pilih tanggal dari kalender." };
  }
  const today = new Date(now.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
  const age = ageOn(birthDate, today);
  if (birthDate > today || age > 120) {
    return { ok: false, error: "Periksa lagi tanggal lahir Anda." };
  }
  if (age < MINIMUM_AGE) {
    return { ok: false, error: `Portal ini hanya untuk pengguna berusia ${MINIMUM_AGE} tahun ke atas.` };
  }

  return { ok: true, value: { fullName, phone, city, telegram: telegramText === "" ? null : telegramText, birthDate } };
}
