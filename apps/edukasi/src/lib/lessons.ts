import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

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
        html: marked.parse(content, { async: false }),
      };
    })
    .sort((a, b) => a.session - b.session);
}

// Dibaca sekali saat modul dimuat: isi file sama untuk setiap permintaan.
const lessons = load();

export function getLessons(): Lesson[] {
  return lessons;
}

export function getLesson(slug: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.slug === slug);
}
