import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Logika lisensi EA yang tidak bergantung pada database atau framework,
 * supaya bisa diuji sendiri dan dipakai ulang oleh API mana pun.
 */

/** Status yang disimpan di database untuk satu akun MT5. */
export type StoredStatus = "pending" | "active" | "suspended";

/** Status yang dikirim ke EA. `expired` dan `unknown` dihitung, tidak disimpan. */
export type LicenseState = StoredStatus | "expired" | "unknown";

export type LicenseRecord = {
  status: StoredStatus;
  /** ISO 8601, atau null bila lisensi tidak punya batas waktu. */
  expiresAt: string | null;
};

export type VerifyRequest = {
  account: number;
  server: string;
  ea: string;
};

export type VerifyResponse = {
  account: number;
  server: string;
  ea: string;
  state: LicenseState;
  expires_at: string | null;
  checked_at: string;
  signature: string;
};

/** Menentukan status lisensi pada saat `now`. Record null berarti akun tidak terdaftar. */
export function evaluateLicense(record: LicenseRecord | null, now: Date): { state: LicenseState; expiresAt: string | null } {
  if (!record) return { state: "unknown", expiresAt: null };
  if (record.status !== "active") return { state: record.status, expiresAt: record.expiresAt };
  if (record.expiresAt !== null) {
    const expires = Date.parse(record.expiresAt);
    if (Number.isNaN(expires) || expires <= now.getTime()) {
      return { state: "expired", expiresAt: record.expiresAt };
    }
  }
  return { state: "active", expiresAt: record.expiresAt };
}

/** Aturan yang sama dipakai di database (lihat migrasi) dan di formulir portal. */
export const SERVER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 ._-]{1,63}$/;
export const EA_PATTERN = /^[a-z0-9][a-z0-9-]{1,39}$/;

/** Memeriksa body permintaan dari EA. Mengembalikan pesan kesalahan yang bisa ditampilkan apa adanya. */
export function parseVerifyRequest(body: unknown): { ok: true; value: VerifyRequest } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body harus berupa objek JSON." };
  }
  const { account, server, ea } = body as Record<string, unknown>;
  const accountNumber = typeof account === "string" && /^\d{1,15}$/.test(account) ? Number(account) : account;
  if (typeof accountNumber !== "number" || !Number.isSafeInteger(accountNumber) || accountNumber <= 0) {
    return { ok: false, error: "Field account harus berupa nomor akun MT5 (bilangan bulat positif)." };
  }
  if (typeof server !== "string" || !SERVER_PATTERN.test(server.trim())) {
    return { ok: false, error: "Field server harus berupa nama server broker, misalnya Exness-MT5Real26." };
  }
  if (typeof ea !== "string" || !EA_PATTERN.test(ea)) {
    return { ok: false, error: "Field ea harus berupa kode EA, misalnya averaging-v1." };
  }
  return { ok: true, value: { account: accountNumber, server: server.trim(), ea } };
}

/** Teks yang ditandatangani. Urutan field tetap; EA harus menyusun teks yang sama untuk memeriksa tanda tangan. */
export function canonicalString(fields: Omit<VerifyResponse, "signature">): string {
  return [fields.account, fields.server, fields.ea, fields.state, fields.expires_at ?? "", fields.checked_at].join("|");
}

/** HMAC-SHA256 dalam heksadesimal huruf kecil. */
export function sign(text: string, secret: string): string {
  return createHmac("sha256", secret).update(text, "utf8").digest("hex");
}

export function verifySignature(text: string, signature: string, secret: string): boolean {
  const expected = Buffer.from(sign(text, secret), "hex");
  const given = Buffer.from(signature, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Menyusun jawaban lengkap untuk EA, termasuk tanda tangan. */
export function buildVerifyResponse(request: VerifyRequest, record: LicenseRecord | null, now: Date, secret: string): VerifyResponse {
  const { state, expiresAt } = evaluateLicense(record, now);
  const fields = {
    account: request.account,
    server: request.server,
    ea: request.ea,
    state,
    expires_at: expiresAt,
    checked_at: now.toISOString(),
  };
  return { ...fields, signature: sign(canonicalString(fields), secret) };
}

/** Perubahan lisensi yang dikirim admin dari portal. */
export type LicenseUpdate = {
  status: StoredStatus;
  /** ISO 8601, atau null bila lisensi tidak punya batas waktu. */
  expiresAt: string | null;
};

export const STORED_STATUSES: readonly StoredStatus[] = ["pending", "active", "suspended"];

/** Admin bekerja dengan tanggal di Indonesia bagian barat (WIB), yang tidak mengenal perubahan jam musiman. */
const WIB_OFFSET = "+07:00";
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Memeriksa isian formulir admin. `expiresOn` berupa tanggal TTTT-BB-HH; lisensi berlaku
 * sampai akhir hari itu menurut WIB. Tanggal kosong berarti tanpa batas waktu.
 */
export function parseLicenseUpdate(input: { status: unknown; expiresOn: unknown }): { ok: true; value: LicenseUpdate } | { ok: false; error: string } {
  const status = STORED_STATUSES.find((candidate) => candidate === input.status);
  if (!status) {
    return { ok: false, error: "Pilih status: menunggu, aktif, atau ditangguhkan." };
  }
  const expiresOn = typeof input.expiresOn === "string" ? input.expiresOn.trim() : "";
  if (expiresOn === "") return { ok: true, value: { status, expiresAt: null } };

  const expires = /^\d{4}-\d{2}-\d{2}$/.test(expiresOn) ? new Date(`${expiresOn}T23:59:59.999${WIB_OFFSET}`) : null;
  // Tanggal seperti 2027-02-30 digeser JavaScript ke bulan berikutnya; tolak dengan mencocokkan ulang.
  if (!expires || Number.isNaN(expires.getTime()) || expiryInputValue(expires.toISOString()) !== expiresOn) {
    return { ok: false, error: "Tanggal berlaku tidak dikenali. Pilih tanggal dari kalender, atau kosongkan." };
  }
  return { ok: true, value: { status, expiresAt: expires.toISOString() } };
}

/** Tanggal TTTT-BB-HH (WIB) dari `expires_at`, untuk mengisi ulang formulir admin. Kosong bila tanpa batas. */
export function expiryInputValue(expiresAt: string | null): string {
  if (expiresAt === null) return "";
  const time = Date.parse(expiresAt);
  if (Number.isNaN(time)) return "";
  return new Date(time + WIB_OFFSET_MS).toISOString().slice(0, 10);
}
