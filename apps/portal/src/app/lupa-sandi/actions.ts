"use server";

import { sites } from "@forex/ui";
import { normalizeEmail } from "@forex/license";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

/** Mengirim email berisi tautan untuk membuat atau mengganti kata sandi. */
export async function requestPasswordReset(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = normalizeEmail(formData.get("email"));
  if (!email) {
    return { ok: false, message: "Masukkan alamat email yang benar, misalnya nama@contoh.com." };
  }
  if (!sites.portal.url) {
    return { ok: false, message: "Fitur ini belum bisa dipakai karena alamat portal belum diatur." };
  }
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Fitur ini belum bisa dipakai karena portal belum tersambung ke database." };
  }

  // Template email portal mengarah ke /auth/confirm. redirectTo hanya dipakai bila template bawaan Supabase masih aktif.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${sites.portal.url}/auth/callback?next=/atur-sandi`,
  });
  if (error) {
    if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
      return { ok: false, message: "Batas pengiriman email sedang tercapai. Tunggu beberapa menit, lalu coba lagi sekali saja." };
    }
    return { ok: false, message: "Email gagal dikirim. Tunggu sebentar, lalu coba lagi." };
  }
  return {
    ok: true,
    message: `Bila ${email} terdaftar, kami kirim tautan untuk mengatur kata sandi. Kalau tidak ada di kotak masuk, cek folder spam.`,
  };
}
