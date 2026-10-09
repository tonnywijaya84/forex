import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@forex/ui";
import { formatDate, getArticles } from "@/lib/news";

export const metadata: Metadata = {
  title: "Berita",
  description: "Kabar terbaru dari Kelas Forex: materi baru, pengumuman, dan catatan pasar.",
};

export default function NewsIndex() {
  const articles = getArticles();

  return (
    <Container className="py-12">
      <h1 className="text-4xl font-bold sm:text-5xl">Berita</h1>
      <p className="mt-5 max-w-[60ch] text-lg text-ink-soft">
        Materi baru, pengumuman, dan catatan pasar. Yang terbaru ada di atas.
      </p>
      {articles.length === 0 ? (
        <p className="mt-10 border-t border-ink pt-6 text-ink-soft">Belum ada berita yang terbit.</p>
      ) : (
        <ul className="mt-10 border-t border-ink">
          {articles.map((article) => (
            <li key={article.slug} className="grid gap-x-8 gap-y-2 border-b border-rule py-6 sm:grid-cols-[10rem_1fr]">
              <p className="text-sm text-ink-soft sm:pt-1.5">
                <time dateTime={article.date}>{formatDate(article.date)}</time>
                {article.category && (
                  <>
                    <span className="sm:hidden"> · </span>
                    <span className="sm:block">{article.category}</span>
                  </>
                )}
              </p>
              <div>
                <h2 className="text-2xl font-semibold">
                  <Link href={`/berita/${article.slug}`} className="hover:underline">
                    {article.title}
                  </Link>
                </h2>
                <p className="mt-2 max-w-[62ch] text-ink-soft">{article.summary}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
