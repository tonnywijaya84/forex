import Link from "next/link";
import { ButtonLink, Container, sites } from "@forex/ui";
import { StructureChart } from "@/components/structure-chart";
import { getLessons } from "@/lib/lessons";

export default function Home() {
  const lessons = getLessons();
  const first = lessons.find((lesson) => lesson.published);

  return (
    <>
      <section className="border-b border-rule">
        <Container className="grid items-center gap-10 py-14 lg:grid-cols-[5fr_7fr] lg:py-20">
          <div>
            <h1 className="text-4xl font-bold sm:text-5xl">Baca struktur pasar sebelum menekan tombol buy</h1>
            <p className="mt-6 max-w-[46ch] text-lg text-ink-soft">
              Sepuluh sesi yang berurutan, dari market structure sampai manajemen risiko. Tanpa sinyal, tanpa
              janji profit: hanya cara membaca chart dan mengukur risiko.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {first && <ButtonLink href={`/belajar/${first.slug}`}>Mulai dari Sesi {first.session}</ButtonLink>}
              <ButtonLink href="#silabus" tone="quiet">
                Lihat silabus
              </ButtonLink>
            </div>
          </div>
          <div className="bg-surface p-4 sm:p-6">
            <StructureChart />
          </div>
        </Container>
      </section>

      <section id="silabus" className="scroll-mt-6">
        <Container className="py-14">
          <h2 className="text-3xl font-bold">Silabus</h2>
          <p className="mt-3 max-w-[60ch] text-ink-soft">
            Ikuti berurutan. Setiap sesi memakai istilah dari sesi sebelumnya.
          </p>
          <ol className="mt-8 border-t border-ink">
            {lessons.map((lesson) => (
              <li key={lesson.slug} className="grid grid-cols-[3rem_1fr] gap-x-4 border-b border-rule py-5 sm:grid-cols-[4rem_1fr_auto] sm:items-baseline">
                <span className="font-display text-2xl font-bold text-ink-soft [font-variation-settings:'wdth'_80]">{lesson.session}</span>
                <div>
                  <h3 className="text-xl font-semibold">
                    {lesson.published ? <Link href={`/belajar/${lesson.slug}`}>{lesson.title}</Link> : lesson.title}
                  </h3>
                  <p className="mt-1 max-w-[62ch] text-ink-soft">{lesson.summary}</p>
                </div>
                <span className={`col-start-2 mt-2 text-sm sm:col-start-3 sm:mt-0 ${lesson.published ? "text-bull-deep" : "text-ink-soft"}`}>
                  {lesson.published ? "Tersedia" : "Sedang ditulis"}
                </span>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {sites.portal.url && (
        <section className="border-t border-rule bg-surface">
          <Container className="flex flex-wrap items-center justify-between gap-6 py-10">
            <p className="max-w-[52ch]">
              Sudah memakai Expert Advisor kami? Daftarkan nomor akun MT5 Anda supaya lisensinya aktif.
            </p>
            <ButtonLink href={sites.portal.url} tone="quiet">
              Buka {sites.portal.name}
            </ButtonLink>
          </Container>
        </section>
      )}
    </>
  );
}
