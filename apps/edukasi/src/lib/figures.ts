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

/** Rentang waktu yang diberi latar dan nama di atasnya, misalnya satu sesi pasar. */
type TimeWindow = { from: number; to: number; label: string; shade?: boolean };
/** Garis lurus dari low candle `start` ke high candle `end`, misalnya satu leg major. */
type Leg = { start: number; end: number; startLabel: string; endLabel: string };

/** Grafik candlestick kecil. Bisa diberi garis level putus-putus, zona berwarna, dan tulisan di bawah candle. */
function candleChart(options: {
  candles: Candle[];
  label: string;
  level?: Level;
  levels?: Level[];
  zone?: Zone;
  marks?: Mark[];
  windows?: TimeWindow[];
  leg?: Leg;
  /** Lebar kolom kiri untuk tulisan level. 0 bila grafik tidak memakai level. */
  labelWidth?: number;
}): string {
  const { candles, label, zone, marks = [], windows = [], leg } = options;
  const levels = [...(options.level ? [options.level] : []), ...(options.levels ?? [])];
  const labelWidth = options.labelWidth ?? LABEL_WIDTH;
  // Garis level boleh berada di luar rentang candle, misalnya stop di balik zona.
  const top = Math.max(...candles.map((candle) => candle[1]), ...levels.map((level) => level.price)) + 6;
  const bottom = Math.min(...candles.map((candle) => candle[2]), ...levels.map((level) => level.price)) - 6;
  // Nama rentang waktu ditulis di atas candle, jadi candle tertinggi digeser sedikit ke bawah.
  const plotTop = PAD + (windows.length > 0 ? 20 : 0);
  const step = (W - PAD * 2 - labelWidth) / candles.length;
  const x = (index: number) => PAD + labelWidth + step * (index + 0.5);
  const y = (price: number) => plotTop + ((top - price) / (top - bottom)) * (H - PAD - plotTop);
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

  const windowShapes = windows
    .map((span) => {
      const left = x(span.from) - step * 0.5;
      const right = x(span.to) + step * 0.5;
      return (
        (span.shade === false
          ? ""
          : `<rect x="${left}" y="${PAD}" width="${right - left}" height="${H - PAD * 2}" fill="var(--color-rule)" fill-opacity="0.4"/>`) +
        `<text x="${(left + right) / 2}" y="${PAD + 14}" text-anchor="middle" font-size="13" font-weight="600" fill="var(--color-ink-soft)">${span.label}</text>`
      );
    })
    .join("");

  const legShape = leg
    ? `<line x1="${x(leg.start)}" y1="${y(candles[leg.start][2])}" x2="${x(leg.end)}" y2="${y(candles[leg.end][1])}" stroke="var(--color-ink)" stroke-width="2.5" stroke-linecap="round"/>` +
      `<text x="${x(leg.start) - step * 0.5}" y="${y(candles[leg.start][2]) + 17}" font-size="13" font-weight="600" fill="var(--color-ink)">${leg.startLabel}</text>` +
      `<text x="${x(leg.end) + step * 0.5}" y="${y(candles[leg.end][1]) - 8}" text-anchor="end" font-size="13" font-weight="600" fill="var(--color-ink)">${leg.endLabel}</text>`
    : "";

  return (
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}" class="h-auto w-full bg-surface">` +
    windowShapes +
    zoneShape +
    levelShape +
    bars +
    legShape +
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
  band?: { top: number; bottom: number; from?: number; label?: string };
  /** Kotak berwarna dengan batas kiri dan kanan, misalnya kisaran harga. Namanya ditulis di atas kotak. */
  boxes?: { from: number; to: number; top: number; bottom: number; label?: string }[];
  /** Jalur rencana yang digambar putus-putus dengan panah di ujungnya, misalnya skenario di peta. */
  plan?: [number, number][];
  /** Garis putus-putus pendek dari swing yang ditembus sampai titik tembusnya, dengan tulisan (bawaan "BOS"). */
  breaks?: { from: number; to: number; y: number; label?: string; place?: "above" | "below"; labelAt?: number }[];
  /** Garis tegak berwarna merah antara dua harga, misalnya jarak stop. Tulisannya di bawah ujung bawah. */
  spans?: { x: number; from: number; to: number; label: string }[];
  /** Lingkaran bernomor, misalnya urutan langkah yang dijelaskan di teks. */
  steps?: { x: number; y: number; n: number }[];
  /** Ruang di kanan untuk tulisan level. */
  rightSpace?: number;
  arrow?: boolean;
}): string {
  const { label, points, minor, segments = [], levels = [], band, boxes = [], plan, breaks = [], spans = [], steps = [], arrow = true } = options;
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
    ? `<rect x="${x(band.from ?? 0)}" y="${y(band.top)}" width="${x(100) - x(band.from ?? 0)}" height="${y(band.bottom) - y(band.top)}" fill="var(--color-mark)" fill-opacity="0.4"/>` +
      (band.label ? text(x(100) + 6, (y(band.top) + y(band.bottom)) / 2 + 4, band.label) : "")
    : "";
  const boxShapes = boxes
    .map(
      (box) =>
        `<rect x="${x(box.from)}" y="${y(box.top)}" width="${x(box.to) - x(box.from)}" height="${y(box.bottom) - y(box.top)}" fill="var(--color-mark)" fill-opacity="0.4"/>` +
        (box.label ? text(x(box.from), y(box.top) - 7, box.label) : ""),
    )
    .join("");
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

  /** Kepala panah di titik `to`, searah ruas dari `from`. Koordinat 0-100. */
  const arrowhead = (from: [number, number], to: [number, number]) => {
    const ex = x(to[0]);
    const ey = y(to[1]);
    const angle = Math.atan2(ey - y(from[1]), ex - x(from[0]));
    const size = 9;
    const corner = (offset: number) =>
      `${ex - size * Math.cos(angle + offset)},${ey - size * Math.sin(angle + offset)}`;
    return `<polygon points="${ex},${ey} ${corner(0.45)} ${corner(-0.45)}" fill="var(--color-ink)"/>`;
  };

  let head = "";
  if (arrow && points.length > 1) {
    const end = points[points.length - 1];
    const before = points[points.length - 2];
    head = arrowhead([before.x, before.y], [end.x, end.y]);
  }

  const planShape =
    plan && plan.length > 1
      ? `<polyline points="${plan.map(([px, py]) => `${x(px)},${y(py)}`).join(" ")}" fill="none" stroke="var(--color-ink)" stroke-width="2" stroke-dasharray="6 5" stroke-linejoin="round"/>` +
        arrowhead(plan[plan.length - 2], plan[plan.length - 1])
      : "";

  const breakShapes = breaks
    .map(
      (mark) =>
        `<line x1="${x(mark.from)}" x2="${x(mark.to)}" y1="${y(mark.y)}" y2="${y(mark.y)}" stroke="var(--color-ink)" stroke-width="1.5" stroke-dasharray="4 3"/>` +
        (mark.label === "" ? "" : text(
          mark.labelAt === undefined ? (x(mark.from) + x(mark.to)) / 2 : x(mark.labelAt),
          y(mark.y) + (mark.place === "below" ? font + 5 : -6),
          mark.label ?? "BOS",
          ` text-anchor="middle" font-weight="600" fill="var(--color-ink)"`,
        )),
    )
    .join("");
  const spanShapes = spans
    .map((span) => {
      const sx = x(span.x);
      const upper = y(Math.max(span.from, span.to));
      const lower = y(Math.min(span.from, span.to));
      const cap = (cy: number) =>
        `<line x1="${sx - 5}" x2="${sx + 5}" y1="${cy}" y2="${cy}" stroke="var(--color-bear)" stroke-width="2"/>`;
      return (
        `<line x1="${sx}" x2="${sx}" y1="${upper}" y2="${lower}" stroke="var(--color-bear)" stroke-width="2"/>` +
        cap(upper) +
        cap(lower) +
        text(sx, lower + font + 6, span.label, ` text-anchor="middle" font-weight="600" fill="var(--color-bear-deep)"`)
      );
    })
    .join("");

  const stepShapes = steps
    .map(
      (step) =>
        `<circle cx="${x(step.x)}" cy="${y(step.y)}" r="9" fill="var(--color-ink)"/>` +
        `<text x="${x(step.x)}" y="${y(step.y) + 4}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--color-surface)">${step.n}</text>`,
    )
    .join("");

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
    boxShapes +
    bandShape +
    levelShapes +
    minorShape +
    path +
    head +
    planShape +
    breakShapes +
    spanShapes +
    stepShapes +
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

// ---------------------------------------------------------------------------------------------
// Gambar untuk Sesi 2 (market dynamic).

const balanceShift =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    swingChart({
      arrow: false,
      boxes: [{ from: 0, to: 100, top: 66, bottom: 34, label: "kisaran" }],
      points: [
        { x: 0, y: 46 },
        { x: 12, y: 64 },
        { x: 24, y: 37 },
        { x: 38, y: 62 },
        { x: 52, y: 36 },
        { x: 66, y: 63 },
        { x: 80, y: 38 },
        { x: 94, y: 61 },
        { x: 100, y: 52 },
      ],
      label: "Harga bolak-balik di dalam satu kotak kisaran.",
    }),
    "Seimbang: harga berputar",
    "Pembeli dan penjual sepakat pada satu kisaran, jadi harga bolak-balik di dalamnya.",
  ) +
  panel(
    swingChart({
      arrow: false,
      boxes: [
        { from: 0, to: 36, top: 32, bottom: 11, label: "kisaran lama" },
        { from: 56, to: 100, top: 89, bottom: 66, label: "kisaran baru" },
      ],
      points: [
        { x: 0, y: 20 },
        { x: 8, y: 30 },
        { x: 16, y: 13 },
        { x: 26, y: 30 },
        { x: 34, y: 15 },
        { x: 58, y: 80 },
        { x: 66, y: 68 },
        { x: 76, y: 87 },
        { x: 86, y: 69 },
        { x: 96, y: 85 },
        { x: 100, y: 77 },
      ],
      segments: [{ segment: 4, text: "expansion" }],
      label: "Harga berputar di kisaran bawah, naik cepat dalam satu gerakan panjang, lalu berputar lagi di kisaran yang lebih tinggi.",
    }),
    "Tidak seimbang: harga berpindah",
    "Satu pihak dominan. Harga pindah cepat (expansion) ke kisaran baru, lalu berputar lagi.",
  ) +
  `</div>` +
  `</figure>`;

