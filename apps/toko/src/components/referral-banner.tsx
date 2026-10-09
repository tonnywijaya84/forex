import { cookies } from "next/headers";
import { Container } from "@forex/ui";
import { isValidRefCode, REF_COOKIE } from "@/lib/referral";

/** Memberi tahu pengunjung bahwa kode referralnya tercatat. Membaca cookie, jadi harus di dalam Suspense. */
export async function ReferralBanner({ incoming }: { incoming: Promise<string | undefined> }) {
  const stored = (await cookies()).get(REF_COOKIE)?.value;
  // Pada kunjungan pertama cookie baru dikirim bersama jawaban ini, jadi baca juga kode dari alamat.
  const fromUrl = await incoming;
  const code = isValidRefCode(stored) ? stored : isValidRefCode(fromUrl) ? fromUrl : null;
  if (!code) return null;
  return (
    <div className="border-b border-rule bg-surface">
      <Container className="py-3 text-sm">
        Anda datang lewat kode referral <strong className="font-semibold">{code}</strong>. Kode ini tersimpan 30 hari
        di peramban ini.
      </Container>
    </div>
  );
}
