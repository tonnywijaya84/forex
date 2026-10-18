"use server";

import { sites } from "@forex/ui";
import { checkNewPassword, normalizeEmail } from "@forex/license";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

/**
 * Mendaftarkan member baru dengan email dan kata sandi. Supabase mengirim satu email konfirmasi;
 * setelah itu member cukup masuk dengan kata sandi.
 */
export async function signUp(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = normalizeEmail(formData.get("email"));
  if (!email) {
    return { ok: false, message: "Masukkan alamat email yang benar, misalnya nama@contoh.com." };
  }
  const password = checkNewPassword(formData.get("password"), formData.get("password_confirm"));
  if (!password.ok) return { ok: false, message: password.error };
  if (!sites.portal.url) {
    return { ok: false, message: "Pendaftaran belum bisa dipakai karena alamat portal belum diatur." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Pendaftaran belum bisa dipakai karena portal belum tersambung ke database." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password: password.value,
    options: { emailRedirectTo: `${sites.portal.url}/auth/callback` },
  });
  if (error) {
    if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
      return { ok: false, message: "Batas pengiriman email sedang tercapai. Tunggu beberapa menit, lalu coba lagi sekali saja." };
    }
    if (error.code === "weak_password") {
      return { ok: false, message: "Kata sandi ini terlalu mudah ditebak. Pakai kata sandi lain yang lebih panjang." };
    }
    if (error.code === "email_address_invalid") {
      return { ok: false, message: "Alamat email ini ditolak. Periksa penulisannya, atau pakai alamat lain." };
    }
    return { ok: false, message: "Pendaftaran gagal. Tunggu sebentar, lalu coba lagi." };
  }
  // Supabase sengaja menjawab sama untuk email yang sudah terdaftar, supaya daftar member tidak bisa ditebak.
  return {
    ok: true,
    message: `Kami kirim email konfirmasi ke ${email}. Buka tautannya satu kali, setelah itu Anda cukup masuk dengan kata sandi. Kalau tidak ada di kotak masuk, cek folder spam. Kalau email ini sudah pernah terdaftar, pakai Lupa kata sandi.`,
  };
}
