"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { parseProfile } from "@forex/license";
import type { FormState } from "@/lib/form-state";
import { getSessionUser } from "@/lib/supabase/server";

/** Menyimpan data diri pengguna yang sedang login. Row Level Security mencegah penulisan atas nama orang lain. */
export async function saveProfile(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseProfile(
    {
      fullName: formData.get("full_name"),
      phone: formData.get("phone"),
      city: formData.get("city"),
      telegram: formData.get("telegram"),
      birthDate: formData.get("birth_date"),
    },
    new Date(),
  );
  if (!parsed.ok) return { ok: false, message: parsed.error };

  const user = await getSessionUser();
  if (!user) redirect("/masuk");

  const { error } = await user.supabase.from("profiles").upsert(
    {
      user_id: user.id,
      full_name: parsed.value.fullName,
      phone: parsed.value.phone,
      city: parsed.value.city,
      telegram: parsed.value.telegram,
      birth_date: parsed.value.birthDate,
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, message: "Data diri gagal disimpan. Coba lagi; bila tetap gagal, hubungi kami." };

  refresh();
  return { ok: true, message: "Data diri tersimpan." };
}