/** Jam ramai tiga sesi dalam WIB. Sumbu mulai pukul 05.00 supaya sesi New York tidak terpotong tengah malam. */
function sessionHours(): string {
  const left = 92;
  const right = W - PAD;
  const start = 5;
  const hx = (hour: number) => left + ((hour - start) / 24) * (right - left);
  const axisY = 178;
  const rows = [
    { name: "Asia", from: 7, to: 16, text: "07.00–16.00" },
    { name: "London", from: 14, to: 23, text: "14.00–23.00" },
    { name: "New York", from: 19, to: 28, text: "19.00–04.00" },
  ];
  const overlap =
    `<rect x="${hx(19)}" y="36" width="${hx(23) - hx(19)}" height="${axisY - 36}" fill="var(--color-mark)" fill-opacity="0.4"/>` +
    `<text x="${(hx(19) + hx(23)) / 2}" y="28" text-anchor="middle" font-size="12" fill="var(--color-ink-soft)">paling ramai</text>`;
  const bars = rows
    .map((row, index) => {
      const cy = 60 + index * 40;
      return (
        `<text x="${PAD}" y="${cy + 4}" font-size="13" font-weight="600" fill="var(--color-ink)">${row.name}</text>` +
        `<rect x="${hx(row.from)}" y="${cy - 12}" width="${hx(row.to) - hx(row.from)}" height="24" fill="var(--color-ink)"/>` +
        `<text x="${(hx(row.from) + hx(row.to)) / 2}" y="${cy + 4}" text-anchor="middle" font-size="12" fill="var(--color-surface)">${row.text}</text>`
      );
    })
    .join("");
  const ticks = [7, 10, 13, 16, 19, 22, 25, 28]
    .map(
      (hour) =>
        `<line x1="${hx(hour)}" x2="${hx(hour)}" y1="${axisY}" y2="${axisY + 4}" stroke="var(--color-ink-soft)"/>` +
        `<text x="${hx(hour)}" y="${axisY + 18}" text-anchor="middle" font-size="12" fill="var(--color-ink-soft)">${String(hour % 24).padStart(2, "0")}</text>`,
    )
    .join("");
  return (
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Jam sesi dalam WIB: Asia 07.00 sampai 16.00, London 14.00 sampai 23.00, New York 19.00 sampai 04.00. London dan New York berbarengan pukul 19.00 sampai 23.00." class="h-auto w-full bg-surface">` +
    overlap +
    bars +
    `<line x1="${left}" x2="${right}" y1="${axisY}" y2="${axisY}" stroke="var(--color-ink-soft)"/>` +
    ticks +
    `<text x="${PAD}" y="${axisY + 18}" font-size="12" fill="var(--color-ink-soft)">jam WIB</text>` +
    `</svg>`
  );
}

