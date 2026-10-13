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

// ---------------------------------------------------------------------------------------------
// Diagram garis (zig-zag) untuk Sesi 1: tanpa candle, hanya jalur swing.
// Koordinat titik memakai skala 0-100 di kedua sumbu; 0 di kiri bawah.

type SwingPoint = { x: number; y: number; label?: string; place?: "above" | "below" };
type SwingLevel = { y: number; label: string; from?: number; strong?: boolean };

function swingChart(options: {
  label: string;
  points: SwingPoint[];
  width?: number;
  height?: number;
  /** Jalur kedua yang lebih tipis, misalnya struktur minor di dalam struktur major. */
  minor?: [number, number][];
  /** Tulisan di tengah ruas: `segment` 0 berarti ruas antara titik 0 dan titik 1. */
  segments?: { segment: number; text: string }[];
  levels?: SwingLevel[];
  band?: { top: number; bottom: number; from?: number };
  /** Ruang di kanan untuk tulisan level. */
  rightSpace?: number;
  arrow?: boolean;
}): string {
  const { label, points, minor, segments = [], levels = [], band, arrow = true } = options;
  const width = options.width ?? W;
  const height = options.height ?? H;
  const font = width < 260 ? 12 : 13;
  const right = options.rightSpace ?? 0;
  const top = PAD + 14;
  const bottom = height - PAD - 14;
  const x = (value: number) => PAD + (value / 100) * (width - PAD * 2 - right);
  const y = (value: number) => bottom - (value / 100) * (bottom - top);
  const text = (tx: number, ty: number, content: string, extra = "") =>
    `<text x="${tx}" y="${ty}" font-size="${font}" fill="var(--color-ink-soft)"${extra}>${content}</text>`;

  const bandShape = band
    ? `<rect x="${x(band.from ?? 0)}" y="${y(band.top)}" width="${x(100) - x(band.from ?? 0)}" height="${y(band.bottom) - y(band.top)}" fill="var(--color-mark)" fill-opacity="0.4"/>`
    : "";
  const levelShapes = levels
    .map(
      (level) =>
        `<line x1="${x(level.from ?? 0)}" x2="${x(100)}" y1="${y(level.y)}" y2="${y(level.y)}" stroke="var(--color-ink)" stroke-width="${level.strong ? 1.5 : 1}" stroke-dasharray="5 4"${level.strong ? "" : ' stroke-opacity="0.6"'}/>` +
        text(x(100) + 6, y(level.y) + 4, level.label),
    )
    .join("");
  const minorShape = minor
    ? `<polyline points="${minor.map(([px, py]) => `${x(px)},${y(py)}`).join(" ")}" fill="none" stroke="var(--color-bull)" stroke-width="1.5" stroke-linejoin="round"/>`
    : "";
  const path = `<polyline points="${points.map((point) => `${x(point.x)},${y(point.y)}`).join(" ")}" fill="none" stroke="var(--color-ink)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;

  let head = "";
  if (arrow && points.length > 1) {
    const end = points[points.length - 1];
    const before = points[points.length - 2];
    const ex = x(end.x);
    const ey = y(end.y);
    const angle = Math.atan2(ey - y(before.y), ex - x(before.x));
    const size = 9;
    const corner = (offset: number) =>
      `${ex - size * Math.cos(angle + offset)},${ey - size * Math.sin(angle + offset)}`;
    head = `<polygon points="${ex},${ey} ${corner(0.45)} ${corner(-0.45)}" fill="var(--color-ink)"/>`;
  }

  const pointLabels = points
    .filter((point) => point.label)
    .map((point) => {
      const below = point.place === "below";
      return text(x(point.x), y(point.y) + (below ? font + 5 : -8), point.label!, ` text-anchor="middle" font-weight="600"`);
    })
    .join("");
  const segmentLabels = segments
    .map(({ segment, text: content }) => {
      const a = points[segment];
      const b = points[segment + 1];
      const mx = (x(a.x) + x(b.x)) / 2;
      const my = (y(a.y) + y(b.y)) / 2;
      // Geser tulisan ke kanan bawah ruas naik, atau kanan atas ruas turun, supaya tidak menimpa garis.
      const rising = b.y > a.y;
      return text(mx + 8, my + (rising ? 10 : -2), content, ` font-weight="600" fill="var(--color-ink)"`);
    })
    .join("");

  return (
    `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}" class="h-auto w-full bg-surface">` +
    bandShape +
    levelShapes +
    minorShape +
    path +
    head +
    pointLabels +
    segmentLabels +
    `</svg>`
  );
}

