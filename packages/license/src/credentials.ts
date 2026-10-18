/**
 * Validasi email dan kata sandi untuk login portal. Tidak bergantung pada database atau framework,
 * supaya bisa diuji sendiri. Supabase tetap memeriksa ulang di sisinya.
 */

/** Panjang minimum kata sandi baru. */
export const PASSWORD_MIN_LENGTH = 8;

/** Supabase menyimpan kata sandi dengan bcrypt, yang hanya membaca 72 byte pertama. */
export const PASSWORD_MAX_BYTES = 72;

/** Merapikan alamat email (spasi di tepi, huruf kecil). Mengembalikan null bila bentuknya tidak wajar. */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/** Memeriksa kata sandi baru beserta ketikan ulangnya. Pesan kesalahannya bisa ditampilkan apa adanya. */
export function checkNewPassword(password: unknown, confirmation: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof password !== "string" || password.length === 0) {
    return { ok: false, error: "Isi kata sandi baru." };
  }
  if ([...password].length < PASSWORD_MIN_LENGTH) {
    return { ok: false, error: `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter.` };
  }
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return { ok: false, error: "Kata sandi terlalu panjang. Pakai paling banyak 72 karakter." };
  }
  if (password.trim().length === 0) {
    return { ok: false, error: "Kata sandi tidak boleh hanya berisi spasi." };
  }
  if (password !== confirmation) {
    return { ok: false, error: "Kedua kata sandi tidak sama. Ketik ulang dengan teliti." };
  }
  return { ok: true, value: password };
}
