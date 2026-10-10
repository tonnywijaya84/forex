"use server";

import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** Jenis tautan email yang boleh ditukar di sini. Jenis lain (undangan, ganti email, pemulihan) tidak dipakai portal. */
const LOGIN_TYPES: readonly EmailOtpType[] = ["email", "signup", "magiclink"];

/** Menukar token dari tautan email dengan sesi login, lalu membuka halaman akun. */
export async function confirmLogin(formData: FormData): Promise<void> {
  const tokenHash = String(formData.get("token_hash") ?? "");
  const type = LOGIN_TYPES.find((candidate) => candidate === formData.get("type"));
  const supabase = await createClient();
  if (!supabase || !type || tokenHash.length === 0 || tokenHash.length > 200) {
    redirect("/masuk?gagal=1");
  }
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  redirect(error ? "/masuk?gagal=1" : "/akun");
}
