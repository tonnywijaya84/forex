import { ButtonLink, Notice } from "@forex/ui";
import { freeAccessTerms, getListedBrokers } from "@/lib/referral-program";

/** Syarat EA gratis dan tautan pendaftaran broker mitra, untuk kolom samping halaman produk. */
export function FreeAccessPanel() {
  const brokers = getListedBrokers();

  return (
    <>
      {!freeAccessTerms.isFinal && (
        <div className="mt-6">
          <Notice title="Syarat masih contoh">Syarat di bawah ini belum final dan belum berlaku.</Notice>
        </div>
      )}
      <h2 className="mt-6 font-semibold">Syarat</h2>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-ink-soft">
        {freeAccessTerms.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {brokers.length > 0 ? (
        <div className="mt-6 grid gap-3">
          {brokers.map((broker) => (
            <ButtonLink key={broker.code} href={broker.referralUrl} rel="sponsored" className="w-full">
              Buka akun di {broker.name}
            </ButtonLink>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-ink-soft">Tautan pendaftaran broker mitra belum tersedia.</p>
      )}
      <p className="mt-4 text-sm text-ink-soft">
        Kami menerima komisi dari broker mitra untuk akun yang dibuka lewat tautan referral ini.
      </p>
    </>
  );
}
