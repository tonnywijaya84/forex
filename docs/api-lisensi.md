# API lisensi EA

EA memanggil API ini untuk mengetahui apakah ia boleh berjalan di akun MT5 tempat ia dipasang.

## Permintaan

```
POST <alamat portal>/api/license/verify
Content-Type: application/json

{ "account": 276170008, "server": "Exness-MT5Real26", "ea": "averaging-v1" }
```

| Field | Isi |
| --- | --- |
| `account` | Nomor akun MT5 (`AccountInfoInteger(ACCOUNT_LOGIN)`) |
| `server` | Nama server broker (`AccountInfoString(ACCOUNT_SERVER)`) |
| `ea` | Kode EA, sama dengan kolom `code` di tabel `eas` |

## Jawaban

```json
{
  "account": 276170008,
  "server": "Exness-MT5Real26",
  "ea": "averaging-v1",
  "state": "active",
  "expires_at": "2027-01-01T00:00:00+00:00",
  "checked_at": "2026-10-09T10:34:24.821Z",
  "signature": "d2fd705d…"
}
```

| `state` | Arti | Yang sebaiknya dilakukan EA |
| --- | --- | --- |
| `active` | Lisensi aktif | Berjalan normal |
| `pending` | Terdaftar, belum diaktifkan admin | Tidak membuka posisi baru |
| `suspended` | Ditangguhkan admin | Tidak membuka posisi baru |
| `expired` | Masa berlaku habis | Tidak membuka posisi baru |
| `unknown` | Akun, server, atau EA tidak terdaftar | Tidak membuka posisi baru |

Kode HTTP selain 200: `400` permintaan salah bentuk (pesan ada di field `error`), `502` database tidak bisa
dihubungi, `503` layanan belum dikonfigurasi.

## Tanda tangan

`signature` adalah HMAC-SHA256 (heksadesimal huruf kecil) dari teks berikut, dengan kunci `LICENSE_SIGNING_SECRET`:

```
account|server|ea|state|expires_at|checked_at
```

`expires_at` ditulis kosong bila null. Contoh teks untuk jawaban di atas:

```
276170008|Exness-MT5Real26|averaging-v1|active|2027-01-01T00:00:00+00:00|2026-10-09T10:34:24.821Z
```

EA menyusun teks yang sama dari isi jawaban, menghitung HMAC dengan kunci yang ditanam di dalamnya, lalu
membandingkan hasilnya. Dengan begitu jawaban palsu dari server tiruan tertolak. EA juga perlu menolak jawaban
yang `checked_at`-nya terlalu lama, supaya jawaban lama tidak bisa diputar ulang.

## Catatan untuk sisi EA

- Di MT5, alamat portal harus didaftarkan lebih dulu di Tools, Options, Expert Advisors, pada
  "Allow WebRequest for listed URL". Tanpa itu `WebRequest` gagal.
- Jangan memanggil API di setiap tick. Cukup saat EA dimulai, lalu berkala (misalnya tiap beberapa jam).
- Tentukan masa tenggang bila portal tidak bisa dihubungi, supaya gangguan server tidak menghentikan EA
  yang sedang mengelola posisi terbuka.
- Kunci yang ditanam di file `.ex5` bisa dibongkar oleh orang yang berniat. Tanda tangan menaikkan tingkat
  kesulitan pembajakan, bukan menghilangkannya.

## Mencoba dari terminal

```bash
curl -X POST http://localhost:3003/api/license/verify \
  -H 'content-type: application/json' \
  -d '{"account":276170008,"server":"Exness-MT5Real26","ea":"averaging-v1"}'
```
