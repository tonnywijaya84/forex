import { createClient } from "@supabase/supabase-js";
import { buildVerifyResponse, parseVerifyRequest, type LicenseRecord, type StoredStatus } from "@forex/license";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Dipanggil EA lewat WebRequest untuk memeriksa lisensi satu akun MT5.
 * Kontrak lengkapnya ada di docs/api-lisensi.md.
 */
export async function POST(request: Request) {
  const secret = process.env.LICENSE_SIGNING_SECRET;
  const env = supabaseEnv();
  if (!secret || !env) {
    return Response.json({ error: "Layanan lisensi belum dikonfigurasi." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body harus berupa JSON." }, { status: 400 });
  }

  const parsed = parseVerifyRequest(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  // Tanpa sesi pengguna: fungsi verify_license hanya membuka status dan masa berlaku.
  const supabase = createClient(env.url, env.key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.rpc("verify_license", {
    p_account: parsed.value.account,
    p_server: parsed.value.server,
    p_ea: parsed.value.ea,
  });
  if (error) {
    return Response.json({ error: "Database lisensi tidak bisa dihubungi." }, { status: 502 });
  }

  const row = Array.isArray(data) ? (data[0] as { status: StoredStatus; expires_at: string | null } | undefined) : undefined;
  const record: LicenseRecord | null = row ? { status: row.status, expiresAt: row.expires_at } : null;

  return Response.json(buildVerifyResponse(parsed.value, record, new Date(), secret), {
    headers: { "Cache-Control": "no-store" },
  });
}
