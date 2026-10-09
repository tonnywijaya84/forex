/**
 * Gambar untuk isi materi. Dipanggil dari file Markdown dengan baris `<!-- gambar: nama -->`.
 * Hasilnya SVG statis; warnanya memakai token dari `packages/ui/src/tokens.css`.
 */
type Candle = [open: number, high: number, low: number, close: number];

const W = 320;
const H = 220;
const PAD = 16;
/** Lebar kolom di kiri untuk tulisan level, supaya tidak menimpa candle. */
const LABEL_WIDTH = 74;

type Level = { price: number; from: number; label: string };
type Zone = { top: number; bottom: number; from: number; label: string };
/** Tulisan kecil di bawah sebuah candle, misalnya nomor urut. */
type Mark = { index: number; text: string };

/** Grafik candlestick kecil. Bisa diberi garis level putus-putus, zona berwarna, dan tulisan di bawah candle. */
function candleChart(options: {
  candles: Candle[];
  label: string;
  level?: Level;
  levels?: Level[];
  zone?: Zone;
  marks?: Mark[];
}): string {
  const { candles, label, zone, marks = [] } = options;
  const levels = [...(options.level ? [options.level] : []), ...(options.levels ?? [])];
  // Garis level boleh berada di luar rentang candle, misalnya stop di balik zona.
  const top = Math.max(...candles.map((candle) => candle[1]), ...levels.map((level) => level.price)) + 6;
  const bottom = Math.min(...candles.map((candle) => candle[2]), ...levels.map((level) => level.price)) - 6;
  const step = (W - PAD * 2 - LABEL_WIDTH) / candles.length;
  const x = (index: number) => PAD + LABEL_WIDTH + step * (index + 0.5);
  const y = (price: number) => PAD + ((top - price) / (top - bottom)) * (H - PAD * 2);
  const caption = (text: string, price: number) =>
    `<text x="${PAD}" y="${y(price) + 4}" font-size="13" fill="var(--color-ink-soft)">${text}</text>`;

  const bars = candles
    .map(([open, high, low, close], index) => {
      const color = close >= open ? "var(--color-bull)" : "var(--color-bear)";
      const bodyTop = y(Math.max(open, close));
      const bodyHeight = Math.max(Math.abs(y(open) - y(close)), 2);
      return (
        `<line x1="${x(index)}" x2="${x(index)}" y1="${y(high)}" y2="${y(low)}" stroke="${color}" stroke-width="2"/>` +
        `<rect x="${x(index) - step * 0.3}" y="${bodyTop}" width="${step * 0.6}" height="${bodyHeight}" fill="${color}"/>`
      );
    })
    .join("");

  const zoneShape = zone
    ? `<rect x="${x(zone.from) - step * 0.5}" y="${y(zone.top)}" width="${W - PAD - (x(zone.from) - step * 0.5)}" height="${y(zone.bottom) - y(zone.top)}" fill="var(--color-mark)" fill-opacity="0.4"/>` +
      caption(zone.label, (zone.top + zone.bottom) / 2)
    : "";
  const levelShape = levels
    .map(
      (level) =>
        `<line x1="${x(level.from)}" x2="${W - PAD}" y1="${y(level.price)}" y2="${y(level.price)}" stroke="var(--color-ink)" stroke-width="1.5" stroke-dasharray="5 4"/>` +
        caption(level.label, level.price),
    )
    .join("");

  const markShapes = marks
    .map(
      (mark) =>
        `<text x="${x(mark.index)}" y="${y(candles[mark.index][2]) + 17}" text-anchor="middle" font-size="13" font-weight="600" fill="var(--color-ink-soft)">${mark.text}</text>`,
    )
    .join("");

  return (
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}" class="h-auto w-full bg-surface">` +
    zoneShape +
    levelShape +
    bars +
    markShapes +
    `</svg>`
  );
}

function panel(chart: string, title: string, note: string): string {
  return `<div>${chart}<p class="mt-3 font-semibold">${title}</p><p class="text-sm text-ink-soft">${note}</p></div>`;
}

// Naik ke swing high (52), terkoreksi melewati low candle pembentuknya (37), lalu kembali ke level itu.
const beforeBreak: Candle[] = [
  [20, 30, 18, 28],
  [28, 40, 27, 38],
  [38, 52, 37, 50],
  [50, 51, 42, 44],
  [44, 46, 35, 37],
  [37, 46, 36, 45],
];

