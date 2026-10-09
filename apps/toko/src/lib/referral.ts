/** Nama cookie dan aturan kode referral, dipakai proxy dan halaman. */
export const REF_COOKIE = "ref";
export const REF_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const REF_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;

export function isValidRefCode(value: string | null | undefined): value is string {
  return typeof value === "string" && REF_PATTERN.test(value);
}
