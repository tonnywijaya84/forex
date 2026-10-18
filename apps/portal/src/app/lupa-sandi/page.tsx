import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@forex/ui";
import { ResetRequestForm } from "@/components/auth-forms";
import { NotConnected } from "@/components/not-connected";
import { supabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Lupa kata sandi" };

export default function ForgotPasswordPage() {
  const configured = supabaseEnv() !== null;
  return (
    <Container className="py-14">
      <h1 className="text-4xl font-bold">Lupa kata sandi</h1>
      <p className="mt-4 max-w-[60ch] text-ink-soft">
        Tulis email akun Anda. Kami kirim tautan untuk mengatur kata sandi baru. Cara ini juga dipakai untuk membuat kata
        sandi pertama bila dulu Anda masuk lewat tautan email.
      </p>
      <div className="mt-8">{configured ? <ResetRequestForm /> : <NotConnected />}</div>
      <p className="mt-2">
        <Link href="/masuk" className="underline">
          Kembali ke halaman Masuk
        </Link>
      </p>
    </Container>
  );
}
