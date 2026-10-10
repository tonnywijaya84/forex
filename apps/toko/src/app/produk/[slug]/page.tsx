import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, Container, Notice, sites } from "@forex/ui";
import { FreeAccessPanel } from "@/components/free-access-panel";
import { getProduct, priceLabel, products } from "@/lib/products";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/produk/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  return product ? { title: product.name, description: product.summary } : {};
}

export default async function ProductPage({ params }: PageProps<"/produk/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const isFree = product.access === "free_with_referral";
  const price = priceLabel(product);

  return (
    <Container className="py-12">
      <p className="text-ink-soft">
        <Link href="/#produk">Produk</Link> / {product.name}
      </p>
      <div className="mt-4 grid gap-12 lg:grid-cols-[3fr_2fr]">
        <div>
          <h1 className="text-4xl font-bold sm:text-5xl">{product.name}</h1>
          <p className="mt-5 max-w-[58ch] text-lg text-ink-soft">{product.summary}</p>
          <h2 className="mt-10 text-2xl font-bold">Yang dilakukan EA ini</h2>
          <ul className="mt-4 max-w-[60ch] list-disc space-y-2 pl-5">
            {product.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <h2 className="mt-10 text-2xl font-bold">{isFree ? "Cara mendapatkannya" : "Setelah membeli"}</h2>
          <ol className="mt-4 max-w-[60ch] list-decimal space-y-2 pl-5">
            {isFree && <li>Buka akun trading di broker mitra lewat tautan referral di halaman ini.</li>}
            <li>Masuk ke {sites.portal.name} dengan email Anda.</li>
            <li>Daftarkan nomor akun MT5 dan nama server broker untuk EA ini.</li>
            <li>
              {isFree ? "Setelah akun dicek memenuhi syarat dan lisensi diaktifkan" : "Setelah lisensi diaktifkan"}, pasang
              EA di chart akun tersebut.
            </li>
          </ol>
        </div>
        <aside className="self-start border-t-4 border-ink bg-surface p-6">
          <p className="text-sm text-ink-soft">Lisensi per akun MT5</p>
          {price && <p className="mt-1 font-display text-3xl font-bold">{price}</p>}
          {isFree ? (
            <FreeAccessPanel />
          ) : (
            <div className="mt-6">
              <Notice title="Pembayaran belum tersambung">
                Checkout akan tersedia di halaman ini setelah payment gateway dipasang.
              </Notice>
            </div>
          )}
          {sites.portal.url && (
            <ButtonLink href={sites.portal.url} tone="quiet" className="mt-6 w-full">
              Buka {sites.portal.name}
            </ButtonLink>
          )}
        </aside>
      </div>
    </Container>
  );
}
