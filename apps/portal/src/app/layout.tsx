import type { Metadata } from "next";
import Image from "next/image";
import { SiteFooter, SiteHeader, sites } from "@forex/ui";
import logo from "@/assets/dewa-pips-logo.png";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: sites.portal.name, template: `%s | ${sites.portal.name}` },
  description: "Daftarkan nomor akun MT5 Anda untuk mengaktifkan lisensi Expert Advisor.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" data-theme="mono" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader
          site="portal"
          nav={[{ href: "/akun", label: "Akun MT5 saya" }]}
          // Hiasan: nama situs tertulis tepat di sebelahnya.
          logo={<Image src={logo} alt="" width={40} height={40} className="size-10" />}
        />
        <main>{children}</main>
        <SiteFooter site="portal" />
      </body>
    </html>
  );
}
