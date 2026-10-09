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

/** Grafik candlestick kecil dengan satu garis level putus-putus. */
function candleChart(options: { candles: Candle[]; level: number; levelFrom: number; levelLabel: string; label: string }): string {
  const { candles, level, levelFrom, levelLabel, label } = options;
  const top = Math.max(...candles.map((candle) => candle[1])) + 6;
  const bottom = Math.min(...candles.map((candle) => candle[2])) - 6;
  const step = (W - PAD * 2 - LABEL_WIDTH) / candles.length;
  const x = (index: number) => PAD + LABEL_WIDTH + step * (index + 0.5);
  const y = (price: number) => PAD + ((top - price) / (top - bottom)) * (H - PAD * 2);

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

  return (
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}" class="h-auto w-full bg-surface">` +
    `<line x1="${x(levelFrom)}" x2="${W - PAD}" y1="${y(level)}" y2="${y(level)}" stroke="var(--color-ink)" stroke-width="1.5" stroke-dasharray="5 4"/>` +
    `<text x="${PAD}" y="${y(level) + 4}" font-size="13" fill="var(--color-ink-soft)">${levelLabel}</text>` +
    bars +
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
      level: 52,
      levelFrom: 2,
      levelLabel: "swing high",
      label: "Candle terakhir ditutup di atas garis swing high.",
    }),
    "Ditutup di atas level",
    "Body candle terakhir melewati swing high. BOS sah.",
  ) +
  panel(
    candleChart({
      candles: [...beforeBreak, [45, 60, 44, 48]],
      level: 52,
      levelFrom: 2,
      levelLabel: "swing high",
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
      level: 54,
      levelFrom: 4,
      levelLabel: "swing high",
      label: "Pada uptrend, candle terakhir ditutup di atas swing high terakhir.",
    }),
    "BOS",
    "Swing high ditembus searah tren. Uptrend berlanjut.",
  ) +
  panel(
    candleChart({
      candles: [...uptrend, [52, 53, 44, 46], [46, 47, 36, 38], [38, 39, 24, 26]],
      level: 30,
      levelFrom: 2,
      levelLabel: "higher low",
      label: "Pada uptrend, candle terakhir ditutup di bawah higher low terakhir.",
    }),
    "ChoCh",
    "Higher low ditembus melawan tren. Uptrend mungkin berakhir.",
  ) +
  `</div>` +
  `</figure>`;

export const figures: Record<string, string> = {
  "bos-close": bosClose,
  "bos-vs-choch": bosVsChoch,
};
