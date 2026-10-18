import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container, Notice } from "@forex/ui";
import { LoginForm } from "@/components/auth-forms";
import { NotConnected } from "@/components/not-connected";
import { supabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Masuk" };

async function CallbackError({ searchParams }: { searchParams: PageProps<"/masuk">["searchParams"] }) {
  const { gagal } = await searchParams;
  if (!gagal) return null;
  return (
    <div className="mt-6 max-w-xl">
      <Notice title="Tautan tidak bisa dipakai">
        Tautan itu sudah kedaluwarsa atau sudah pernah dipakai. Minta tautan baru lewat{" "}
        <Link href="/lupa-sandi" className="underline">
          Lupa kata sandi
        </Link>
        .
      </Notice>
    </div>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/masuk">) {
  const configured = supabaseEnv() !== null;
  return (
    <Container className="py-14">
      <h1 className="text-4xl font-bold">Masuk</h1>
      <p className="mt-4 max-w-[56ch] text-ink-soft">
        Masuk dengan email dan kata sandi Anda. Belum punya akun?{" "}
        <Link href="/daftar" className="text-ink underline">
          Daftar
        </Link>
        .
      </p>
      <Suspense fallback={null}>
        <CallbackError searchParams={searchParams} />
      </Suspense>
      <div className="mt-8">{configured ? <LoginForm /> : <NotConnected />}</div>
      <div className="mt-6 max-w-xl">
        <Notice title="Dulu masuk lewat tautan email?">
          Akun Anda masih ada, tetapi belum punya kata sandi. Buat kata sandi satu kali lewat{" "}
          <Link href="/lupa-sandi" className="underline">
            Lupa kata sandi
          </Link>
          , lalu masuk seperti biasa.
        </Notice>
      </div>
    </Container>
  );
}
