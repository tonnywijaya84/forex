import type { Metadata } from "next";
import { SiteFooter, SiteHeader, sites } from "@forex/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: sites.edukasi.name, template: `%s | ${sites.edukasi.name}` },
  description: "Sepuluh sesi belajar forex: dari market structure sampai manajemen risiko.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader site="edukasi" nav={[{ href: "/#silabus", label: "Silabus" }]} />
        <main>{children}</main>
        <SiteFooter site="edukasi" />
      </body>
    </html>
  );
}