const basicStructure =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    swingChart({
      points: [
        { x: 0, y: 5 },
        { x: 28, y: 55 },
        { x: 44, y: 32 },
        { x: 70, y: 80 },
        { x: 84, y: 60 },
        { x: 100, y: 98 },
      ],
      segments: [
        { segment: 0, text: "E" },
        { segment: 1, text: "R" },
        { segment: 2, text: "E" },
        { segment: 3, text: "R" },
        { segment: 4, text: "E" },
      ],
      label: "Uptrend: gerakan naik panjang (expansion) bergantian dengan koreksi turun yang lebih pendek (retracement).",
    }),
    "Uptrend",
    "Expansion (E) naik, diselingi retracement (R) turun.",
  ) +
  panel(
    swingChart({
      points: [
        { x: 0, y: 95 },
        { x: 28, y: 45 },
        { x: 44, y: 68 },
        { x: 70, y: 20 },
        { x: 84, y: 40 },
        { x: 100, y: 2 },
      ],
      segments: [
        { segment: 0, text: "E" },
        { segment: 1, text: "R" },
        { segment: 2, text: "E" },
        { segment: 3, text: "R" },
        { segment: 4, text: "E" },
      ],
      label: "Downtrend: gerakan turun panjang (expansion) bergantian dengan koreksi naik yang lebih pendek (retracement).",
    }),
    "Downtrend",
    "Expansion (E) turun, diselingi retracement (R) naik.",
  ) +
  `</div>` +
  `</figure>`;

const SMALL = { width: 200, height: 190 };

const threeConditions =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-3">` +
  panel(
    swingChart({
      ...SMALL,
      points: [
        { x: 0, y: 2 },
        { x: 28, y: 45, label: "HH" },
        { x: 46, y: 25, label: "HL", place: "below" },
        { x: 72, y: 72, label: "HH" },
        { x: 86, y: 52, label: "HL", place: "below" },
        { x: 100, y: 92 },
      ],
      label: "Uptrend: setiap puncak lebih tinggi dari puncak sebelumnya (HH) dan setiap lembah lebih tinggi dari lembah sebelumnya (HL).",
    }),
    "Uptrend",
    "Puncak dan lembah sama-sama makin tinggi.",
  ) +
  panel(
    swingChart({
      ...SMALL,
      rightSpace: 34,
      arrow: false,
      points: [
        { x: 0, y: 30 },
        { x: 16, y: 70 },
        { x: 32, y: 32 },
        { x: 50, y: 68 },
        { x: 66, y: 30 },
        { x: 84, y: 70 },
        { x: 100, y: 34 },
      ],
      levels: [
        { y: 70, label: "EQH", strong: true },
        { y: 30, label: "EQL", strong: true },
      ],
      label: "Sideways: harga bolak-balik di antara puncak yang hampir sejajar (EQH) dan lembah yang hampir sejajar (EQL).",
    }),
    "Sideways",
    "Puncak dan lembah hampir sejajar.",
  ) +
  panel(
    swingChart({
      ...SMALL,
      points: [
        { x: 0, y: 98 },
        { x: 28, y: 55, label: "LL", place: "below" },
        { x: 46, y: 75, label: "LH" },
        { x: 72, y: 28, label: "LL", place: "below" },
        { x: 86, y: 48, label: "LH" },
        { x: 100, y: 8 },
      ],
      label: "Downtrend: setiap puncak lebih rendah dari puncak sebelumnya (LH) dan setiap lembah lebih rendah dari lembah sebelumnya (LL).",
    }),
    "Downtrend",
    "Puncak dan lembah sama-sama makin rendah.",
  ) +
  `</div>` +
  `</figure>`;

