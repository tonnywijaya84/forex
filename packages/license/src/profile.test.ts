import { describe, expect, it } from "vitest";
import { normalizePhone, parseProfile, type ProfileInput } from "./profile";

const now = new Date("2026-10-10T10:00:00+07:00");
const valid: ProfileInput = {
  fullName: "  Budi   Santoso ",
  phone: "0812 3456-7890",
  city: " Jakarta Selatan ",
  telegram: "@budi_s",
  birthDate: "1990-05-17",
};

describe("normalizePhone", () => {
  it("mengubah tulisan nomor Indonesia yang umum ke format internasional", () => {
    expect(normalizePhone("0812 3456 7890")).toBe("+6281234567890");
    expect(normalizePhone("6281234567890")).toBe("+6281234567890");
    expect(normalizePhone("+62 812-3456-7890")).toBe("+6281234567890");
    expect(normalizePhone("(021) 555 0123")).toBe("+62215550123");
  });

  it("menerima nomor negara lain yang diawali tanda +", () => {
    expect(normalizePhone("+65 9123 4567")).toBe("+6591234567");
  });

  it("menolak yang bukan nomor telepon", () => {
    expect(normalizePhone("81234567890")).toBeNull();
    expect(normalizePhone("0812")).toBeNull();
    expect(normalizePhone("0812-abc-7890")).toBeNull();
    expect(normalizePhone("+0812345678")).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
  });
});

describe("parseProfile", () => {
  it("merapikan isian yang benar", () => {
    expect(parseProfile(valid, now)).toEqual({
      ok: true,
      value: { fullName: "Budi Santoso", phone: "+6281234567890", city: "Jakarta Selatan", telegram: "budi_s", birthDate: "1990-05-17" },
    });
  });

  it("username Telegram boleh kosong", () => {
    const result = parseProfile({ ...valid, telegram: "  " }, now);
    expect(result.ok && result.value.telegram).toBeNull();
  });

  it("menolak nama, kota, telepon, atau Telegram yang salah bentuk", () => {
    expect(parseProfile({ ...valid, fullName: "B" }, now).ok).toBe(false);
    expect(parseProfile({ ...valid, fullName: "x".repeat(101) }, now).ok).toBe(false);
    expect(parseProfile({ ...valid, city: "" }, now).ok).toBe(false);
    expect(parseProfile({ ...valid, phone: "12345" }, now).ok).toBe(false);
    expect(parseProfile({ ...valid, telegram: "@ab" }, now).ok).toBe(false);
    expect(parseProfile({ ...valid, telegram: "nama dengan spasi" }, now).ok).toBe(false);
  });

  it("menolak tanggal lahir yang tidak ada, di masa depan, atau tidak masuk akal", () => {
    expect(parseProfile({ ...valid, birthDate: "1990-02-30" }, now).ok).toBe(false);
    expect(parseProfile({ ...valid, birthDate: "17/05/1990" }, now).ok).toBe(false);
    expect(parseProfile({ ...valid, birthDate: "2027-01-01" }, now).ok).toBe(false);
    expect(parseProfile({ ...valid, birthDate: "1890-01-01" }, now).ok).toBe(false);
  });

  it("hanya menerima pengguna berusia 18 tahun ke atas, dihitung menurut tanggal di WIB", () => {
    expect(parseProfile({ ...valid, birthDate: "2008-10-10" }, now).ok).toBe(true);
    const tooYoung = parseProfile({ ...valid, birthDate: "2008-10-11" }, now);
    expect(tooYoung).toEqual({ ok: false, error: "Portal ini hanya untuk pengguna berusia 18 tahun ke atas." });
    // 23.30 UTC tanggal 10 sudah tanggal 11 di WIB, jadi yang lahir 11 Oktober 2008 sudah genap 18 tahun.
    expect(parseProfile({ ...valid, birthDate: "2008-10-11" }, new Date("2026-10-10T23:30:00Z")).ok).toBe(true);
  });
});
