import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

/**
 * Klien Supabase untuk Server Component, Server Action, dan Route Handler.
 * Memakai sesi pengguna dari cookie, jadi semua query tunduk pada Row Level Security.
 * Buat klien baru di setiap permintaan; jangan disimpan di variabel global.
 */
export async function createClient() {
  const env = supabaseEnv();
  if (!env) return null;
  const cookieStore = await cookies();
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component tidak boleh menulis cookie. Aman diabaikan:
          // proxy.ts memperbarui sesi di setiap permintaan.
        }
      },
    },
  });
}

/** Mengembalikan klien beserta id dan email pengguna yang sedang masuk, atau null. */
export async function getSessionUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { supabase, id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
}
