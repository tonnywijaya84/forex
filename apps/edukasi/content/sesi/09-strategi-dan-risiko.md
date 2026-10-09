---
session: 9
title: Strategi entry dan manajemen risiko
summary: Checklist enam langkah, ukuran lot, dan win rate minimum.
icon: risk-plan
---

Sesi 1 sampai 8 membangun peta. Sesi ini mengubah peta itu menjadi prosedur yang bisa diulang: kapan masuk, di mana batalnya, dan berapa besar posisinya.

## Tiga area setelah BOS

Leg yang menghasilkan BOS biasanya meninggalkan tiga area di antara level 0,5 dan pangkal leg.

| Area | Letak | Sifat |
| --- | --- | --- |
| Order block dangkal | Dekat level 0,5 | Tersentuh lebih dulu dan sering ditembus. Ini inducement dari Sesi 8. |
| Imbalance | Tengah leg | Cenderung terisi saat harga turun lebih dalam. |
| Order block utama | Pangkal leg | Area yang ditunggu, terutama bila likuiditas di dekatnya belum disapu. |

## Checklist enam langkah

Kerjakan berurutan. Bila satu langkah tidak terpenuhi, tidak ada entry.

1. **Tandai high dan low terbaru** di timeframe besar.
2. **Tentukan arah** dari penembusan struktur terakhir yang sah.
3. **Ukur retracement** dengan Fibonacci dan tandai area 0,5 sampai 0,81. Area utamanya tetap 0,618 sampai 0,81 seperti di Sesi 1.
4. **Tunggu ChoCh di timeframe kecil** setelah harga masuk ke area itu.
5. **Tandai order block** yang lahir dari gerakan ChoCh tersebut.
6. **Pasang rencananya:** limit order di order block, stop di luar zona, dan target di swing high atau swing low terdekat.

<!-- gambar: entry-plan -->

Contoh pasangan timeframe: arah dibaca di H4 dan ChoCh ditunggu di M15, atau arah di H1 dan ChoCh di M5.

## Tentukan risiko dulu, baru ukuran lot

Stop menentukan di mana rencana batal. Ukuran lot menentukan berapa yang hilang saat itu terjadi. Urutannya selalu sama: tetapkan risiko dalam persen ekuitas, lalu hitung lot.

**Lot = (ekuitas × persen risiko) ÷ (jarak stop dalam pip × nilai pip per lot)**

Contoh pada EURUSD, dengan nilai pip sekitar 10 dolar per 1 lot standar:

- Ekuitas 1.000 dolar dan risiko 1% berarti risiko 10 dolar per posisi.
- Jarak stop 25 pip.
- Lot = 10 ÷ (25 × 10) = 0,04.

Dengan risiko yang sama, lot berubah mengikuti jarak stop.

| Jarak stop | Lot | Rugi bila stop tersentuh |
| --- | --- | --- |
| 15 pip | 0,06 | 9 dolar |
| 25 pip | 0,04 | 10 dolar |
| 50 pip | 0,02 | 10 dolar |

Pada stop 15 pip, hasil hitungnya 0,067 lot dan dibulatkan ke bawah. Nilai pip berbeda untuk setiap pair dan untuk emas, jadi periksa spesifikasi kontrak di broker sebelum menghitung.

## Rasio risiko-imbal hasil dan win rate

Rasio risiko-imbal hasil membandingkan jarak ke stop dengan jarak ke target. Rasio 1:2 berarti target berjarak dua kali jarak stop.

Rasio ini menentukan win rate terendah agar hasilnya impas:

**Win rate impas = 1 ÷ (1 + rasio)**

| Rasio | Win rate impas |
| --- | --- |
| 1:1 | 50% |
| 1:1,5 | 40% |
| 1:2 | 33,3% |
| 1:3 | 25% |

Angka di atas belum memperhitungkan spread, komisi, dan swap. Dalam praktik, win rate yang dibutuhkan sedikit lebih tinggi.

Sebagai hitungan, ambil 10 posisi dengan rasio 1:2 dan risiko yang sama, lalu sebut risiko itu 1R.

| Menang | Kalah | Hasil |
| --- | --- | --- |
| 3 | 7 | −1R |
| 4 | 6 | +2R |
| 5 | 5 | +5R |

Tabel ini hanya menunjukkan cara menghitung. Win rate sebuah strategi baru diketahui dari catatan yang cukup panjang, dan hasil masa lalu tidak menjamin hasil berikutnya.

## Aturan yang tidak ditawar

1. **Stop terpasang sejak entry,** di level yang membatalkan rencana.
2. **Stop tidak digeser menjauh.** Bila level pembatal tersentuh, rencananya memang batal.
3. **Risiko dihitung dari semua posisi terbuka.** Menambah posisi pada posisi yang sedang rugi menambah risiko total, jadi hitung ulang sebelum melakukannya.
4. **Tetapkan batas rugi harian.** Bila batas itu tercapai, berhenti sampai hari berikutnya.
5. **Catat setiap posisi.** Tanpa catatan, win rate dan rasio hanya perkiraan.

## Latihan

Dengan fitur bar replay atau akun demo, kumpulkan 20 setup yang lolos checklist enam langkah. Untuk setiap setup, catat jarak stop, jarak target, rasionya, dan hasilnya dalam R. Setelah 20 setup, hitung win rate dan bandingkan dengan win rate impas untuk rasio rata-rata Anda.
