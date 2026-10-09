import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { sites, type SiteKey } from "./sites";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Container({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cx("mx-auto w-full max-w-6xl px-5 sm:px-8", className)} {...props} />;
}

type NavItem = { href: string; label: string };

/** Kepala halaman: nama situs, navigasi dalam situs, dan tautan ke dua situs lainnya. */
export function SiteHeader({ site, nav = [] }: { site: SiteKey; nav?: NavItem[] }) {
  const others = (Object.keys(sites) as SiteKey[]).filter((key) => key !== site);
  return (
    <header className="border-b border-rule bg-paper">
      <Container className="flex flex-wrap items-center gap-x-8 gap-y-2 py-4">
        <Link href="/" className="font-display text-xl font-bold no-underline [font-variation-settings:'wdth'_82]">
          {sites[site].name}
        </Link>
        {nav.length > 0 && (
          <nav aria-label="Navigasi utama" className="flex flex-wrap gap-x-6 gap-y-1">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="py-1 no-underline hover:underline">
                {item.label}
              </Link>
            ))}
          </nav>
        )}
        <nav aria-label="Situs terkait" className="ml-auto flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
          {others.map((key) => (
            <a key={key} href={sites[key].url} className="py-1 no-underline hover:underline">
              {sites[key].name}
            </a>
          ))}
        </nav>
      </Container>
    </header>
  );
}

/** Kaki halaman dengan peringatan risiko yang sama di ketiga situs. */
export function SiteFooter({ site }: { site: SiteKey }) {
  return (
    <footer className="mt-auto border-t border-rule">
      <Container className="grid gap-6 py-10 text-sm text-ink-soft md:grid-cols-[2fr_1fr]">
        <p className="max-w-[68ch]">
          Trading forex dan instrumen berleverage berisiko tinggi dan dapat menghabiskan seluruh modal. Materi
          dan perangkat di situs ini bersifat edukatif, bukan nasihat keuangan, dan hasil masa lalu tidak
          menjamin hasil berikutnya.
        </p>
        <p className="md:text-right">
          {sites[site].name}
          <br />
          {sites[site].tagline}
        </p>
      </Container>
    </footer>
  );
}

const buttonBase =
  "inline-flex items-center justify-center rounded-sm px-5 py-2.5 font-medium no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const buttonTone = {
  primary: "bg-mark text-ink hover:bg-ink hover:text-paper",
  quiet: "border border-ink text-ink hover:bg-ink hover:text-paper",
};

type Tone = keyof typeof buttonTone;

export function Button({ tone = "primary", className, ...props }: ComponentPropsWithoutRef<"button"> & { tone?: Tone }) {
  return <button className={cx(buttonBase, buttonTone[tone], className)} {...props} />;
}

export function ButtonLink({ tone = "primary", className, ...props }: ComponentPropsWithoutRef<"a"> & { tone?: Tone }) {
  return <a className={cx(buttonBase, buttonTone[tone], className)} {...props} />;
}

/** Kotak catatan untuk status yang perlu diketahui pengguna, misalnya fitur yang belum tersambung. */
export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-l-4 border-mark bg-surface px-5 py-4">
      <p className="font-medium">{title}</p>
      <div className="mt-1 text-ink-soft">{children}</div>
    </div>
  );
}
