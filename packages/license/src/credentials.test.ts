import { describe, expect, it } from "vitest";
import { checkNewPassword, normalizeEmail, PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH } from "./credentials";

describe("normalizeEmail", () => {
  it("merapikan spasi dan huruf besar", () => {
    expect(normalizeEmail("  Budi.Santoso@Example.COM ")).toBe("budi.santoso@example.com");
  });

  it("menolak bentuk yang bukan email", () => {
    expect(normalizeEmail("budi")).toBeNull();
    expect(normalizeEmail("budi@contoh")).toBeNull();
    expect(normalizeEmail("budi @contoh.com")).toBeNull();
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
  });

  it("menolak alamat yang terlalu panjang", () => {
    expect(normalizeEmail(`${"a".repeat(250)}@contoh.com`)).toBeNull();
  });
});

describe("checkNewPassword", () => {
  it("menerima kata sandi yang cukup panjang dan sama dengan ketikan ulangnya", () => {
    expect(checkNewPassword("rahasia-123", "rahasia-123")).toEqual({ ok: true, value: "rahasia-123" });
  });

  it("menolak kata sandi kosong", () => {
    expect(checkNewPassword("", "")).toEqual({ ok: false, error: "Isi kata sandi baru." });
    expect(checkNewPassword(null, null).ok).toBe(false);
  });

  it(`menolak kata sandi yang lebih pendek dari ${PASSWORD_MIN_LENGTH} karakter`, () => {
    const short = "a".repeat(PASSWORD_MIN_LENGTH - 1);
    expect(checkNewPassword(short, short)).toEqual({ ok: false, error: "Kata sandi minimal 8 karakter." });
  });

  it("menghitung karakter, bukan byte, untuk batas minimum", () => {
    const emoji = "🙂".repeat(PASSWORD_MIN_LENGTH);
    expect(checkNewPassword(emoji, emoji).ok).toBe(true);
  });

  it(`menolak kata sandi yang lebih dari ${PASSWORD_MAX_BYTES} byte`, () => {
    const long = "a".repeat(PASSWORD_MAX_BYTES + 1);
    expect(checkNewPassword(long, long).ok).toBe(false);
    const exact = "a".repeat(PASSWORD_MAX_BYTES);
    expect(checkNewPassword(exact, exact).ok).toBe(true);
  });

  it("menolak kata sandi yang hanya berisi spasi", () => {
    const spaces = " ".repeat(10);
    expect(checkNewPassword(spaces, spaces)).toEqual({ ok: false, error: "Kata sandi tidak boleh hanya berisi spasi." });
  });

  it("menolak ketikan ulang yang berbeda", () => {
    expect(checkNewPassword("rahasia-123", "rahasia-124")).toEqual({
      ok: false,
      error: "Kedua kata sandi tidak sama. Ketik ulang dengan teliti.",
    });
  });
});
