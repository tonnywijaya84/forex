import { ButtonLink, Container } from "@forex/ui";

export default function NotFound() {
  return (
    <Container className="py-20">
      <h1 className="text-4xl font-bold">Halaman tidak ditemukan</h1>
      <p className="mt-4 max-w-[52ch] text-ink-soft">Alamat ini tidak ada di portal.</p>
      <ButtonLink href="/" className="mt-8">
        Kembali ke beranda portal
      </ButtonLink>
    </Container>
  );
}
