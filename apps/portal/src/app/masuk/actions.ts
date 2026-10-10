"use server";

import { sites } from "@forex/ui";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

/** Mengirim tautan masuk (magic link) ke email pengguna. */
export async function requestLoginLink(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Masukkan alamat email yang benar, misalnya nama@contoh.com." };
  }
  if (!sites.portal.url) {
    return { ok: false, message: "Login belum bisa dipakai karena alamat portal belum diatur." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Login belum bisa dipakai karena portal belum tersambung ke database." };
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${sites.portal.url}/auth/callback` },
  });
  if (error) {
    // Supabase membatasi jumlah email per jam untuk seluruh proyek dan jeda antarpermintaan per alamat.
    if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
      return {
        ok: false,
        message: "Batas pengiriman email sedang tercapai. Tunggu beberapa menit, lalu coba lagi sekali saja.",
      };
    }
    if (error.code === "email_address_invalid") {
      return { ok: false, message: "Alamat email ini ditolak. Periksa penulisannya, atau pakai alamat lain." };
    }
    return { ok: false, message: "Tautan masuk gagal dikirim. Tunggu sebentar, lalu coba lagi." };
  }
  return { ok: true, message: `Tautan masuk dikirim ke ${email}. Kalau tidak ada di kotak masuk, cek folder spam.` };
}
