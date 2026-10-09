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
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Login belum bisa dipakai karena portal belum tersambung ke database." };
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${sites.portal.url}/auth/callback` },
  });
  if (error) {
    return { ok: false, message: "Tautan masuk gagal dikirim. Tunggu sebentar, lalu coba lagi." };
  }
  return { ok: true, message: `Tautan masuk dikirim ke ${email}. Buka email itu di perangkat ini.` };
}
