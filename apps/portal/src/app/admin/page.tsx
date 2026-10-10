import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { evaluateLicense, expiryInputValue, type StoredStatus } from "@forex/license";
import { Container, Notice } from "@forex/ui";
import { LicenseForm } from "@/components/license-form";
import { dateFormat, stateLabel, statusOptions } from "@/lib/license-labels";
import { supabaseEnv } from "@/lib/supabase/env";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin lisensi", robots: { index: false, follow: false } };

type AdminRow = {
  id: string;
  owner_email: string | null;
  account_number: number;
  broker_server: string;
  ea_name: string;
  status: StoredStatus;
  expires_at: string | null;
  created_at: string;
};

async function Licenses() {
  const user = await getSessionUser();
  if (!user) redirect("/masuk");

  // Bukan admin diperlakukan seperti alamat yang tidak ada, supaya halaman ini tidak terlihat dari luar.
  const admin = await user.supabase.rpc("is_admin");
  if (admin.error) {
    return (
      <Notice title="Halaman admin belum siap">
        Jalankan migrasi database terbaru di Supabase, lalu muat ulang halaman ini.
      </Notice>
    );
  }
  if (admin.data !== true) notFound();

  const accounts = await user.supabase.rpc("admin_list_accounts");
  if (accounts.error) {
    return <Notice title="Daftar akun tidak bisa dimuat">Muat ulang halaman ini.</Notice>;
  }

  const rows = accounts.data as AdminRow[];
  const waiting = rows.filter((row) => row.status === "pending").length;
  const now = new Date();

  if (rows.length === 0) {
    return <p className="max-w-[56ch] text-ink-soft">Belum ada akun MT5 yang didaftarkan pengguna.</p>;
  }

  return (
    <>
      <p className="max-w-[64ch] text-ink-soft">
        {rows.length} akun terdaftar, {waiting} menunggu aktivasi. Lisensi berlaku sampai akhir tanggal yang dipilih
        (WIB). Kosongkan tanggal untuk lisensi tanpa batas waktu.
      </p>
      <ul className="mt-8 border-t border-ink">
        {rows.map((row) => {
          const { state } = evaluateLicense({ status: row.status, expiresAt: row.expires_at }, now);
          const expires = row.expires_at ? dateFormat.format(new Date(row.expires_at)) : null;
          const summary: Record<typeof state, string> = {
            pending: stateLabel.pending.text,
            active: expires ? `${stateLabel.active.text}, berlaku sampai ${expires}` : `${stateLabel.active.text}, tanpa batas waktu`,
            expired: `Masa berlaku habis pada ${expires}`,
            suspended: expires ? `${stateLabel.suspended.text}, masa berlaku sampai ${expires}` : stateLabel.suspended.text,
            unknown: stateLabel.unknown.text,
          };
          return (
            <li key={row.id} className="grid gap-x-10 gap-y-4 border-b border-rule py-6 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <p className="text-xl font-semibold">
                  {row.account_number} <span className="font-normal text-ink-soft">di {row.broker_server}</span>
                </p>
                <p className="mt-1">{row.ea_name}</p>
                <p className="mt-1 break-all text-ink-soft">{row.owner_email ?? "Email tidak tersedia"}</p>
                <p className="mt-1 text-ink-soft">Didaftarkan {dateFormat.format(new Date(row.created_at))}</p>
                <p className={`mt-2 font-medium ${stateLabel[state].className}`}>{summary[state]}</p>
              </div>
              <LicenseForm
                id={row.id}
                accountNumber={row.account_number}
                status={row.status}
                expiresOn={expiryInputValue(row.expires_at)}
                options={statusOptions}
              />
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function AdminPage() {
  const configured = supabaseEnv() !== null;
  return (
    <Container className="py-14">
      <h1 className="text-4xl font-bold">Admin lisensi</h1>
      <div className="mt-6">
        {configured ? (
          <Suspense fallback={<p className="text-ink-soft">Memuat daftar akun</p>}>
            <Licenses />
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