const sessions =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(sessionHours(), "Jam sesi (WIB)", "Kolom kuning: London dan New York berbarengan, biasanya saat paling ramai.") +
  panel(
    candleChart({
      candles: [
        [44, 47, 42, 46],
        [46, 49, 44, 45],
        [45, 48, 43, 47],
        [47, 50, 45, 46],
        [46, 48, 41, 43],
        [43, 46, 41, 45],
        [45, 49, 44, 48],
        [48, 50, 46, 47],
        [47, 52, 46, 51],
        [51, 58, 50, 57],
        [57, 60, 53, 55],
        [55, 63, 54, 62],
      ],
      levels: [
        { price: 50, from: 0, label: "high Asia" },
        { price: 41, from: 0, label: "low Asia" },
      ],
      windows: [
        { from: 0, to: 7, label: "Asia" },
        { from: 8, to: 11, label: "London", shade: false },
      ],
      label: "Candle sesi Asia bergerak sempit di antara high dan low Asia. Saat London dibuka, harga keluar dari kisaran itu.",
    }),
    "Tandai kisaran Asia",
    "High dan low Asia menjadi acuan di sesi berikutnya. Arah keluarnya tidak selalu sama.",
  ) +
  `</div>` +
  `</figure>`;

/** Harga beli (ask) dan harga jual (bid) di sekitar rilis data. Jaraknya adalah spread. */
function spreadChart(): string {
  const right = 40;
  const xs = [0, 10, 20, 30, 40, 46, 52, 58, 64, 72, 80, 90, 100];
  const mid = [50, 51, 50, 52, 51, 51, 57, 61, 60, 61, 60, 61, 60];
  const half = [2, 2, 2, 2, 2, 7, 12, 8, 5, 3, 2, 2, 2];
  const top = PAD + 18;
  const bottom = H - PAD - 18;
  const x = (value: number) => PAD + (value / 100) * (W - PAD * 2 - right);
  const y = (value: number) => bottom - ((value - 30) / 50) * (bottom - top);
  const ask = xs.map((value, index) => `${x(value)},${y(mid[index] + half[index])}`);
  const bid = xs.map((value, index) => `${x(value)},${y(mid[index] - half[index])}`);
  const last = xs.length - 1;
  const line = (points: string[]) =>
    `<polyline points="${points.join(" ")}" fill="none" stroke="var(--color-ink)" stroke-width="2" stroke-linejoin="round"/>`;
  const label = (tx: number, ty: number, content: string, extra = "") =>
    `<text x="${tx}" y="${ty}" font-size="13" fill="var(--color-ink-soft)"${extra}>${content}</text>`;
  return (
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Garis harga beli (ask) dan harga jual (bid) berdekatan, lalu menjauh saat data dirilis, kemudian kembali berdekatan." class="h-auto w-full bg-surface">` +
    `<polygon points="${[...ask, ...[...bid].reverse()].join(" ")}" fill="var(--color-mark)" fill-opacity="0.4"/>` +
    `<line x1="${x(46)}" x2="${x(46)}" y1="${top}" y2="${bottom}" stroke="var(--color-ink-soft)" stroke-dasharray="4 4"/>` +
    label(x(46), H - PAD, "rilis", ` text-anchor="middle"`) +
    line(ask) +
    line(bid) +
    label(x(100) + 6, y(mid[last] + half[last]) - 2, "ask") +
    label(x(100) + 6, y(mid[last] - half[last]) + 12, "bid") +
    label(x(55), y(69) - 10, "spread melebar", ` font-weight="600" fill="var(--color-ink)"`) +
    `</svg>`
  );
}

