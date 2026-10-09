import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@forex/ui";
import { StoreMention } from "@/components/store-mention";
import { formatDate, getArticle, getArticles } from "@/lib/news";

/** Alamat pengganti saat belum ada berita: Cache Components mewajibkan minimal satu parameter. */
const EMPTY_SLUG = "belum-ada-berita";

export function generateStaticParams() {
  const params = getArticles().map((article) => ({ slug: article.slug }));
  return params.length > 0 ? params : [{ slug: EMPTY_SLUG }];
}

export async function generateMetadata({ params }: PageProps<"/berita/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  return article ? { title: article.title, description: article.summary } : {};
}

export default async function ArticlePage({ params }: PageProps<"/berita/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const articles = getArticles();
  const position = articles.findIndex((item) => item.slug === article.slug);
  const newer = articles[position - 1];
  const older = articles[position + 1];

  return (
    <Container className="py-12">
      <p className="text-ink-soft">
        <Link href="/berita">Berita</Link> / <time dateTime={article.date}>{formatDate(article.date)}</time>
        {article.category && ` / ${article.category}`}
      </p>
      <h1 className="mt-4 max-w-[26ch] text-4xl font-bold sm:text-5xl">{article.title}</h1>
      <p className="mt-5 max-w-[60ch] text-lg text-ink-soft">{article.summary}</p>
      {/* Isi berasal dari file Markdown milik repo ini, bukan dari input pengguna. */}
      <article className="lesson mt-10 max-w-[68ch]" dangerouslySetInnerHTML={{ __html: article.html }} />
      <StoreMention />
      <nav aria-label="Berita lain" className="mt-14 flex flex-wrap justify-between gap-4 border-t border-rule pt-6">
        {older ? <Link href={`/berita/${older.slug}`}>Lebih lama: {older.title}</Link> : <span />}
        {newer ? <Link href={`/berita/${newer.slug}`}>Lebih baru: {newer.title}</Link> : <Link href="/berita">Semua berita</Link>}
      </nav>
    </Container>
  );
}
