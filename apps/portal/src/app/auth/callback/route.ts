import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Tujuan tautan masuk dari email: menukar kode dengan sesi, lalu membuka halaman akun. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const supabase = await createClient();
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/akun", request.url));
  }
  return NextResponse.redirect(new URL("/masuk?gagal=1", request.url));
}