/** Harga di level Fibonacci `ratio`, diukur dari ujung leg (`end`) kembali ke awal leg (`start`). */
const fib = (start: number, end: number, ratio: number) => end - ratio * (end - start);

function fibonacciPanel(direction: "up" | "down"): string {
  const up = direction === "up";
  const start = up ? 8 : 92;
  const end = up ? 88 : 12;
  const at = (ratio: number) => fib(start, end, ratio);
  const deepest = at(0.7);
  return swingChart({
    rightSpace: 40,
    points: [
      { x: 0, y: start, label: up ? "low" : "high", place: up ? "below" : "above" },
      { x: 40, y: end, label: up ? "high" : "low", place: up ? "above" : "below" },
      { x: 66, y: deepest },
      { x: 92, y: up ? 98 : 2 },
    ],
    band: { top: Math.max(at(0.618), at(0.81)), bottom: Math.min(at(0.618), at(0.81)), from: 40 },
    levels: [
      { y: at(0), label: "0", from: 40 },
      { y: at(0.5), label: "0,5", from: 40, strong: true },
      { y: at(0.618), label: "0,618", from: 40 },
      { y: at(0.81), label: "0,81", from: 40 },
      { y: at(1), label: "1", from: 0 },
    ],
    label: up
      ? "Fibonacci ditarik dari swing low ke swing high. Harga terkoreksi melewati level 0,5 sampai ke area antara 0,618 dan 0,81, lalu naik lagi."
      : "Fibonacci ditarik dari swing high ke swing low. Harga terkoreksi melewati level 0,5 sampai ke area antara 0,618 dan 0,81, lalu turun lagi.",
  });
}

const fibonacciRetracement =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(fibonacciPanel("up"), "Uptrend: tarik dari low ke high", "Koreksi melewati 0,5, lalu masuk area kuning 0,618 sampai 0,81.") +
  panel(fibonacciPanel("down"), "Downtrend: tarik dari high ke low", "Cara bacanya sama, hanya arahnya terbalik.") +
  `</div>` +
  `</figure>`;

const majorPoints: SwingPoint[] = [
  { x: 0, y: 4, label: "O", place: "below" },
  { x: 40, y: 62, label: "A" },
  { x: 60, y: 34, label: "B", place: "below" },
  { x: 100, y: 96, label: "C" },
];

const majorMinor =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    swingChart({
      points: majorPoints,
      label: "Struktur major: naik dari O ke A, terkoreksi ke B, lalu naik ke C.",
    }),
    "Struktur major",
    "Dilihat di timeframe besar: naik O ke A, koreksi ke B, naik lagi ke C.",
  ) +
  panel(
    swingChart({
      points: majorPoints,
      minor: [
        [0, 4], [8, 20], [12, 13], [20, 32], [24, 25], [32, 48], [35, 41], [40, 62],
        [44, 50], [47, 55], [51, 42], [54, 47], [60, 34],
        [66, 50], [70, 43], [77, 63], [81, 56], [88, 78], [92, 71], [100, 96],
      ],
      label: "Struktur yang sama dengan garis tipis berwarna hijau: setiap kaki major tersusun dari banyak swing kecil (minor).",
    }),
    "Major dan minor",
    "Di timeframe kecil, setiap kaki major (garis tebal) tersusun dari swing minor (garis hijau).",
  ) +
  `</div>` +
  `</figure>`;

export const figures: Record<string, string> = {
  "struktur-dasar": basicStructure,
  "tiga-kondisi": threeConditions,
  "fibonacci-retracement": fibonacciRetracement,
  "major-minor": majorMinor,
  "entry-plan": entryPlan,
  "liquidity-sweep": liquiditySweep,
  imbalance,
  "order-block": orderBlock,
  "bos-close": bosClose,
  "bos-vs-choch": bosVsChoch,
  "retracement-depth": retracementDepth,
};
