import type { Metadata } from "next";
import { SiteFooter, SiteHeader, sites } from "@forex/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: sites.portal.name, template: `%s | ${sites.portal.name}` },
  description: "Daftarkan nomor akun MT5 Anda untuk mengaktifkan lisensi Expert Advisor.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader site="portal" nav={[{ href: "/akun", label: "Akun MT5 saya" }]} />
        <main>{children}</main>
        <SiteFooter site="portal" />
      </body>
    </html>
  );
}
