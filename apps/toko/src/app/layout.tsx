import type { Metadata } from "next";
import { SiteFooter, SiteHeader, sites } from "@forex/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: sites.toko.name, template: `%s | ${sites.toko.name}` },
  description: "Expert Advisor untuk MetaTrader 5, dilisensikan per nomor akun.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader site="toko" nav={[{ href: "/#produk", label: "Produk" }]} />
        <main>{children}</main>
        <SiteFooter site="toko" />
      </body>
    </html>
  );
}