const bosClose =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    candleChart({
      candles: [...beforeBreak, [45, 60, 44, 58]],
      level: { price: 52, from: 2, label: "swing high" },
      label: "Candle terakhir ditutup di atas garis swing high.",
    }),
    "Ditutup di atas level",
    "Body candle terakhir melewati swing high. BOS sah.",
  ) +
  panel(
    candleChart({
      candles: [...beforeBreak, [45, 60, 44, 48]],
      level: { price: 52, from: 2, label: "swing high" },
      label: "Wick candle terakhir menembus garis swing high, tetapi candle ditutup di bawahnya.",
    }),
    "Hanya wick yang menembus",
    "Harga sempat lewat, lalu ditutup kembali di bawah level. Belum BOS.",
  ) +
  `</div>` +
  `</figure>`;

// Uptrend: higher low di 30, higher high di 54.
const uptrend: Candle[] = [
  [20, 30, 18, 28],
  [28, 40, 27, 38],
  [38, 39, 30, 32],
  [32, 46, 31, 44],
  [44, 54, 43, 52],
];

const bosVsChoch =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    candleChart({
      candles: [...uptrend, [52, 53, 41, 44], [44, 50, 43, 49], [49, 62, 48, 60]],
      level: { price: 54, from: 4, label: "swing high" },
      label: "Pada uptrend, candle terakhir ditutup di atas swing high terakhir.",
    }),
    "BOS",
    "Swing high ditembus searah tren. Uptrend berlanjut.",
  ) +
  panel(
    candleChart({
      candles: [...uptrend, [52, 53, 44, 46], [46, 47, 36, 38], [38, 39, 24, 26]],
      level: { price: 30, from: 2, label: "higher low" },
      label: "Pada uptrend, candle terakhir ditutup di bawah higher low terakhir.",
    }),
    "ChoCh",
    "Higher low ditembus melawan tren. Uptrend mungkin berakhir.",
  ) +
  `</div>` +
  `</figure>`;

// Leg naik dari 20 ke 60; setengah leg berada di 40.
const legUp: Candle[] = [
  [20, 32, 20, 30],
  [30, 44, 29, 42],
  [42, 60, 41, 58],
];

const retracementDepth =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    candleChart({
      candles: [...legUp, [58, 59, 51, 53], [53, 56, 50, 55], [55, 68, 54, 66], [66, 74, 65, 72]],
      level: { price: 40, from: 0, label: "50% leg" },
      label: "Koreksi berhenti jauh di atas garis setengah leg, lalu harga naik lagi.",
    }),
    "Koreksi dangkal",
    "Harga belum menyentuh setengah leg. Lembah ini bukan swing low.",
  ) +
  panel(
    candleChart({
      candles: [...legUp, [58, 59, 48, 50], [50, 51, 37, 39], [39, 50, 38, 48], [48, 64, 47, 62]],
      level: { price: 40, from: 0, label: "50% leg" },
      label: "Koreksi turun melewati garis setengah leg, lalu harga naik lagi.",
    }),
    "Koreksi yang sah",
    "Harga melewati setengah leg. Lembah ini swing low yang sah.",
  ) +
  `</div>` +
  `</figure>`;

const orderBlock =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    candleChart({
      candles: [
        [60, 62, 52, 54],
        [54, 55, 46, 48],
        [48, 49, 40, 42],
        [42, 58, 41, 57],
        [57, 70, 56, 69],
        [69, 74, 66, 68],
        [68, 69, 56, 58],
        [58, 59, 47, 50],
        [50, 64, 48, 63],
      ],
      zone: { top: 49, bottom: 40, from: 2, label: "order block" },
      label: "Candle turun terakhir sebelum harga naik kuat ditandai sebagai zona. Harga kemudian kembali ke zona itu dan naik lagi.",
    }),
    "Bullish order block",
    "Candle turun terakhir sebelum gerakan naik yang kuat.",
  ) +
  panel(
    candleChart({
      candles: [
        [40, 48, 38, 46],
        [46, 54, 45, 52],
        [52, 60, 51, 58],
        [58, 59, 42, 43],
        [43, 44, 30, 31],
        [31, 34, 26, 32],
        [32, 44, 31, 42],
        [42, 53, 41, 50],
        [50, 52, 36, 37],
      ],
      zone: { top: 60, bottom: 51, from: 2, label: "order block" },
      label: "Candle naik terakhir sebelum harga turun kuat ditandai sebagai zona. Harga kemudian kembali ke zona itu dan turun lagi.",
    }),
    "Bearish order block",
    "Candle naik terakhir sebelum gerakan turun yang kuat.",
  ) +
  `</div>` +
  `</figure>`;

const threeCandles: Mark[] = [
  { index: 1, text: "1" },
  { index: 2, text: "2" },
  { index: 3, text: "3" },
];

