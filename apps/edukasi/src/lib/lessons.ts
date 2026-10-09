import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { figures } from "./figures";

/**
 * Materi disimpan sebagai file Markdown di `content/sesi`.
 * Menambah sesi = menambah satu file; tidak ada database.
 */
export type Lesson = {
  slug: string;
  session: number;
  title: string;
  summary: string;
  /** false berarti judul sudah diumumkan tetapi isinya belum ditulis. */
  published: boolean;
  html: string;
};

const dir = join(process.cwd(), "content", "sesi");

/** Mengganti baris `<!-- gambar: nama -->` di Markdown dengan gambar dari `figures.ts`. */
function withFigures(html: string, file: string): string {
  return html.replace(/<!--\s*gambar:\s*([a-z0-9-]+)\s*-->/g, (_marker, name: string) => {
    const figure = figures[name];
    if (!figure) throw new Error(`Gambar "${name}" di ${file} tidak ada di src/lib/figures.ts.`);
    return figure;
  });
}

function load(): Lesson[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const { data, content } = matter(readFileSync(join(dir, file), "utf8"));
      if (typeof data.title !== "string" || typeof data.session !== "number" || typeof data.summary !== "string") {
        throw new Error(`Frontmatter ${file} harus punya title, session, dan summary.`);
      }
      return {
        slug: file.replace(/\.md$/, ""),
        session: data.session,
        title: data.title,
        summary: data.summary,
        published: data.published !== false && content.trim().length > 0,
        html: withFigures(marked.parse(content, { async: false }), file),
      };
    })
    .sort((a, b) => a.session - b.session);
}

// Dibaca sekali saat modul dimuat: isi file sama untuk setiap permintaan.
const lessons = load();

/** Ajakan ke toko EA tampil di halaman materi mulai sesi ini. Sesi sebelumnya murni materi. */
export const STORE_CTA_FROM_SESSION = 4;

export function showsStoreCta(lesson: Pick<Lesson, "session">): boolean {
  return lesson.session >= STORE_CTA_FROM_SESSION;
}

export function getLessons(): Lesson[] {
  return lessons;
}

export function getLesson(slug: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.slug === slug);
}
