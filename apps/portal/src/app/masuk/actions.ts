"use server";

import { redirect } from "next/navigation";
import { normalizeEmail } from "@forex/license";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

const NOT_CONNECTED: FormState = { ok: false, message: "Login belum bisa dipakai karena portal belum tersambung ke database." };

/** Masuk dengan email dan kata sandi, lalu membuka halaman akun. Tidak mengirim email apa pun. */
export async function signIn(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  if (!email) {
    return { ok: false, message: "Masukkan alamat email yang benar, misalnya nama@contoh.com." };
  }
  if (password.length === 0) {
    return { ok: false, message: "Isi kata sandi Anda." };
  }
  const supabase = await createClient();
  if (!supabase) return NOT_CONNECTED;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        ok: false,
        message:
          "Email ini belum dikonfirmasi. Buka tautan di email pendaftaran, atau daftar ulang dengan email yang sama untuk menerima tautan baru.",
      };
    }
    if (error.code === "over_request_rate_limit") {
      return { ok: false, message: "Terlalu banyak percobaan masuk. Tunggu beberapa menit, lalu coba lagi." };
    }
    // Pesan yang sama untuk email tak terdaftar dan kata sandi salah, supaya daftar member tidak bisa ditebak.
    return { ok: false, message: "Email atau kata sandi salah. Belum punya kata sandi? Pakai Lupa kata sandi." };
  }
  redirect("/akun");
}
