import { Suspense } from "react";
import Link from "next/link";
import { ButtonLink, Container, sites } from "@forex/ui";
import { ReferralBanner } from "@/components/referral-banner";
import { formatPrice, products } from "@/lib/products";

export default function Home({ searchParams }: PageProps<"/">) {
  const incoming = searchParams.then((params) => (typeof params.ref === "string" ? params.ref : undefined));

  return (
    <>
      <Suspense fallback={null}>
        <ReferralBanner incoming={incoming} />
      </Suspense>

      <section className="border-b border-rule">
        <Container className="py-14 lg:py-20">
          <h1 className="max-w-[18ch] text-4xl font-bold sm:text-5xl">Expert Advisor untuk MetaTrader 5</h1>
          <p className="mt-6 max-w-[58ch] text-lg text-ink-soft">
            Setiap EA dilisensikan per nomor akun MT5. Setelah membeli, daftarkan nomor akun Anda di{" "}
            {sites.portal.name} dan EA akan aktif di akun itu.
          </p>
        </Container>
      </section>

      <section id="produk" className="scroll-mt-6">
        <Container className="py-14">
          <h2 className="text-3xl font-bold">Produk</h2>
          <ul className="mt-8 border-t border-ink">
            {products.map((product) => (
              <li key={product.slug} className="grid gap-x-8 gap-y-3 border-b border-rule py-7 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <h3 className="text-2xl font-bold">
                    <Link href={`/produk/${product.slug}`} className="no-underline hover:underline">
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-2 max-w-[62ch] text-ink-soft">{product.summary}</p>
                </div>
                <div className="flex flex-wrap items-center gap-5 md:justify-end">
                  <span className={product.priceIdr === null ? "text-ink-soft" : "text-xl font-semibold"}>{formatPrice(product.priceIdr)}</span>
                  <ButtonLink href={`/produk/${product.slug}`} tone="quiet">
                    Lihat detail
                  </ButtonLink>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {(sites.edukasi.url || sites.portal.url) && (
        <section className="border-t border-rule bg-surface">
          <Container className="grid gap-8 py-12 md:grid-cols-2">
            {sites.edukasi.url && (
              <div>
                <h2 className="text-2xl font-bold">Belum paham cara kerjanya?</h2>
                <p className="mt-3 max-w-[48ch] text-ink-soft">
                  EA hanya alat. Pelajari dulu struktur pasar dan manajemen risiko sebelum menjalankannya di akun riil.
                </p>
                <ButtonLink href={sites.edukasi.url} tone="quiet" className="mt-5">
                  Buka {sites.edukasi.name}
                </ButtonLink>
              </div>
            )}
            {sites.portal.url && (
              <div>
                <h2 className="text-2xl font-bold">Sudah membeli?</h2>
                <p className="mt-3 max-w-[48ch] text-ink-soft">
                  Daftarkan nomor akun MT5 dan nama server broker Anda supaya lisensinya aktif.
                </p>
                <ButtonLink href={sites.portal.url} className="mt-5">
                  Daftarkan akun MT5
                </ButtonLink>
              </div>
            )}
          </Container>
        </section>
      )}
    </>
  );
}
