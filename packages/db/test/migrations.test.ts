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
  create table auth.users (id uuid primary key, email varchar(255));
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public to anon, authenticated;
  grant usage on schema auth to anon, authenticated;
`;

const migrationsDir = join(import.meta.dirname, "../../../supabase/migrations");
const ALICE = "00000000-0000-0000-0000-00000000000a";
const BOB = "00000000-0000-0000-0000-00000000000b";
const CAROL = "00000000-0000-0000-0000-00000000000c";

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
  await db.exec(
    `insert into auth.users (id, email) values ('${ALICE}', 'alice@example.com'), ('${BOB}', 'bob@example.com'), ('${CAROL}', 'carol@example.com');`,
  );
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

describe("admin", () => {
  type AdminRow = { owner_email: string; account_number: number; ea_code: string; status: string; expires_at: Date | null };

  const accountId = async (accountNumber: number) => {
    const result = await db.query<{ id: string }>(`select id from public.mt5_accounts where account_number = $1`, [accountNumber]);
    return result.rows[0].id;
  };
  const setLicense = (userId: string, id: string, status: string, expiresAt: string | null) =>
    as("authenticated", userId, () =>
      db.query<{ updated: boolean }>(`select public.admin_set_license($1, $2, $3) as updated`, [id, status, expiresAt]),
    );

  beforeAll(async () => {
    await db.exec(`insert into public.admins (user_id) values ('${CAROL}');`);
    await as("authenticated", BOB, () =>
      db.query(`insert into public.mt5_accounts (ea_id, account_number, broker_server) values ($1, 2001, 'Demo-Server')`, [eaId]),
    );
  });

  it("hanya pengguna di tabel admins yang dianggap admin", async () => {
    const carol = await as("authenticated", CAROL, () => db.query<{ is_admin: boolean }>(`select public.is_admin()`));
    const alice = await as("authenticated", ALICE, () => db.query<{ is_admin: boolean }>(`select public.is_admin()`));
    expect(carol.rows[0].is_admin).toBe(true);
    expect(alice.rows[0].is_admin).toBe(false);
  });

  it("pengguna tidak bisa membaca daftar admin atau menambahkan dirinya", async () => {
    await expect(as("authenticated", ALICE, () => db.query(`select * from public.admins`))).rejects.toThrow(/permission denied/);
    await expect(
      as("authenticated", ALICE, () => db.query(`insert into public.admins (user_id) values ($1)`, [ALICE])),
    ).rejects.toThrow(/permission denied/);
    await expect(as("anon", null, () => db.query(`select * from public.admins`))).rejects.toThrow(/permission denied/);
  });

  it("admin melihat semua akun beserta email pemiliknya, yang pending lebih dulu", async () => {
    const result = await as("authenticated", CAROL, () => db.query<AdminRow>(`select * from public.admin_list_accounts()`));
    expect(result.rows.map((row) => [row.account_number, row.owner_email, row.ea_code, row.status])).toEqual([
      [2001, "bob@example.com", "averaging-v1", "pending"],
      [1001, "alice@example.com", "averaging-v1", "active"],
    ]);
  });

  it("bukan admin mendapat daftar kosong", async () => {
    const result = await as("authenticated", ALICE, () => db.query(`select * from public.admin_list_accounts()`));
    expect(result.rows).toHaveLength(0);
  });

  it("admin mengaktifkan lisensi dan mengisi masa berlaku", async () => {
    const id = await accountId(2001);
    const result = await setLicense(CAROL, id, "active", "2027-06-30T16:59:59.999Z");
    expect(result.rows[0].updated).toBe(true);
    const license = await as("anon", null, () =>
      db.query<{ status: string; expires_at: Date }>(`select * from public.verify_license(2001, 'Demo-Server', 'averaging-v1')`),
    );
    expect(license.rows[0].status).toBe("active");
    expect(new Date(license.rows[0].expires_at).toISOString()).toBe("2027-06-30T16:59:59.999Z");
  });

  it("admin menangguhkan lisensi dan mengosongkan masa berlaku", async () => {
    const id = await accountId(2001);
    await setLicense(CAROL, id, "suspended", null);
    const row = await db.query<{ status: string; expires_at: Date | null }>(`select status, expires_at from public.mt5_accounts where id = $1`, [id]);
    expect(row.rows[0]).toEqual({ status: "suspended", expires_at: null });
  });

  it("bukan admin tidak bisa mengubah lisensi, termasuk miliknya sendiri", async () => {
    const id = await accountId(2001);
    await expect(setLicense(BOB, id, "active", null)).rejects.toThrow(/Hanya admin/);
    const row = await db.query<{ status: string }>(`select status from public.mt5_accounts where id = $1`, [id]);
    expect(row.rows[0].status).toBe("suspended");
  });

  it("pengunjung tanpa login tidak bisa memanggil fungsi admin", async () => {
    const id = await accountId(2001);
    await expect(as("anon", null, () => db.query(`select public.admin_set_license($1, 'active', null)`, [id]))).rejects.toThrow(/permission denied/);
    await expect(as("anon", null, () => db.query(`select * from public.admin_list_accounts()`))).rejects.toThrow(/permission denied/);
    await expect(as("anon", null, () => db.query(`select public.is_admin()`))).rejects.toThrow(/permission denied/);
  });

  it("status di luar pilihan ditolak", async () => {
    const id = await accountId(2001);
    await expect(setLicense(CAROL, id, "gratis", null)).rejects.toThrow(/check constraint/);
  });

  it("akun yang tidak ada dilaporkan sebagai tidak berubah", async () => {
    const result = await setLicense(CAROL, "00000000-0000-0000-0000-0000000000ff", "active", null);
    expect(result.rows[0].updated).toBe(false);
  });

  it("pengguna tetap tidak bisa mengubah baris mt5_accounts secara langsung", async () => {
    await expect(
      as("authenticated", BOB, () => db.query(`update public.mt5_accounts set status = 'active' where account_number = 2001`)),
    ).rejects.toThrow(/permission denied/);
  });
});
