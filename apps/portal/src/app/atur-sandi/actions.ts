"use server";

import { redirect } from "next/navigation";
import { checkNewPassword } from "@forex/license";
import type { FormState } from "@/lib/form-state";
import { getSessionUser } from "@/lib/supabase/server";

/** Menyimpan kata sandi baru untuk pengguna yang sedang masuk, termasuk yang baru membuka tautan Lupa kata sandi. */
export async function setPassword(_previous: FormState, formData: FormData): Promise<FormState> {
  const password = checkNewPassword(formData.get("password"), formData.get("password_confirm"));
  if (!password.ok) return { ok: false, message: password.error };

  const user = await getSessionUser();
  if (!user) redirect("/masuk");

  const { error } = await user.supabase.auth.updateUser({ password: password.value });
  if (error) {
    if (error.code === "same_password") {
      return { ok: false, message: "Kata sandi baru sama dengan yang lama. Pakai kata sandi lain." };
    }
    if (error.code === "weak_password") {
      return { ok: false, message: "Kata sandi ini terlalu mudah ditebak. Pakai kata sandi lain yang lebih panjang." };
    }
    if (error.code === "reauthentication_needed" || error.code === "session_expired") {
      return { ok: false, message: "Demi keamanan, minta tautan baru lewat Lupa kata sandi, lalu atur kata sandi dari tautan itu." };
    }
    return { ok: false, message: "Kata sandi gagal disimpan. Tunggu sebentar, lalu coba lagi." };
  }
  return { ok: true, message: "Kata sandi tersimpan. Berikutnya, masuk dengan email dan kata sandi ini." };
}