const newsRelease =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    candleChart({
      labelWidth: 0,
      candles: [
        [50, 52, 48, 51],
        [51, 53, 49, 50],
        [50, 52, 48, 49],
        [49, 51, 47, 50],
        [50, 52, 49, 51],
        [51, 52, 49, 50],
        [50, 72, 30, 64],
        [64, 68, 58, 60],
        [60, 66, 57, 65],
        [65, 67, 61, 62],
        [62, 66, 60, 64],
        [64, 67, 62, 63],
        [63, 66, 61, 65],
      ],
      windows: [{ from: 5, to: 8, label: "jeda" }],
      marks: [{ index: 6, text: "rilis" }],
      label: "Candle kecil-kecil sebelum rilis, lalu satu candle sangat panjang dengan sumbu jauh ke atas dan ke bawah saat data dirilis.",
    }),
    "Candle saat rilis",
    "Harga bisa bergerak jauh ke dua arah dalam satu candle. Di area abu-abu (jeda), jangan membuka posisi baru.",
  ) +
  panel(spreadChart(), "Spread saat rilis", "Jarak harga beli (ask) dan harga jual (bid) melebar, lalu menyempit lagi.") +
  `</div>` +
  `</figure>`;

const mapLeg = { start: 10, end: 88 };
const mapLevel = (ratio: number) => fib(mapLeg.start, mapLeg.end, ratio);

const marketMap =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    swingChart({
      rightSpace: 40,
      arrow: false,
      points: [
        { x: 12, y: mapLeg.start, label: "swing low", place: "below" },
        { x: 46, y: mapLeg.end, label: "swing high" },
      ],
      band: { top: mapLevel(0.618), bottom: mapLevel(0.81), from: 46, label: "area" },
      levels: [{ y: mapLeg.start, label: "batal", from: 12, strong: true }],
      plan: [
        [46, mapLeg.end],
        [70, mapLevel(0.7)],
        [96, 96],
      ],
      label: "Peta di timeframe besar: leg naik dari swing low ke swing high, area kuning antara Fibonacci 0,618 dan 0,81, garis batal di swing low, dan garis putus-putus berupa skenario turun ke area lalu naik lagi.",
    }),
    "Timeframe besar (D1 atau H4)",
    "Tandai leg terakhir, area 0,618 sampai 0,81, dan level yang membatalkan peta. Garis putus-putus hanya skenario, belum tentu terjadi.",
  ) +
  panel(
    swingChart({
      rightSpace: 40,
      band: { top: 56, bottom: 30, label: "area" },
      levels: [{ y: 10, label: "batal", strong: true }],
      points: [
        { x: 0, y: 94 },
        { x: 10, y: 76 },
        { x: 16, y: 84 },
        { x: 28, y: 62 },
        { x: 34, y: 70 },
        { x: 46, y: 48 },
        { x: 52, y: 56 },
        { x: 62, y: 36 },
        { x: 70, y: 52 },
        { x: 76, y: 44 },
        { x: 88, y: 70 },
        { x: 94, y: 62 },
        { x: 100, y: 86 },
      ],
      label: "Di timeframe kecil, harga turun dalam swing-swing kecil masuk ke area kuning, lalu berbalik naik tanpa menyentuh garis batal.",
    }),
    "Timeframe kecil",
    "Saat harga masuk area, baca struktur minornya. Caranya dibahas mulai Sesi 3.",
  ) +
  `</div>` +
  `</figure>`;

const legReality =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    swingChart({
      arrow: false,
      points: [
        { x: 10, y: 6, label: "awal leg", place: "below" },
        { x: 90, y: 94, label: "ujung leg" },
      ],
      label: "Di buku, satu leg naik digambar sebagai satu garis lurus.",
    }),
    "Di buku",
    "Satu leg digambar sebagai satu garis lurus.",
  ) +
  panel(
    candleChart({
      labelWidth: 0,
      candles: [
        [22, 26, 18, 25],
        [25, 30, 24, 29],
        [29, 33, 26, 27],
        [27, 28, 23, 24],
        [24, 32, 23, 31],
        [31, 38, 30, 37],
        [37, 40, 33, 34],
        [34, 35, 30, 31],
        [31, 40, 30, 39],
        [39, 47, 38, 46],
        [46, 48, 41, 42],
        [42, 43, 38, 40],
        [40, 49, 39, 48],
        [48, 56, 47, 55],
        [55, 57, 50, 51],
        [51, 60, 50, 59],
        [59, 66, 58, 65],
        [65, 67, 60, 61],
        [61, 70, 60, 69],
        [69, 76, 68, 75],
      ],
      leg: { start: 0, end: 19, startLabel: "awal leg", endLabel: "ujung leg" },
      label: "Di chart nyata, leg yang sama terdiri dari banyak candle yang naik turun. Garis lurus ditarik dari low candle pertama ke high candle terakhir.",
    }),
    "Di chart nyata",
    "Leg yang sama berisi banyak naik turun kecil. Ukur dari awal sampai ujungnya saja.",
  ) +
  `</div>` +
  `</figure>`;

