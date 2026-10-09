import { ButtonLink, Container } from "@forex/ui";

export default function NotFound() {
  return (
    <Container className="py-20">
      <h1 className="text-4xl font-bold">Halaman tidak ditemukan</h1>
      <p className="mt-4 max-w-[52ch] text-ink-soft">
        Alamat ini tidak ada, atau sesi yang Anda cari belum diterbitkan.
      </p>
      <ButtonLink href="/#silabus" className="mt-8">
        Lihat silabus
      </ButtonLink>
    </Container>
  );
}
