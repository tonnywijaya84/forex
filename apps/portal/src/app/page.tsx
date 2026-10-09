import { ButtonLink, Container } from "@forex/ui";

const steps = [
  { title: "Masuk dengan email", body: "Kami kirim tautan masuk ke email Anda. Tidak perlu kata sandi." },
  { title: "Daftarkan akun MT5", body: "Isi nomor akun dan nama server broker, lalu pilih EA yang Anda beli." },
  { title: "Pasang EA setelah lisensi aktif", body: "EA memeriksa lisensi ke portal ini setiap kali dijalankan di akun tersebut." },
];

export default function Home() {
  return (
    <>
      <section className="border-b border-rule">
        <Container className="py-14 lg:py-20">
          <h1 className="max-w-[20ch] text-4xl font-bold sm:text-5xl">Aktifkan EA di akun MT5 Anda</h1>
          <p className="mt-6 max-w-[58ch] text-lg text-ink-soft">
            Lisensi EA terikat pada nomor akun MT5. Daftarkan akun Anda di sini, dan EA hanya akan berjalan di akun
            yang terdaftar dan aktif.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/akun">Daftarkan akun MT5</ButtonLink>
            <ButtonLink href="/masuk" tone="quiet">
              Masuk
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-14">
          <h2 className="text-3xl font-bold">Tiga langkah</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="border-t border-ink pt-4">
                <span className="font-display text-2xl font-bold text-ink-soft [font-variation-settings:'wdth'_80]">{index + 1}</span>
                <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 max-w-[68ch] text-ink-soft">
            Nomor akun dan nama server terlihat di MetaTrader 5 pada menu File, lalu Login to Trade Account.
          </p>
        </Container>
      </section>
    </>
  );
}
