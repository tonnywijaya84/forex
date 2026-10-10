import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Container, Notice, sites } from "@forex/ui";
import { ProfileForm } from "@/components/profile-form";
import { supabaseEnv } from "@/lib/supabase/env";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Data diri" };

type ProfileRow = {
  full_name: string;
  phone: string;
  city: string;
  telegram: string | null;
  birth_date: string;
};

async function Profile() {
  const user = await getSessionUser();
  if (!user) redirect("/masuk");

  const profile = await user.supabase.from("profiles").select("full_name, phone, city, telegram, birth_date").maybeSingle();
  if (profile.error) {
    return (
      <div className="max-w-xl">
        <Notice title="Data diri tidak bisa dimuat">
          Muat ulang halaman ini. Bila tetap gagal, pastikan migrasi database terbaru sudah dijalankan.
        </Notice>
      </div>
    );
  }

  const row = profile.data as ProfileRow | null;
  return (
    <>
      {!row && (
        <div className="mb-8 max-w-xl">
          <Notice title="Lengkapi data diri Anda">Data ini perlu diisi sebelum Anda bisa mendaftarkan akun MT5.</Notice>
        </div>
      )}
      <ProfileForm
        initial={{
          fullName: row?.full_name ?? "",
          phone: row?.phone ?? "",
          city: row?.city ?? "",
          telegram: row?.telegram ? `@${row.telegram}` : "",
          birthDate: row?.birth_date ?? "",
        }}
      />
    </>
  );
}

export default function ProfilePage() {
  const configured = supabaseEnv() !== null;
  return (
    <Container className="py-14">
      <h1 className="text-4xl font-bold">Data diri</h1>
      <p className="mt-4 max-w-[60ch] text-ink-soft">
        Data ini dipakai admin {sites.toko.name} untuk memeriksa syarat lisensi dan menghubungi Anda bila ada kendala pada
        lisensi. Anda bisa mengubahnya kapan saja.
      </p>
      <div className="mt-8">
        {configured ? (
          <Suspense fallback={<p className="text-ink-soft">Memuat data diri Anda</p>}>
            <Profile />
          </Suspense>
        ) : (
          <div className="max-w-xl">
            <Notice title="Portal belum tersambung ke database">
              Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY di file .env.local, lalu jalankan
              ulang aplikasi. Langkah lengkapnya ada di README.
            </Notice>
          </div>
        )}
      </div>
    </Container>
  );
}
