"use client";

import Link from "next/link";
import { startTransition, useActionState, type FormEvent } from "react";
import { Button } from "@forex/ui";
import { saveProfile } from "@/app/profil/actions";

const field = "mt-2 block w-full rounded-sm border border-ink bg-surface px-3 py-2.5";

export type ProfileValues = {
  fullName: string;
  phone: string;
  city: string;
  telegram: string;
  birthDate: string;
};

/** Formulir data diri. `initial` kosong untuk pengguna yang belum pernah mengisi. */
export function ProfileForm({ initial }: { initial: ProfileValues }) {
  const [state, save, pending] = useActionState(saveProfile, null);

  // Dikirim lewat onSubmit, bukan prop `action`: React mengosongkan formulir setelah `action` selesai,
  // sehingga isian yang ditolak akan hilang dan harus diketik ulang.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => save(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-3xl gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="full_name" className="block font-medium">
          Nama lengkap
        </label>
        <input id="full_name" name="full_name" required maxLength={100} autoComplete="name" defaultValue={initial.fullName} className={field} />
      </div>
      <div>
        <label htmlFor="phone" className="block font-medium">
          Nomor telepon atau WhatsApp
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          maxLength={24}
          autoComplete="tel"
          placeholder="0812 3456 7890"
          defaultValue={initial.phone}
          className={field}
        />
      </div>
      <div>
        <label htmlFor="birth_date" className="block font-medium">
          Tanggal lahir
        </label>
        <input id="birth_date" name="birth_date" type="date" required autoComplete="bday" defaultValue={initial.birthDate} className={field} />
      </div>
      <div>
        <label htmlFor="city" className="block font-medium">
          Kota domisili
        </label>
        <input id="city" name="city" required maxLength={80} autoComplete="address-level2" placeholder="Jakarta" defaultValue={initial.city} className={field} />
      </div>
      <div>
        <label htmlFor="telegram" className="block font-medium">
          Username Telegram <span className="font-normal text-ink-soft">(boleh kosong)</span>
        </label>
        <input id="telegram" name="telegram" maxLength={33} placeholder="@nama_anda" defaultValue={initial.telegram} className={field} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan data diri" : "Simpan data diri"}
        </Button>
        <p aria-live="polite" className={`mt-4 min-h-6 ${state?.ok ? "text-bull-deep" : "text-bear-deep"}`}>
          {state?.message}
          {state?.ok && (
            <>
              {" "}
              <Link href="/akun" className="underline">
                Lanjut ke Akun MT5 saya
              </Link>
            </>
          )}
        </p>
      </div>
    </form>
  );
}
