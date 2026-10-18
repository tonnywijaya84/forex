"use client";

import Link from "next/link";
import { startTransition, useActionState, useId, type FormEvent, type ReactNode } from "react";
import { Button } from "@forex/ui";
import { setPassword } from "@/app/atur-sandi/actions";
import { signUp } from "@/app/daftar/actions";
import { requestPasswordReset } from "@/app/lupa-sandi/actions";
import { signIn } from "@/app/masuk/actions";
import type { FormState } from "@/lib/form-state";

const field = "mt-2 block w-full rounded-sm border border-ink bg-surface px-3 py-2.5";

type Action = (previous: FormState, formData: FormData) => Promise<FormState>;

/**
 * Kerangka formulir login. Dikirim lewat onSubmit, bukan prop `action`: React mengosongkan formulir setelah
 * `action` selesai, sehingga email yang sudah diketik akan hilang saat ada pesan kesalahan.
 */
function AuthForm({ action, submit, pendingLabel, children }: { action: Action; submit: string; pendingLabel: string; children: ReactNode }) {
  const [state, dispatch, pending] = useActionState(action, null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-md gap-5">
      {children}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? pendingLabel : submit}
        </Button>
        <p aria-live="polite" className={`mt-4 min-h-6 ${state?.ok ? "text-bull-deep" : "text-bear-deep"}`}>
          {state?.message}
        </p>
      </div>
    </form>
  );
}

// Id dibuat dengan useId: Next menyimpan halaman sebelumnya secara tersembunyi, sehingga id tetap bisa bentrok
// antara formulir Masuk dan Daftar bila ditulis manual.
function EmailField() {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block font-medium">
        Email
      </label>
      <input id={id} name="email" type="email" required autoComplete="email" placeholder="nama@contoh.com" className={field} />
    </div>
  );
}

/** Kata sandi baru beserta ketikan ulangnya. */
function NewPasswordFields() {
  const id = useId();
  return (
    <>
      <div>
        <label htmlFor={`${id}-password`} className="block font-medium">
          Kata sandi
        </label>
        <input
          id={`${id}-password`}
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          aria-describedby={`${id}-hint`}
          className={field}
        />
        <p id={`${id}-hint`} className="mt-2 text-sm text-ink-soft">
          Minimal 8 karakter.
        </p>
      </div>
      <div>
        <label htmlFor={`${id}-confirm`} className="block font-medium">
          Ketik ulang kata sandi
        </label>
        <input id={`${id}-confirm`} name="password_confirm" type="password" required minLength={8} autoComplete="new-password" className={field} />
      </div>
    </>
  );
}

export function LoginForm() {
  const id = useId();
  return (
    <AuthForm action={signIn} submit="Masuk" pendingLabel="Memeriksa">
      <EmailField />
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <label htmlFor={id} className="block font-medium">
            Kata sandi
          </label>
          <Link href="/lupa-sandi" className="text-sm underline">
            Lupa kata sandi?
          </Link>
        </div>
        <input id={id} name="password" type="password" required autoComplete="current-password" className={field} />
      </div>
    </AuthForm>
  );
}

export function SignUpForm() {
  return (
    <AuthForm action={signUp} submit="Daftar" pendingLabel="Mendaftarkan">
      <EmailField />
      <NewPasswordFields />
    </AuthForm>
  );
}

export function ResetRequestForm() {
  return (
    <AuthForm action={requestPasswordReset} submit="Kirim tautan" pendingLabel="Mengirim tautan">
      <EmailField />
    </AuthForm>
  );
}

export function NewPasswordForm() {
  return (
    <AuthForm action={setPassword} submit="Simpan kata sandi" pendingLabel="Menyimpan">
      <NewPasswordFields />
    </AuthForm>
  );
}