// ---------------------------------------------------------------------------------------------
// Gambar untuk Sesi 3 (break of structure).

const upSwings: SwingPoint[] = [
  { x: 0, y: 5 },
  { x: 20, y: 42 },
  { x: 32, y: 24 },
  { x: 54, y: 66 },
  { x: 66, y: 48 },
  { x: 88, y: 92 },
];

const bosDirection =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    swingChart({
      points: upSwings,
      breaks: [
        { from: 20, to: 46, y: 42 },
        { from: 54, to: 77, y: 66 },
      ],
      label: "Uptrend: setiap kali harga naik melewati swing high sebelumnya, terjadi BOS.",
    }),
    "Bullish BOS",
    "Candle ditutup di atas swing high terakhir. Uptrend masih berjalan.",
  ) +
  panel(
    swingChart({
      points: upSwings.map((point) => ({ ...point, y: 100 - point.y })),
      breaks: [
        { from: 20, to: 46, y: 58, place: "below" },
        { from: 54, to: 77, y: 34, place: "below" },
      ],
      label: "Downtrend: setiap kali harga turun melewati swing low sebelumnya, terjadi BOS.",
    }),
    "Bearish BOS",
    "Candle ditutup di bawah swing low terakhir. Downtrend masih berjalan.",
  ) +
  `</div>` +
  `</figure>`;

const swingLevels: Level[] = [
  { price: 52, from: 2, label: "swing high" },
  { price: 37, from: 2, label: "low candle" },
];

const bosCorrection =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    candleChart({
      candles: [
        [20, 30, 18, 28],
        [28, 40, 27, 38],
        [38, 52, 37, 50],
        [50, 51, 45, 47],
        [47, 49, 44, 46],
        [46, 58, 45, 56],
      ],
      levels: swingLevels,
      label: "Koreksi kecil berhenti jauh di atas low candle pembentuk swing high, lalu harga naik melewati swing high.",
    }),
    "Tanpa koreksi: belum BOS",
    "Koreksi berhenti di atas low candle pembentuk swing. Kenaikan berikutnya masih leg yang sama.",
  ) +
  panel(
    candleChart({
      candles: [
        [20, 30, 18, 28],
        [28, 40, 27, 38],
        [38, 52, 37, 50],
        [50, 51, 42, 44],
        [44, 45, 32, 34],
        [34, 46, 33, 45],
        [45, 60, 44, 58],
      ],
      levels: swingLevels,
      label: "Koreksi turun melewati low candle pembentuk swing high, lalu candle terakhir ditutup di atas swing high.",
    }),
    "Ada koreksi: BOS sah",
    "Harga turun melewati low candle pembentuk swing, lalu ditutup di atas swing high.",
  ) +
  `</div>` +
  `</figure>`;

// Leg BOS dari higher low (30) ke puncak baru (90).
const bosLeg: SwingPoint[] = [
  { x: 0, y: 18 },
  { x: 20, y: 56 },
  { x: 34, y: 30, label: "higher low", place: "below" },
  { x: 58, y: 90 },
];
const bosLevel = (ratio: number) => fib(30, 90, ratio);
const afterBosPlan: [number, number][] = [
  [58, 90],
  [78, bosLevel(0.7)],
  [98, 98],
];

const bosRetracement =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    swingChart({
      rightSpace: 40,
      arrow: false,
      points: bosLeg,
      breaks: [{ from: 20, to: 46, y: 56 }],
      band: { top: bosLevel(0.618), bottom: bosLevel(0.81), from: 58, label: "area" },
      plan: afterBosPlan,
      label: "Setelah BOS, Fibonacci ditarik dari higher low ke puncak baru. Garis putus-putus: harga terkoreksi ke area 0,618 sampai 0,81 sebelum naik lagi.",
    }),
    "Tunggu retracement",
    "Leg yang menghasilkan BOS dipakai untuk Fibonacci. Area yang ditunggu tetap 0,618 sampai 0,81.",
  ) +
  panel(
    swingChart({
      rightSpace: 40,
      arrow: false,
      points: bosLeg.map(({ x, y }) => ({ x, y })),
      levels: [{ y: 30, from: 34, label: "batal", strong: true }],
      plan: afterBosPlan,
      spans: [
        { x: 58, from: 90, to: 30, label: "kejar" },
        { x: 78, from: bosLevel(0.7), to: 30, label: "tunggu" },
      ],
      label: "Garis merah tegak menunjukkan jarak dari titik masuk ke level batal. Masuk tepat setelah BOS jaraknya jauh lebih panjang daripada masuk di area koreksi.",
    }),
    "Mengejar atau menunggu",
    "Garis merah adalah jarak stop sampai level batal di higher low. Mengejar tepat setelah BOS membuatnya paling lebar.",
  ) +
  `</div>` +
  `</figure>`;

// ---------------------------------------------------------------------------------------------
// Gambar untuk Sesi 4 (change of character).

