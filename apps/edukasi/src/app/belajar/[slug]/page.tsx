import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@forex/ui";
import { getLesson, getLessons } from "@/lib/lessons";

export function generateStaticParams() {
  return getLessons()
    .filter((lesson) => lesson.published)
    .map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({ params }: PageProps<"/belajar/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLesson(slug);
  return lesson ? { title: `Sesi ${lesson.session}: ${lesson.title}`, description: lesson.summary } : {};
}

export default async function LessonPage({ params }: PageProps<"/belajar/[slug]">) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson || !lesson.published) notFound();

  const lessons = getLessons().filter((item) => item.published);
  const position = lessons.findIndex((item) => item.slug === lesson.slug);
  const previous = lessons[position - 1];
  const next = lessons[position + 1];

  return (
    <Container className="py-12">
      <p className="text-ink-soft">
        <Link href="/#silabus">Silabus</Link> / Sesi {lesson.session}
      </p>
      <h1 className="mt-4 max-w-[22ch] text-4xl font-bold sm:text-5xl">{lesson.title}</h1>
      <p className="mt-5 max-w-[60ch] text-lg text-ink-soft">{lesson.summary}</p>
      {/* Isi berasal dari file Markdown milik repo ini, bukan dari input pengguna. */}
      <article className="lesson mt-10 max-w-[68ch]" dangerouslySetInnerHTML={{ __html: lesson.html }} />
      <nav aria-label="Sesi lain" className="mt-14 flex flex-wrap justify-between gap-4 border-t border-rule pt-6">
        {previous ? <Link href={`/belajar/${previous.slug}`}>Sebelumnya: {previous.title}</Link> : <span />}
        {next ? <Link href={`/belajar/${next.slug}`}>Berikutnya: {next.title}</Link> : <Link href="/#silabus">Kembali ke silabus</Link>}
      </nav>
    </Container>
  );
}
