import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

/**
 * Berita disimpan sebagai file Markdown di `content/berita`.
 * Nama file menjadi alamat artikel, jadi awali dengan tanggal: `2026-10-09-judul-singkat.md`.
 */
export type Article = {
  slug: string;
  title: string;
  /** Tanggal terbit dalam bentuk YYYY-MM-DD. */
  date: string;
  summary: string;
  category: string | null;
  /** false berarti artikel masih draf dan tidak tampil di situs. */
  published: boolean;
  html: string;
};

const dir = join(process.cwd(), "content", "berita");

/** YAML membaca `date: 2026-10-09` sebagai Date, sedangkan yang diberi tanda kutip sebagai teks. */
function toIsoDate(value: unknown): string | null {
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : typeof value === "string" ? value : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(text)) ? text : null;
}

function load(): Article[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const { data, content } = matter(readFileSync(join(dir, file), "utf8"));
      const date = toIsoDate(data.date);
      if (typeof data.title !== "string" || typeof data.summary !== "string" || !date) {
        throw new Error(`Frontmatter ${file} harus punya title, summary, dan date berbentuk YYYY-MM-DD.`);
      }
      return {
        slug: file.replace(/\.md$/, ""),
        title: data.title,
        date,
        summary: data.summary,
        category: typeof data.category === "string" ? data.category : null,
        published: data.published !== false && content.trim().length > 0,
        html: marked.parse(content, { async: false }),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

// Dibaca sekali saat modul dimuat: isi file sama untuk setiap permintaan.
const articles = load();

/** Artikel yang sudah terbit, dari yang terbaru. */
export function getArticles(): Article[] {
  return articles.filter((article) => article.published);
}

export function getArticle(slug: string): Article | undefined {
  return getArticles().find((article) => article.slug === slug);
}

const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "UTC" });

/** "2026-10-09" menjadi "9 Oktober 2026". */
export function formatDate(date: string): string {
  return dateFormat.format(new Date(`${date}T00:00:00Z`));
}
