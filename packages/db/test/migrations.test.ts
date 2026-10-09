import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Menjalankan migrasi di Postgres sungguhan (PGlite) lalu menguji aturan aksesnya.
 * Bagian Supabase yang tidak ada di Postgres polos (schema auth, role anon/authenticated)
 * dibuat tiruannya di bawah ini.
 */
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public to anon, authenticated;
  grant usage on schema auth to anon, authenticated;
`;

const migrationsDir = join(import.meta.dirname, "../../../supabase/migrations");
const ALICE = "00000000-0000-0000-0000-00000000000a";
const BOB = "00000000-0000-0000-0000-00000000000b";

let db: PGlite;
let eaId: string;

/** Menjalankan `fn` sebagai role tertentu, lalu kembali ke superuser. */
async function as<T>(role: "anon" | "authenticated", userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${role}; set request.jwt.claim.sub = '${userId ?? ""}';`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; reset request.jwt.claim.sub;`);
  }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUB);
  for (const file of readdirSync(migrationsDir).sort()) {
    await db.exec(readFileSync(join(migrationsDir, file), "utf8"));
  }
  await db.exec(readFileSync(join(migrationsDir, "../seed.sql"), "utf8"));
  await db.exec(`insert into auth.users (id) values ('${ALICE}'), ('${BOB}');`);
  const ea = await db.query<{ id: string }>(`select id from public.eas where code = 'averaging-v1'`);
  eaId = ea.rows[0].id;
});

afterAll(async () => {
  await db.close();
});

describe("mt5_accounts", () => {
  it("pengguna bisa mendaftarkan akun; statusnya pending", async () => {
    const result = await as("authenticated", ALICE, () =>
      db.query<{ status: string; user_id: string }>(
        `insert into public.mt5_accounts (ea_id, account_number, broker_server) values ($1, 1001, 'Demo-Server') returning status, user_id`,
        [eaId],
      ),
    );
    expect(result.rows[0]).toEqual({ status: "pending", user_id: ALICE });
  });

  it("pengguna tidak bisa mendaftar langsung sebagai aktif", async () => {
    await expect(
      as("authenticated", ALICE, () =>
        db.query(`insert into public.mt5_accounts (ea_id, account_number, broker_server, status) values ($1, 1002, 'Demo-Server', 'active')`, [eaId]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("pengguna tidak bisa mendaftarkan akun atas nama orang lain", async () => {
    await expect(
      as("authenticated", ALICE, () =>
        db.query(`insert into public.mt5_accounts (user_id, ea_id, account_number, broker_server) values ($1, $2, 1003, 'Demo-Server')`, [BOB, eaId]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("pengguna tidak bisa mengubah status lisensinya sendiri", async () => {
    await expect(
      as("authenticated", ALICE, () => db.query(`update public.mt5_accounts set status = 'active' where account_number = 1001`)),
    ).rejects.toThrow(/permission denied/);
  });

  it("pengguna hanya melihat akun miliknya", async () => {
    const alice = await as("authenticated", ALICE, () => db.query(`select account_number from public.mt5_accounts`));
    const bob = await as("authenticated", BOB, () => db.query(`select account_number from public.mt5_accounts`));
    expect(alice.rows).toHaveLength(1);
    expect(bob.rows).toHaveLength(0);
  });

  it("pengunjung tanpa login tidak bisa membaca tabel akun", async () => {
    await expect(as("anon", null, () => db.query(`select * from public.mt5_accounts`))).rejects.toThrow(/permission denied/);
  });

  it("akun yang sama tidak bisa didaftarkan dua kali untuk EA yang sama", async () => {
    await expect(
      as("authenticated", BOB, () =>
        db.query(`insert into public.mt5_accounts (ea_id, account_number, broker_server) values ($1, 1001, 'Demo-Server')`, [eaId]),
      ),
    ).rejects.toThrow(/duplicate key/);
  });

  it("pengguna lain tidak bisa menghapus akun yang bukan miliknya", async () => {
    const result = await as("authenticated", BOB, () => db.query(`delete from public.mt5_accounts where account_number = 1001`));
    expect(result.affectedRows).toBe(0);
  });
});

describe("verify_license", () => {
  const call = (account: number, server: string, ea: string) =>
    as("anon", null, () =>
      db.query<{ status: string; expires_at: Date | null }>(`select * from public.verify_license($1, $2, $3)`, [account, server, ea]),
    );

  it("mengembalikan status pending untuk akun yang baru didaftarkan", async () => {
    const result = await call(1001, "Demo-Server", "averaging-v1");
    expect(result.rows).toEqual([{ status: "pending", expires_at: null }]);
  });

  it("mengembalikan status aktif dan masa berlaku setelah admin mengaktifkan", async () => {
    await db.exec(`update public.mt5_accounts set status = 'active', expires_at = '2027-01-01T00:00:00Z' where account_number = 1001`);
    const result = await call(1001, "Demo-Server", "averaging-v1");
    expect(result.rows[0].status).toBe("active");
    expect(new Date(result.rows[0].expires_at!).toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("tidak mengembalikan apa pun untuk akun, server, atau EA yang tidak cocok", async () => {
    expect((await call(9999, "Demo-Server", "averaging-v1")).rows).toHaveLength(0);
    expect((await call(1001, "Server-Lain", "averaging-v1")).rows).toHaveLength(0);
    expect((await call(1001, "Demo-Server", "trend-following-v1")).rows).toHaveLength(0);
  });

  it("tidak mengembalikan apa pun bila EA dinonaktifkan", async () => {
    await db.exec(`update public.eas set is_active = false where code = 'averaging-v1'`);
    expect((await call(1001, "Demo-Server", "averaging-v1")).rows).toHaveLength(0);
    await db.exec(`update public.eas set is_active = true where code = 'averaging-v1'`);
  });
});

describe("eas", () => {
  it("pengunjung hanya melihat EA yang aktif", async () => {
    await db.exec(`insert into public.eas (code, name, is_active) values ('lama-v0', 'EA Lama', false)`);
    const result = await as("anon", null, () => db.query<{ code: string }>(`select code from public.eas order by code`));
    expect(result.rows.map((row) => row.code)).toEqual(["averaging-v1", "trend-following-v1"]);
  });

  it("pengunjung tidak bisa menambah EA", async () => {
    await expect(as("anon", null, () => db.query(`insert into public.eas (code, name) values ('palsu-v1', 'Palsu')`))).rejects.toThrow(/permission denied/);
  });
});
