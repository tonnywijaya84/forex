"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { SERVER_PATTERN } from "@forex/license";
import type { FormState } from "@/lib/form-state";
import { getSessionUser } from "@/lib/supabase/server";
import { UUID_PATTERN } from "@/lib/uuid";

/** Mendaftarkan satu akun MT5 untuk satu EA. Status awalnya selalu pending (diatur database). */
export async function addAccount(_previous: FormState, formData: FormData): Promise<FormState> {
  const accountText = String(formData.get("account_number") ?? "").trim();
  const server = String(formData.get("broker_server") ?? "").trim();
  const eaId = String(formData.get("ea_id") ?? "");

  if (!/^[1-9]\d{0,14}$/.test(accountText)) {
    return { ok: false, message: "Nomor akun MT5 hanya berisi angka, misalnya 276170008." };
  }
  if (!SERVER_PATTERN.test(server)) {
    return { ok: false, message: "Tulis nama server persis seperti di MT5, misalnya Exness-MT5Real26." };
  }
  if (!UUID_PATTERN.test(eaId)) {
    return { ok: false, message: "Pilih EA yang ingin diaktifkan." };
  }

  const user = await getSessionUser();
  if (!user) redirect("/masuk");

  const { error } = await user.supabase
    .from("mt5_accounts")
    .insert({ ea_id: eaId, account_number: Number(accountText), broker_server: server });

  if (error) {
    // 23505 = unique_violation: kombinasi EA, nomor akun, dan server sudah ada.
    if (error.code === "23505") {
      return { ok: false, message: "Akun ini sudah terdaftar untuk EA tersebut. Hubungi kami bila itu bukan Anda." };
    }
    return { ok: false, message: "Akun gagal disimpan. Coba lagi; bila tetap gagal, hubungi kami." };
  }

  refresh();
  return { ok: true, message: `Akun ${accountText} didaftarkan. Statusnya menunggu aktivasi.` };
}

/** Menghapus pendaftaran akun milik pengguna. Row Level Security mencegah penghapusan akun orang lain. */
export async function removeAccount(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!UUID_PATTERN.test(id)) return;
  const user = await getSessionUser();
  if (!user) redirect("/masuk");
  await user.supabase.from("mt5_accounts").delete().eq("id", id);
  refresh();
}

export async function signOut(): Promise<void> {
  const user = await getSessionUser();
  if (user) await user.supabase.auth.signOut();
  redirect("/");
}
