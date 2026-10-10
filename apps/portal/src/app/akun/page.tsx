import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { evaluateLicense, type StoredStatus } from "@forex/license";
import { Container, Notice } from "@forex/ui";
import { AddAccountForm } from "@/components/add-account-form";
import { dateFormat, stateLabel } from "@/lib/license-labels";
import { supabaseEnv } from "@/lib/supabase/env";
import { getSessionUser } from "@/lib/supabase/server";
import { removeAccount, signOut } from "./actions";

export const metadata: Metadata = { title: "Akun MT5 saya" };

type AccountRow = {
  id: string;
  account_number: number;
  broker_server: string;
  status: StoredStatus;
  expires_at: string | null;
  eas: { name: string } | null;
};

async function Accounts() {
  const user = await getSessionUser();
  if (!user) redirect("/masuk");

  const [eas, accounts, admin] = await Promise.all([
    user.supabase.from("eas").select("id, name").order("name"),
    user.supabase.from("mt5_accounts").select("id, account_number, broker_server, status, expires_at, eas(name)").order("created_at"),
    user.supabase.rpc("is_admin"),
  ]);

  if (eas.error || accounts.error) {
    return (
      <Notice title="Data akun tidak bisa dimuat">
        Muat ulang halaman ini. Bila tetap gagal, pastikan migrasi database sudah dijalankan.
      </Notice>
    );
  }

  const rows = accounts.data as unknown as AccountRow[];
  const now = new Date();

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <p className="text-ink-soft">Masuk sebagai {user.email ?? "pengguna"}</p>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          {admin.data === true && (
            <Link href="/admin" className="underline">
              Admin lisensi
            </Link>
          )}
          <form action={signOut}>
            <button type="submit" className="underline">
              Keluar
            </button>
          </form>
        </div>
      </div>

      <h2 className="mt-10 text-2xl font-bold">Akun terdaftar</h2>
      {rows.length === 0 ? (
        <p className="mt-4 max-w-[56ch] text-ink-soft">
          Belum ada akun. Isi formulir di bawah untuk mendaftarkan akun MT5 pertama Anda.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink">
                <th className="py-2 pr-4 font-semibold">Nomor akun</th>
                <th className="py-2 pr-4 font-semibold">Server</th>
                <th className="py-2 pr-4 font-semibold">EA</th>
                <th className="py-2 pr-4 font-semibold">Status</th>
                <th className="py-2 pr-4 font-semibold">Berlaku sampai</th>
                <th className="py-2">
                  <span className="sr-only">Tindakan</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const { state } = evaluateLicense({ status: row.status, expiresAt: row.expires_at }, now);
                return (
                  <tr key={row.id} className="border-b border-rule">
                    <td className="py-3 pr-4 font-medium">{row.account_number}</td>
                    <td className="py-3 pr-4">{row.broker_server}</td>
                    <td className="py-3 pr-4">{row.eas?.name ?? "EA tidak dikenal"}</td>
                    <td className={`py-3 pr-4 font-medium ${stateLabel[state].className}`}>{stateLabel[state].text}</td>
                    <td className="py-3 pr-4">{row.expires_at ? dateFormat.format(new Date(row.expires_at)) : "Tanpa batas"}</td>
                    <td className="py-3 text-right">
                      <form action={removeAccount}>
                        <input type="hidden" name="id" value={row.id} />
                        <button type="submit" className="underline" aria-label={`Hapus akun ${row.account_number}`}>
                          Hapus
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-12 text-2xl font-bold">Daftarkan akun baru</h2>
      <p className="mt-2 max-w-[60ch] text-ink-soft">
        Nomor akun dan nama server terlihat di MetaTrader 5 pada menu File, lalu Login to Trade Account.
      </p>
      <div className="mt-6">
        {eas.data.length === 0 ? (
          <Notice title="Belum ada EA yang bisa didaftarkan">Katalog EA masih kosong. Isi tabel eas di database lebih dulu.</Notice>
        ) : (
          <AddAccountForm eas={eas.data as { id: string; name: string }[]} />
        )}
      </div>
    </>
  );
}

export default function AccountPage() {
  const configured = supabaseEnv() !== null;
  return (
    <Container className="py-14">
      <h1 className="text-4xl font-bold">Akun MT5 saya</h1>
      <div className="mt-6">
        {configured ? (
          <Suspense fallback={<p className="text-ink-soft">Memuat akun Anda</p>}>
            <Accounts />
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