const imbalance =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    candleChart({
      candles: [
        [30, 36, 28, 34],
        [34, 40, 33, 38],
        [38, 58, 37, 56],
        [56, 64, 49, 62],
        [62, 66, 60, 65],
      ],
      zone: { top: 49, bottom: 40, from: 1, label: "imbalance" },
      marks: threeCandles,
      label: "Tiga candle naik. Low candle ketiga berada di atas high candle pertama, sehingga ada celah di antara keduanya.",
    }),
    "Ada imbalance",
    "Low candle 3 berada di atas high candle 1. Rentang di antaranya hanya dilewati candle 2.",
  ) +
  panel(
    candleChart({
      candles: [
        [30, 36, 28, 34],
        [34, 40, 33, 38],
        [38, 58, 37, 56],
        [56, 64, 39, 62],
        [62, 66, 60, 65],
      ],
      level: { price: 40, from: 1, label: "high 1" },
      marks: threeCandles,
      label: "Tiga candle naik. Wick bawah candle ketiga turun sampai high candle pertama, sehingga tidak ada celah.",
    }),
    "Tidak ada imbalance",
    "Wick candle 3 turun sampai high candle 1. Celahnya sudah tertutup.",
  ) +
  `</div>` +
  `</figure>`;

// Dua lembah sejajar di 44 (equal low), lalu harga kembali mendekatinya.
const equalLows: Candle[] = [
  [60, 62, 50, 52],
  [52, 54, 44, 46],
  [46, 56, 45, 54],
  [54, 58, 52, 53],
  [53, 54, 44, 46],
  [46, 52, 45, 50],
];

const liquiditySweep =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    candleChart({
      candles: [...equalLows, [50, 51, 37, 48], [48, 62, 47, 60]],
      level: { price: 44, from: 1, label: "equal low" },
      label: "Wick sebuah candle turun melewati dua lembah sejajar, tetapi candle ditutup kembali di atasnya, lalu harga naik.",
    }),
    "Sapuan",
    "Wick melewati level, candle ditutup kembali di atasnya. Order di bawah level sudah terambil.",
  ) +
  panel(
    candleChart({
      candles: [...equalLows, [50, 51, 36, 38], [38, 40, 29, 31]],
      level: { price: 44, from: 1, label: "equal low" },
      label: "Sebuah candle ditutup di bawah dua lembah sejajar, lalu harga terus turun.",
    }),
    "Penembusan",
    "Candle ditutup di bawah level. Ini penembusan struktur, bukan sapuan.",
  ) +
  `</div>` +
  `</figure>`;

const entryPlan =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    candleChart({
      candles: [
        [60, 62, 52, 54],
        [54, 55, 46, 48],
        [48, 49, 40, 42],
        [42, 58, 41, 57],
        [57, 70, 56, 69],
        [69, 74, 66, 68],
        [68, 69, 56, 58],
        [58, 59, 47, 50],
        [50, 64, 48, 63],
        [63, 76, 62, 75],
      ],
      zone: { top: 49, bottom: 40, from: 2, label: "order block" },
      levels: [
        { price: 74, from: 5, label: "target" },
        { price: 49, from: 2, label: "entry" },
        { price: 37, from: 2, label: "stop" },
      ],
      label: "Posisi beli: entry di batas atas order block, stop di bawah zona, target di swing high sebelumnya.",
    }),
    "Posisi beli",
    "Entry di batas atas order block, stop di bawah zona, target di swing high.",
  ) +
  panel(
    candleChart({
      candles: [
        [40, 48, 38, 46],
        [46, 54, 45, 52],
        [52, 60, 51, 58],
        [58, 59, 42, 43],
        [43, 44, 30, 31],
        [31, 34, 26, 32],
        [32, 44, 31, 42],
        [42, 53, 41, 50],
        [50, 52, 36, 37],
        [37, 38, 24, 25],
      ],
      zone: { top: 60, bottom: 51, from: 2, label: "order block" },
      levels: [
        { price: 63, from: 2, label: "stop" },
        { price: 51, from: 2, label: "entry" },
        { price: 26, from: 5, label: "target" },
      ],
      label: "Posisi jual: entry di batas bawah order block, stop di atas zona, target di swing low sebelumnya.",
    }),
    "Posisi jual",
    "Entry di batas bawah order block, stop di atas zona, target di swing low.",
  ) +
  `</div>` +
  `</figure>`;

export const figures: Record<string, string> = {
  "entry-plan": entryPlan,
  "liquidity-sweep": liquiditySweep,
  imbalance,
  "order-block": orderBlock,
  "bos-close": bosClose,
  "bos-vs-choch": bosVsChoch,
  "retracement-depth": retracementDepth,
};
