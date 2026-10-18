"use client";

import { useActionState } from "react";
import { Button } from "@forex/ui";
import { addAccount } from "@/app/akun/actions";

const field = "mt-2 block w-full rounded-sm border border-ink bg-surface px-3 py-2.5";

/** `brokers` berisi nama broker dari packages/license; dikirim dari halaman server supaya kode lisensi tidak ikut ke peramban. */
export function AddAccountForm({ eas, brokers }: { eas: { id: string; name: string }[]; brokers: string[] }) {
  const [state, formAction, pending] = useActionState(addAccount, null);
  return (
    <form action={formAction} className="grid max-w-3xl gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="account_number" className="block font-medium">
          Nomor akun MT5
        </label>
        <input id="account_number" name="account_number" inputMode="numeric" pattern="[0-9]{1,15}" required placeholder="276170008" className={field} />
      </div>
      <div>
        <label htmlFor="broker_server" className="block font-medium">
          Broker
        </label>
        <select id="broker_server" name="broker_server" required defaultValue={brokers.length === 1 ? brokers[0] : ""} className={field}>
          {brokers.length !== 1 && (
            <option value="" disabled>
              Pilih broker
            </option>
          )}
          {brokers.map((broker) => (
            <option key={broker} value={broker}>
              {broker}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="ea_id" className="block font-medium">
          EA
        </label>
        <select id="ea_id" name="ea_id" required defaultValue="" className={field}>
          <option value="" disabled>
            Pilih EA
          </option>
          {eas.map((ea) => (
            <option key={ea.id} value={ea.id}>
              {ea.name}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan akun" : "Daftarkan akun"}
        </Button>
        <p aria-live="polite" className={`mt-4 min-h-6 ${state?.ok ? "text-bull-deep" : "text-bear-deep"}`}>
          {state?.message}
        </p>
      </div>
    </form>
  );
}
