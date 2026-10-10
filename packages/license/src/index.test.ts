import { describe, expect, it } from "vitest";
import {
  buildVerifyResponse,
  canonicalString,
  evaluateLicense,
  expiryInputValue,
  parseLicenseUpdate,
  parseVerifyRequest,
  sign,
  verifySignature,
} from "./index";

const now = new Date("2026-10-09T10:00:00.000Z");

describe("evaluateLicense", () => {
  it("menganggap akun yang tidak terdaftar sebagai unknown", () => {
    expect(evaluateLicense(null, now)).toEqual({ state: "unknown", expiresAt: null });
  });

  it("meneruskan status pending dan suspended apa adanya", () => {
    expect(evaluateLicense({ status: "pending", expiresAt: null }, now).state).toBe("pending");
    expect(evaluateLicense({ status: "suspended", expiresAt: "2027-01-01T00:00:00Z" }, now).state).toBe("suspended");
  });

  it("aktif tanpa batas waktu tetap aktif", () => {
    expect(evaluateLicense({ status: "active", expiresAt: null }, now).state).toBe("active");
  });

  it("aktif sampai tepat sebelum batas waktu, lalu expired", () => {
    expect(evaluateLicense({ status: "active", expiresAt: "2026-10-09T10:00:00.001Z" }, now).state).toBe("active");
    expect(evaluateLicense({ status: "active", expiresAt: "2026-10-09T10:00:00.000Z" }, now).state).toBe("expired");
    expect(evaluateLicense({ status: "active", expiresAt: "2026-01-01T00:00:00Z" }, now).state).toBe("expired");
  });

  it("tanggal yang tidak terbaca diperlakukan sebagai expired, bukan aktif", () => {
    expect(evaluateLicense({ status: "active", expiresAt: "bukan-tanggal" }, now).state).toBe("expired");
  });
});

describe("parseVerifyRequest", () => {
  it("menerima permintaan yang benar dan merapikan spasi", () => {
    expect(parseVerifyRequest({ account: 276170008, server: " Exness-MT5Real26 ", ea: "averaging-v1" })).toEqual({
      ok: true,
      value: { account: 276170008, server: "Exness-MT5Real26", ea: "averaging-v1" },
    });
  });

  it("menerima nomor akun dalam bentuk teks angka", () => {
    const result = parseVerifyRequest({ account: "276170008", server: "Exness-MT5Real26", ea: "averaging-v1" });
    expect(result.ok && result.value.account).toBe(276170008);
  });

  it.each([
    ["bukan objek", "teks"],
    ["null", null],
    ["akun negatif", { account: -1, server: "Demo-Server", ea: "averaging-v1" }],
    ["akun pecahan", { account: 1.5, server: "Demo-Server", ea: "averaging-v1" }],
    ["akun terlalu besar", { account: 2 ** 60, server: "Demo-Server", ea: "averaging-v1" }],
    ["server kosong", { account: 1, server: "", ea: "averaging-v1" }],
    ["server berisi karakter aneh", { account: 1, server: "Demo|Server", ea: "averaging-v1" }],
    ["ea huruf besar", { account: 1, server: "Demo-Server", ea: "Averaging" }],
    ["ea hilang", { account: 1, server: "Demo-Server" }],
  ])("menolak %s", (_label, body) => {
    expect(parseVerifyRequest(body).ok).toBe(false);
  });
});

