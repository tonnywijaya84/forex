"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { parseLicenseUpdate } from "@forex/license";
import type { FormState } from "@/lib/form-state";
import { getSessionUser } from "@/lib/supabase/server";
import { UUID_PATTERN } from "@/lib/uuid";

/**
 * Mengubah status dan masa berlaku satu lisensi. Pemeriksaan admin dilakukan database
 * (fungsi admin_set_license), jadi memanggil action ini tanpa hak admin selalu ditolak.
 */
export async function setLicense(_previous: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!UUID_PATTERN.test(id)) {
    return { ok: false, message: "Akun tidak dikenali. Muat ulang halaman ini." };
  }
  const parsed = parseLicenseUpdate({ status: formData.get("status"), expiresOn: formData.get("expires_on") });
  if (!parsed.ok) return { ok: false, message: parsed.error };

  const user = await getSessionUser();
  if (!user) redirect("/masuk");

  const { data, error } = await user.supabase.rpc("admin_set_license", {
    p_account_id: id,
    p_status: parsed.value.status,
    p_expires_at: parsed.value.expiresAt,
  });

  if (error) {
    // 42501 = insufficient_privilege: pengguna ini bukan admin.
    if (error.code === "42501") return { ok: false, message: "Hanya admin yang boleh mengubah lisensi." };
    return { ok: false, message: "Perubahan gagal disimpan. Coba lagi." };
  }
  if (data !== true) {
    return { ok: false, message: "Akun ini sudah dihapus pemiliknya. Muat ulang halaman ini." };
  }

  refresh();
  return { ok: true, message: "Tersimpan." };
}