/** Membalik gambar naik menjadi gambar turun: harga dicerminkan, tulisan di atas pindah ke bawah. */
const flip = (value: number) => 100 - value;
const flipPoints = (points: SwingPoint[]): SwingPoint[] =>
  points.map((point) => ({ ...point, y: flip(point.y), place: point.place === "below" ? "above" : "below" }));

const chochUp: SwingPoint[] = [
  { x: 0, y: 10 },
  { x: 18, y: 50 },
  { x: 30, y: 32 },
  { x: 52, y: 72 },
  { x: 64, y: 52, label: "HL", place: "below" },
  { x: 80, y: 84 },
  { x: 100, y: 30 },
];

const chochDirection =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    swingChart({
      points: chochUp,
      breaks: [
        { from: 18, to: 42, y: 50 },
        { from: 52, to: 76, y: 72 },
        { from: 64, to: 94, y: 52, label: "ChoCh", place: "below" },
      ],
      label: "Uptrend dengan dua BOS, lalu harga turun dan ditutup di bawah higher low yang mendahului BOS terakhir. Itulah ChoCh.",
    }),
    "ChoCh pada uptrend",
    "Candle ditutup di bawah higher low (HL) yang mendahului BOS terakhir.",
  ) +
  panel(
    swingChart({
      points: flipPoints(chochUp).map((point) => (point.label ? { ...point, label: "LH" } : point)),
      breaks: [
        { from: 18, to: 42, y: flip(50), place: "below" },
        { from: 52, to: 76, y: flip(72), place: "below" },
        { from: 64, to: 94, y: flip(52), label: "ChoCh" },
      ],
      label: "Downtrend dengan dua BOS, lalu harga naik dan ditutup di atas lower high yang mendahului BOS terakhir. Itulah ChoCh.",
    }),
    "ChoCh pada downtrend",
    "Candle ditutup di atas lower high (LH) yang mendahului BOS terakhir.",
  ) +
  `</div>` +
  `</figure>`;

// Uptrend yang terkena ChoCh: higher low di 45 ditembus oleh penurunan ke 35.
const afterChoch: SwingPoint[] = [
  { x: 0, y: 25 },
  { x: 16, y: 60 },
  { x: 28, y: 45 },
  { x: 42, y: 85 },
  { x: 54, y: 35 },
];
const chochMark = { from: 28, to: 53, y: 45, label: "ChoCh", place: "below" as const };

const chochOutcomes =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-3">` +
  panel(
    swingChart({
      ...SMALL,
      points: [...afterChoch, { x: 66, y: 60 }, { x: 82, y: 18 }],
      breaks: [chochMark, { from: 54, to: 78, y: 35, place: "below" }],
      label: "Setelah ChoCh, harga membentuk lower high lalu menembus low berikutnya. BOS turun mengonfirmasi downtrend.",
    }),
    "Berbalik",
    "Lower high terbentuk, lalu BOS turun mengonfirmasi downtrend.",
  ) +
  panel(
    swingChart({
      ...SMALL,
      arrow: false,
      boxes: [{ from: 54, to: 100, top: 85, bottom: 35 }],
      points: [...afterChoch, { x: 64, y: 74 }, { x: 74, y: 40 }, { x: 84, y: 76 }, { x: 94, y: 38 }, { x: 100, y: 55 }],
      breaks: [chochMark],
      label: "Setelah ChoCh, harga bolak-balik di antara high dan low terakhir tanpa arah yang jelas.",
    }),
    "Mendatar",
    "Harga berputar di antara high dan low terakhir.",
  ) +
  panel(
    swingChart({
      ...SMALL,
      points: [...afterChoch, { x: 66, y: 62 }, { x: 74, y: 50 }, { x: 96, y: 97 }],
      breaks: [chochMark, { from: 42, to: 92, y: 85 }],
      label: "Setelah ChoCh, harga naik lagi dan menembus high terakhir. Uptrend berlanjut.",
    }),
    "Gagal",
    "High terakhir ditembus. Penurunan tadi hanya retracement yang dalam.",
  ) +
  `</div>` +
  `</figure>`;

const chochTimeframe =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    swingChart({
      rightSpace: 40,
      points: [
        { x: 0, y: 10 },
        { x: 40, y: 88 },
        { x: 68, y: 33 },
        { x: 96, y: 96 },
      ],
      segments: [{ segment: 1, text: "koreksi" }],
      band: { top: fib(10, 88, 0.618), bottom: fib(10, 88, 0.81), from: 40, label: "area" },
      label: "Di H4, uptrend terkoreksi turun ke area 0,618 sampai 0,81, lalu naik lagi.",
    }),
    "H4: koreksi di dalam uptrend",
    "Harga turun ke area 0,618 sampai 0,81, tetapi tren major masih naik.",
  ) +
  panel(
    swingChart({
      rightSpace: 40,
      band: { top: 40, bottom: 20, label: "area" },
      points: [
        { x: 0, y: 95 },
        { x: 12, y: 70 },
        { x: 20, y: 80, label: "LH" },
        { x: 34, y: 55 },
        { x: 42, y: 66, label: "LH" },
        { x: 56, y: 40 },
        { x: 64, y: 50 },
        { x: 76, y: 28 },
        { x: 100, y: 84 },
      ],
      breaks: [{ from: 64, to: 90, y: 50, label: "ChoCh" }],
      label: "Koreksi yang sama di M15 tampak sebagai downtrend dengan lower high. Di dalam area, harga ditutup di atas lower high terakhir: ChoCh ke atas.",
    }),
    "M15: ChoCh ke atas",
    "Di M15 koreksi tampak sebagai downtrend. ChoCh ke atas adalah tanda awal koreksi selesai.",
  ) +
  `</div>` +
  `</figure>`;