describe("tanda tangan", () => {
  const secret = "rahasia-uji";

  it("cocok dengan vektor uji HMAC-SHA256 yang dikenal", () => {
    // RFC 4231, test case 2
    expect(sign("what do ya want for nothing?", "Jefe")).toBe("5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843");
  });

  it("menyusun teks kanonik dengan urutan tetap dan expires kosong bila null", () => {
    expect(
      canonicalString({ account: 1, server: "S", ea: "e-1", state: "active", expires_at: null, checked_at: "T" }),
    ).toBe("1|S|e-1|active||T");
  });

  it("jawaban yang dibangun lolos verifikasi, dan gagal bila satu field diubah", () => {
    const request = { account: 276170008, server: "Exness-MT5Real26", ea: "averaging-v1" };
    const response = buildVerifyResponse(request, { status: "active", expiresAt: "2027-01-01T00:00:00.000Z" }, now, secret);
    expect(response.state).toBe("active");
    expect(response.checked_at).toBe("2026-10-09T10:00:00.000Z");
    const { signature, ...fields } = response;
    expect(verifySignature(canonicalString(fields), signature, secret)).toBe(true);
    expect(verifySignature(canonicalString({ ...fields, state: "pending" }), signature, secret)).toBe(false);
    expect(verifySignature(canonicalString(fields), signature, "rahasia-lain")).toBe(false);
    expect(verifySignature(canonicalString(fields), "00", secret)).toBe(false);
  });
});

describe("parseLicenseUpdate", () => {
  it("tanggal berlaku sampai akhir hari itu menurut WIB", () => {
    expect(parseLicenseUpdate({ status: "active", expiresOn: "2027-01-31" })).toEqual({
      ok: true,
      value: { status: "active", expiresAt: "2027-01-31T16:59:59.999Z" },
    });
  });

  it("tanggal kosong berarti tanpa batas waktu", () => {
    expect(parseLicenseUpdate({ status: "active", expiresOn: "" })).toEqual({ ok: true, value: { status: "active", expiresAt: null } });
    expect(parseLicenseUpdate({ status: "suspended", expiresOn: null })).toEqual({ ok: true, value: { status: "suspended", expiresAt: null } });
  });

  it("menolak status di luar tiga pilihan", () => {
    expect(parseLicenseUpdate({ status: "expired", expiresOn: "" }).ok).toBe(false);
    expect(parseLicenseUpdate({ status: null, expiresOn: "" }).ok).toBe(false);
  });

  it("menolak tanggal yang tidak ada atau salah bentuk", () => {
    expect(parseLicenseUpdate({ status: "active", expiresOn: "2027-02-30" }).ok).toBe(false);
    expect(parseLicenseUpdate({ status: "active", expiresOn: "2027-13-01" }).ok).toBe(false);
    expect(parseLicenseUpdate({ status: "active", expiresOn: "31/01/2027" }).ok).toBe(false);
  });

  it("lisensi masih aktif di hari terakhirnya dan habis begitu hari berganti di WIB", () => {
    const parsed = parseLicenseUpdate({ status: "active", expiresOn: "2027-01-31" });
    if (!parsed.ok) throw new Error(parsed.error);
    const record = { status: parsed.value.status, expiresAt: parsed.value.expiresAt };
    expect(evaluateLicense(record, new Date("2027-01-31T23:00:00+07:00")).state).toBe("active");
    expect(evaluateLicense(record, new Date("2027-02-01T00:00:00+07:00")).state).toBe("expired");
  });
});

describe("expiryInputValue", () => {
  it("mengembalikan tanggal WIB, bukan tanggal UTC", () => {
    expect(expiryInputValue("2027-01-31T16:59:59.999Z")).toBe("2027-01-31");
    expect(expiryInputValue("2027-01-31T17:00:00.000Z")).toBe("2027-02-01");
  });

  it("kosong untuk lisensi tanpa batas atau tanggal yang tidak terbaca", () => {
    expect(expiryInputValue(null)).toBe("");
    expect(expiryInputValue("bukan-tanggal")).toBe("");
  });

  it("hasilnya bisa disimpan ulang tanpa menggeser tanggal", () => {
    const first = parseLicenseUpdate({ status: "active", expiresOn: "2026-12-31" });
    if (!first.ok) throw new Error(first.error);
    expect(expiryInputValue(first.value.expiresAt)).toBe("2026-12-31");
  });
});
