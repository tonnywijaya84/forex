"use client";

import { useActionState } from "react";
import { Button } from "@forex/ui";
import { requestLoginLink } from "@/app/masuk/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(requestLoginLink, null);
  return (
    <form action={formAction} className="max-w-md">
      <label htmlFor="email" className="block font-medium">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="nama@contoh.com"
        className="mt-2 block w-full rounded-sm border border-ink bg-surface px-3 py-2.5"
      />
      <Button type="submit" disabled={pending} className="mt-5">
        {pending ? "Mengirim tautan" : "Kirim tautan masuk"}
      </Button>
      <p aria-live="polite" className={`mt-4 min-h-6 ${state?.ok ? "text-bull-deep" : "text-bear-deep"}`}>
        {state?.message}
      </p>
    </form>
  );
}