// Satu putaran dari uptrend ke downtrend. Nomor lingkaran sesuai lima langkah di teks.
const cycleUp: SwingPoint[] = [
  { x: 0, y: 8 },
  { x: 12, y: 38 },
  { x: 18, y: 26 },
  { x: 30, y: 60 },
  { x: 37, y: 46 },
  { x: 50, y: 82 },
  { x: 58, y: 64 },
  { x: 66, y: 77 },
  { x: 76, y: 40 },
  { x: 84, y: 56 },
  { x: 100, y: 14 },
];
const cycleBreaks = [
  { from: 12, to: 23, y: 38 },
  { from: 30, to: 43, y: 60 },
  { from: 50, to: 68, y: 82 },
  { from: 37, to: 76, y: 46 },
  { from: 76, to: 92, y: 40 },
].map((mark) => ({ ...mark, label: "" }));
const cycleSteps = [
  { x: 21, y: 58, n: 1 },
  { x: 66, y: 91, n: 2 },
  { x: 68, y: 34, n: 3 },
  { x: 96, y: 48, n: 4 },
  { x: 88, y: 10, n: 5 },
];

const trendCycle =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    swingChart({
      points: cycleUp,
      breaks: cycleBreaks,
      steps: cycleSteps,
      label: "Satu putaran: uptrend dengan BOS berulang (1), puncak baru gagal terbentuk (2), ChoCh menembus higher low (3), BOS turun pertama (4), lalu downtrend berjalan (5).",
    }),
    "Dari uptrend ke downtrend",
    "1 BOS berulang, 2 gagal membuat BOS, 3 ChoCh, 4 BOS pertama ke arah baru, 5 tren baru berjalan.",
  ) +
  panel(
    swingChart({
      points: flipPoints(cycleUp),
      breaks: cycleBreaks.map((mark) => ({ ...mark, y: flip(mark.y) })),
      steps: cycleSteps.map((step) => ({ ...step, y: flip(step.y) })),
      label: "Putaran sebaliknya: downtrend dengan BOS berulang (1), lembah baru gagal terbentuk (2), ChoCh menembus lower high (3), BOS naik pertama (4), lalu uptrend berjalan (5).",
    }),
    "Dari downtrend ke uptrend",
    "Urutan yang sama, arahnya terbalik.",
  ) +
  `</div>` +
  `</figure>`;

// ---------------------------------------------------------------------------------------------
// Gambar untuk Sesi 5 (jebakan struktur).

const fakeRetracement =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    swingChart({
      points: [
        { x: 0, y: 8 },
        { x: 30, y: 62 },
        { x: 36, y: 54, label: "HL?", place: "below" },
        { x: 52, y: 90 },
        { x: 78, y: 33 },
        { x: 100, y: 94 },
      ],
      breaks: [{ from: 36, to: 70, y: 54, label: "ChoCh?", place: "below" }],
      label: "Lembah kecil setelah koreksi dangkal diberi label higher low. Saat koreksi sebenarnya datang, lembah itu tertembus dan terbaca sebagai ChoCh, lalu harga naik lagi.",
    }),
    "Ditandai terlalu cepat",
    "Lembah kecil diberi label HL. Saat koreksi sebenarnya datang, lembah itu tertembus dan terbaca sebagai ChoCh.",
  ) +
  panel(
    swingChart({
      rightSpace: 40,
      points: [
        { x: 0, y: 8 },
        { x: 44, y: 70 },
        { x: 54, y: 58, label: "bukan swing", place: "below" },
        { x: 84, y: 96 },
      ],
      levels: [{ y: fib(8, 70, 0.5), label: "0,5", strong: true }],
      label: "Fibonacci ditarik dari awal leg sampai puncaknya. Koreksi berhenti jauh di atas level 0,5, jadi lembahnya belum menjadi swing.",
    }),
    "Ukur dengan Fibonacci",
    "Koreksi belum sampai 0,5 dari leg-nya. Lembah itu belum swing, jadi leg masih berlanjut.",
  ) +
  `</div>` +
  `</figure>`;

// Leg dari 8 ke 92, dengan puncak kecil (58) dan koreksi dangkal (50) di tengahnya.
const fakeBosPoints: SwingPoint[] = [
  { x: 0, y: 8 },
  { x: 36, y: 58 },
  { x: 46, y: 50 },
  { x: 70, y: 92 },
];

const fakeBos =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    swingChart({
      rightSpace: 40,
      arrow: false,
      points: fakeBosPoints,
      breaks: [{ from: 36, to: 52, y: 58, label: "BOS?", labelAt: 39 }],
      band: { top: fib(50, 92, 0.618), bottom: fib(50, 92, 0.81), from: 70, label: "area?" },
      label: "Puncak kecil ditembus dan diberi label BOS. Fibonacci ditarik dari lembah kecil, sehingga area yang ditunggu berada terlalu tinggi.",
    }),
    "Fake BOS",
    "Puncak kecil dari koreksi dangkal ditembus. Fibonacci ditarik pada leg yang salah, jadi area terlalu tinggi.",
  ) +
  panel(
    swingChart({
      rightSpace: 40,
      arrow: false,
      points: fakeBosPoints,
      band: { top: fib(8, 92, 0.618), bottom: fib(8, 92, 0.81), from: 70, label: "area" },
      label: "Leg yang sama diukur dari awal sampai puncak. Area 0,618 sampai 0,81 berada jauh lebih rendah.",
    }),
    "Leg yang benar",
    "Leg diukur dari awal sampai puncaknya. Area yang ditunggu jauh lebih rendah.",
  ) +
  `</div>` +
  `</figure>`;

