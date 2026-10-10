"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import type { StoredStatus } from "@forex/license";
import { Button } from "@forex/ui";
import { setLicense } from "@/app/admin/actions";

const field = "mt-1 block h-12 rounded-sm border border-ink bg-surface px-3";

type Props = {
  id: string;
  accountNumber: number;
  status: StoredStatus;
  /** Tanggal TTTT-BB-HH menurut WIB, atau teks kosong bila tanpa batas waktu. */
  expiresOn: string;
  options: { value: StoredStatus; label: string }[];
};

/** Formulir admin untuk satu lisensi: status dan tanggal berlaku. */
export function LicenseForm({ id, accountNumber, status, expiresOn, options }: Props) {
  const [state, save, pending] = useActionState(setLicense, null);
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [selectedDate, setSelectedDate] = useState(expiresOn);

  // Dikirim lewat onSubmit, bukan prop `action`: React mengosongkan formulir setelah `action` selesai,
  // dan pilihan status akan kembali ke pilihan pertama walau yang tersimpan berbeda.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => save(formData));
  }

  return (
    <form onSubmit={handleSubmit} aria-label={`Lisensi akun ${accountNumber}`}>
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={`status-${id}`} className="block text-sm font-medium">
            Status
          </label>
          <select
            id={`status-${id}`}
            name="status"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value as StoredStatus)}
            className={field}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`expires-${id}`} className="block text-sm font-medium">
            Berlaku sampai
          </label>
          <input
            id={`expires-${id}`}
            name="expires_on"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className={field}
          />
        </div>
        <Button type="submit" disabled={pending} className="h-12 min-w-32">
          {pending ? "Menyimpan" : "Simpan"}
        </Button>
      </div>
      {/* Lebar nol supaya pesan panjang tidak melebarkan kolom formulir; min-w-full membuatnya tetap selebar formulir. */}
      <p aria-live="polite" className={`mt-2 min-h-6 w-0 min-w-full text-sm ${state?.ok ? "text-bull-deep" : "text-bear-deep"}`}>
        {state?.message}
      </p>
    </form>
  );
}
