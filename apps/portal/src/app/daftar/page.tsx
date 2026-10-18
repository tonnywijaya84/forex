import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@forex/ui";
import { SignUpForm } from "@/components/auth-forms";
import { NotConnected } from "@/components/not-connected";
import { supabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Daftar" };

export default function SignUpPage() {
  const configured = supabaseEnv() !== null;
  return (
    <Container className="py-14">
      <h1 className="text-4xl font-bold">Daftar</h1>
      <p className="mt-4 max-w-[60ch] text-ink-soft">
        Buat akun dengan email dan kata sandi. Kami kirim satu email konfirmasi untuk memastikan alamat itu milik Anda.
        Setelah itu Anda cukup masuk dengan kata sandi. Sudah punya akun?{" "}
        <Link href="/masuk" className="text-ink underline">
          Masuk
        </Link>
        .
      </p>
      <div className="mt-8">{configured ? <SignUpForm /> : <NotConnected />}</div>
    </Container>
  );
}
