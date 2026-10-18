import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Halaman yang boleh dituju setelah menukar kode. Selain ini, tujuan diabaikan supaya tautan tidak bisa dibelokkan. */
const NEXT_PATHS = ["/akun", "/atur-sandi"];

/**
 * Tujuan tautan email dari template bawaan Supabase: menukar kode dengan sesi, lalu membuka halaman tujuan.
 * Template portal sendiri memakai /auth/confirm; route ini tetap ada untuk email yang memakai template bawaan.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");
  const destination = next && NEXT_PATHS.includes(next) ? next : "/akun";
  const supabase = await createClient();
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destination, request.url));
  }
  return NextResponse.redirect(new URL("/masuk?gagal=1", request.url));
}
