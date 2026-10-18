import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Container } from "@forex/ui";
import { NewPasswordForm } from "@/components/auth-forms";
import { NotConnected } from "@/components/not-connected";
import { supabaseEnv } from "@/lib/supabase/env";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Atur kata sandi", robots: { index: false, follow: false } };

async function PasswordSection() {
  const user = await getSessionUser();
  if (!user) redirect("/masuk");
  return (
    <>
      <p className="mb-6 text-ink-soft">Akun: {user.email ?? "pengguna"}</p>
      <NewPasswordForm />
      <p className="mt-2">
        <Link href="/akun" className="underline">
          Ke Akun MT5 saya
        </Link>
      </p>
    </>
  );
}

export default function SetPasswordPage() {
  const configured = supabaseEnv() !== null;
  return (
    <Container className="py-14">
      <h1 className="text-4xl font-bold">Atur kata sandi</h1>
      <p className="mt-4 max-w-[56ch] text-ink-soft">
        Kata sandi ini dipakai setiap kali Anda masuk ke portal. Simpan baik-baik dan jangan dibagikan ke siapa pun.
      </p>
      <div className="mt-8">
        {configured ? (
          <Suspense fallback={<p className="text-ink-soft">Memeriksa sesi Anda</p>}>
            <PasswordSection />
          </Suspense>
        ) : (
          <NotConnected />
        )}
      </div>
    </Container>
  );
}
