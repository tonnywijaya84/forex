"use server";

import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Jenis tautan email yang boleh ditukar di sini, beserta halaman tujuannya. `email` dan `signup` berasal dari
 * konfirmasi pendaftaran, `magiclink` dari tautan masuk lama, dan `recovery` dari Lupa kata sandi.
 * Jenis lain (undangan, ganti email) tidak dipakai portal.
 */
const DESTINATIONS: Partial<Record<EmailOtpType, string>> = {
  email: "/akun",
  signup: "/akun",
  magiclink: "/akun",
  recovery: "/atur-sandi",
};

/** Menukar token dari tautan email dengan sesi login, lalu membuka halaman tujuannya. */
export async function confirmLogin(formData: FormData): Promise<void> {
  const tokenHash = String(formData.get("token_hash") ?? "");
  const type = (Object.keys(DESTINATIONS) as EmailOtpType[]).find((candidate) => candidate === formData.get("type"));
  const supabase = await createClient();
  if (!supabase || !type || tokenHash.length === 0 || tokenHash.length > 200) {
    redirect("/masuk?gagal=1");
  }
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  redirect(error ? "/masuk?gagal=1" : (DESTINATIONS[type] ?? "/akun"));
}
