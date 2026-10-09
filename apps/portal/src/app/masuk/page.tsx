import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, Notice } from "@forex/ui";
import { LoginForm } from "@/components/login-form";
import { supabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Masuk" };

async function CallbackError({ searchParams }: { searchParams: PageProps<"/masuk">["searchParams"] }) {
  const { gagal } = await searchParams;
  if (!gagal) return null;
  return (
    <div className="mt-6 max-w-xl">
      <Notice title="Tautan masuk tidak bisa dipakai">
        Tautan itu sudah kedaluwarsa atau dibuka di peramban lain. Minta tautan baru di bawah ini.
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
        Tulis email Anda. Kami kirim tautan sekali pakai untuk masuk, tanpa kata sandi.
      </p>
      <Suspense fallback={null}>
        <CallbackError searchParams={searchParams} />
      </Suspense>
      <div className="mt-8">
        {configured ? (
          <LoginForm />
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