const confusionStructure =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    swingChart({
      arrow: false,
      points: [
        { x: 0, y: 40 },
        { x: 10, y: 70 },
        { x: 18, y: 48 },
        { x: 28, y: 76 },
        { x: 36, y: 34 },
        { x: 46, y: 60 },
        { x: 54, y: 28 },
        { x: 64, y: 72 },
        { x: 72, y: 44 },
        { x: 82, y: 80 },
        { x: 90, y: 38 },
        { x: 100, y: 62 },
      ],
      breaks: [
        { from: 10, to: 27, y: 70 },
        { from: 18, to: 34, y: 48, label: "ChoCh", place: "below" },
        { from: 36, to: 53, y: 34, place: "below" },
        { from: 46, to: 62, y: 60, label: "ChoCh" },
      ],
      label: "Di timeframe kecil, harga berputar dan membentuk BOS dan ChoCh bergantian ke atas dan ke bawah.",
    }),
    "Timeframe kecil",
    "BOS dan ChoCh muncul bergantian. Arah tampak berubah setiap beberapa candle.",
  ) +
  panel(
    swingChart({
      rightSpace: 44,
      arrow: false,
      boxes: [{ from: 66, to: 100, top: 94, bottom: 60, label: "kisaran" }],
      points: [
        { x: 0, y: 10 },
        { x: 30, y: 62 },
        { x: 42, y: 40 },
        { x: 66, y: 90 },
        { x: 72, y: 72 },
        { x: 78, y: 84 },
        { x: 84, y: 66 },
        { x: 90, y: 80 },
        { x: 96, y: 64 },
        { x: 100, y: 74 },
      ],
      levels: [{ y: 40, from: 42, label: "major", strong: true }],
      label: "Di timeframe besar, putaran tadi hanya kisaran kecil di atas uptrend. Swing major di bawahnya belum ditembus.",
    }),
    "Naik satu tingkat",
    "Di timeframe besar, putaran itu hanya kisaran kecil. Selama swing major belum ditembus, arah peta tetap.",
  ) +
  `</div>` +
  `</figure>`;

/** Mencerminkan candle naik-turun, untuk membuat versi swing low dari contoh swing high. */
const mirrorCandle = ([open, high, low, close]: Candle): Candle => [100 - open, 100 - low, 100 - high, 100 - close];

// Wick menembus swing high (52) sampai 64 lalu ditutup di 47. Candle ke-10 kembali ke zona dan ditolak lagi.
const rejectionHigh: Candle[] = [
  [30, 38, 29, 37],
  [37, 46, 36, 44],
  [44, 52, 43, 50],
  [50, 51, 44, 46],
  [46, 48, 40, 42],
  [42, 49, 41, 48],
  [48, 64, 46, 47],
  [47, 49, 43, 44],
  [44, 47, 41, 46],
  [46, 58, 45, 45],
  [45, 46, 38, 39],
];

const rejectionBlock =
  `<figure>` +
  `<div class="grid gap-6 sm:grid-cols-2">` +
  panel(
    candleChart({
      candles: rejectionHigh,
      level: { price: 52, from: 2, label: "swing high" },
      zone: { top: 64, bottom: 48, from: 6, label: "rejection" },
      label: "Sebuah candle menembus swing high dengan wick panjang lalu ditutup di bawahnya. Zona wick itu ditandai. Beberapa candle kemudian harga kembali ke zona dan ditolak lagi.",
    }),
    "Di swing high",
    "Wick menembus swing high, lalu candle ditutup di bawahnya. Saat harga kembali ke zona, perhatikan apakah penolakan terulang.",
  ) +
  panel(
    candleChart({
      candles: rejectionHigh.map(mirrorCandle),
      level: { price: 48, from: 2, label: "swing low" },
      zone: { top: 52, bottom: 36, from: 6, label: "rejection" },
      label: "Sebuah candle menembus swing low dengan wick panjang lalu ditutup di atasnya. Zona wick itu ditandai. Beberapa candle kemudian harga kembali ke zona dan ditolak lagi.",
    }),
    "Di swing low",
    "Sama, arahnya terbalik: wick menembus swing low, lalu candle ditutup di atasnya.",
  ) +
  `</div>` +
  `</figure>`;

export const figures: Record<string, string> = {
  "fake-retracement": fakeRetracement,
  "fake-bos": fakeBos,
  "confusion-structure": confusionStructure,
  "rejection-block": rejectionBlock,
  "choch-arah": chochDirection,
  "choch-kemungkinan": chochOutcomes,
  "choch-timeframe": chochTimeframe,
  "siklus-tren": trendCycle,
  "bos-arah": bosDirection,
  "bos-koreksi": bosCorrection,
  "bos-retracement": bosRetracement,
  "seimbang-berpindah": balanceShift,
  "jam-sesi": sessions,
  "rilis-berita": newsRelease,
  "peta-pasar": marketMap,
  "leg-chart-nyata": legReality,
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
