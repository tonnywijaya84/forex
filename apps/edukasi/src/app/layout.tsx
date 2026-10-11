import type { Metadata } from "next";
import Image from "next/image";
import { SiteFooter, SiteHeader, sites } from "@forex/ui";
import logo from "@/assets/fxspot-logo.png";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: sites.edukasi.name, template: `%s | ${sites.edukasi.name}` },
  description: "Sepuluh sesi belajar forex: dari market structure sampai manajemen risiko.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader
          site="edukasi"
          // Logonya sudah berupa tulisan "fxspot", jadi nama situs tidak ditulis lagi di sebelahnya.
          logo={<Image src={logo} alt="" loading="eager" sizes="144px" className="h-11 w-auto" />}
          hideName
          nav={[
            { href: "/#silabus", label: "Silabus" },
            { href: "/berita", label: "Berita" },
          ]}
        />
        <main>{children}</main>
        <SiteFooter site="edukasi" />
      </body>
    </html>
  );
}
