"use client";

import { useActionState } from "react";
import { Button } from "@forex/ui";
import { addAccount } from "@/app/akun/actions";

const field = "mt-2 block w-full rounded-sm border border-ink bg-surface px-3 py-2.5";

export function AddAccountForm({ eas }: { eas: { id: string; name: string }[] }) {
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
          Server broker
        </label>
        <input id="broker_server" name="broker_server" required maxLength={64} placeholder="Exness-MT5Real26" className={field} />
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
