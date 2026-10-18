import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button, Container, Notice } from "@forex/ui";
import { confirmLogin } from "./actions";

export const metadata: Metadata = { title: "Satu langkah lagi", robots: { index: false, follow: false } };

/**
 * Tujuan tautan di email konfirmasi dan Lupa kata sandi. Token baru ditukar setelah tombol ditekan, bukan saat halaman dibuka,
 * supaya pemindai email yang membuka tautan lebih dulu tidak menghabiskan tautan sekali pakai itu.
 */
async function ConfirmForm({ searchParams }: { searchParams: PageProps<"/auth/confirm">["searchParams"] }) {
  const { token_hash: tokenHash, type } = await searchParams;
  if (typeof tokenHash !== "string" || typeof type !== "string") {
    return (
      <div className="max-w-xl">
        <Notice title="Tautan tidak lengkap">
          Buka lagi tautan dari email Anda, atau{" "}
          <Link href="/lupa-sandi" className="text-ink underline">
            minta tautan baru
          </Link>
          .
        </Notice>
      </div>
    );
  }
  return (
    <form action={confirmLogin}>
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <Button type="submit">{type === "recovery" ? "Lanjut atur kata sandi" : "Masuk ke portal"}</Button>
    </form>
  );
}

export default function ConfirmPage({ searchParams }: PageProps<"/auth/confirm">) {
  return (
    <Container className="py-14">
      <h1 className="text-4xl font-bold">Satu langkah lagi</h1>
      <p className="mt-4 max-w-[56ch] text-ink-soft">Tekan tombol di bawah untuk melanjutkan.</p>
      <div className="mt-8">
        <Suspense fallback={null}>
          <ConfirmForm searchParams={searchParams} />
        </Suspense>
      </div>
    </Container>
  );
}
