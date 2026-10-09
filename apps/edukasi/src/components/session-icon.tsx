import type { ReactNode } from "react";

/**
 * Ikon kecil untuk tiap sesi, digambar dengan bahasa visual yang sama dengan gambar di dalam materi:
 * candle, garis level putus-putus, dan zona berwarna. Nama ikon ditulis di frontmatter materi (`icon:`).
 */
const INK = "var(--color-ink)";
const SOFT = "var(--color-ink-soft)";
const BULL = "var(--color-bull)";
const BEAR = "var(--color-bear)";
const MARK = "var(--color-mark)";

/** Candle: sumbu dari `high` ke `low`, badan dari `top` ke `bottom` (koordinat layar, 0 di atas). */
function Candle({ x, high, low, top, bottom, color }: { x: number; high: number; low: number; top: number; bottom: number; color: string }) {
  return (
    <g>
      <line x1={x} x2={x} y1={high} y2={low} stroke={color} strokeWidth="2" />
      <rect x={x - 3.5} y={top} width="7" height={bottom - top} fill={color} />
    </g>
  );
}

function Level({ y, from = 6, to = 42 }: { y: number; from?: number; to?: number }) {
  return <line x1={from} x2={to} y1={y} y2={y} stroke={INK} strokeWidth="1.5" strokeDasharray="3 3" />;
}

function Zone({ top, bottom }: { top: number; bottom: number }) {
  return <rect x="6" y={top} width="36" height={bottom - top} fill={MARK} fillOpacity="0.45" />;
}

const line = { fill: "none", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const icons = {
  // Zigzag naik: higher high dan higher low.
  "market-structure": (
    <>
      <polyline points="6,40 16,24 22,31 32,14 37,21 43,8" stroke={INK} {...line} />
      <circle cx="16" cy="24" r="2.75" fill={BULL} />
      <circle cx="32" cy="14" r="2.75" fill={BULL} />
      <circle cx="22" cy="31" r="2.75" fill={BEAR} />
      <circle cx="37" cy="21" r="2.75" fill={BEAR} />
    </>
  ),
  // Harga berputar di dalam kisaran, lalu berpindah.
  "market-dynamic": (
    <>
      <line x1="6" x2="26" y1="27" y2="27" stroke={SOFT} strokeWidth="1.5" />
      <line x1="6" x2="26" y1="39" y2="39" stroke={SOFT} strokeWidth="1.5" />
      <polyline points="7,35 12,30 17,36 22,31 26,33" stroke={INK} {...line} />
      <polyline points="26,33 41,10" stroke={BULL} {...line} />
      <polyline points="33,10 41,10 41,18" stroke={BULL} {...line} />
    </>
  ),
  // Candle ditutup di atas level.
  "break-of-structure": (
    <>
      <Level y={20} />
      <Candle x={13} high={20} low={42} top={24} bottom={38} color={BULL} />
      <Candle x={24} high={24} low={37} top={27} bottom={34} color={BEAR} />
      <Candle x={35} high={7} low={34} top={10} bottom={31} color={BULL} />
    </>
  ),
  // Uptrend yang menembus higher low-nya sendiri.
  "change-of-character": (
    <>
      <Level y={25} from={16} to={44} />
      <polyline points="6,31 14,16 20,25 28,8" stroke={INK} {...line} />
      <polyline points="28,8 34,22 42,41" stroke={BEAR} {...line} />
    </>
  ),
  // Harga menembus level sebentar, lalu kembali.
  "structure-trap": (
    <>
      <Level y={18} />
      <polyline points="6,40 15,27 21,33" stroke={INK} {...line} />
      <polyline points="21,33 30,9 36,25" stroke={BEAR} {...line} />
      <polyline points="36,25 42,31" stroke={INK} {...line} />
    </>
  ),
  // Candle turun terakhir di dalam zona, lalu gerakan naik yang kuat.
  "order-block": (
    <>
      <Zone top={26} bottom={39} />
      <Candle x={13} high={24} low={41} top={28} bottom={37} color={BEAR} />
      <Candle x={25} high={9} low={36} top={12} bottom={34} color={BULL} />
      <Candle x={37} high={5} low={16} top={7} bottom={14} color={BULL} />
    </>
  ),
  // Celah di antara candle pertama dan ketiga.
  imbalance: (
    <>
      <Zone top={20} bottom={30} />
      <Candle x={11} high={30} low={43} top={33} bottom={41} color={BULL} />
      <Candle x={24} high={10} low={35} top={13} bottom={33} color={BULL} />
      <Candle x={37} high={5} low={20} top={7} bottom={16} color={BULL} />
    </>
  ),
  // Order yang menunggu di bawah level, disapu oleh wick.
  liquidity: (
    <>
      <Level y={29} />
      <circle cx="11" cy="36" r="2.5" fill={MARK} />
      <circle cx="19" cy="36" r="2.5" fill={MARK} />
      <circle cx="27" cy="36" r="2.5" fill={MARK} />
      <Candle x={36} high={11} low={43} top={14} bottom={23} color={BULL} />
    </>
  ),
  // Jarak ke target di atas garis entry, jarak ke stop di bawahnya.
  "risk-plan": (
    <>
      <rect x="13" y="8" width="22" height="22" fill={BULL} fillOpacity="0.3" />
      <rect x="13" y="30" width="22" height="11" fill={BEAR} fillOpacity="0.3" />
      <line x1="13" x2="35" y1="8" y2="8" stroke={BULL} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="13" x2="35" y1="41" y2="41" stroke={BEAR} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="6" x2="42" y1="30" y2="30" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  // Halaman jurnal dengan dua baris yang sudah dicentang.
  journal: (
    <>
      <rect x="10" y="6" width="28" height="36" stroke={INK} {...line} />
      <polyline points="15,16 17.5,18.5 22,13" stroke={BULL} {...line} />
      <line x1="26" x2="33" y1="16" y2="16" stroke={SOFT} strokeWidth="2" strokeLinecap="round" />
      <polyline points="15,26 17.5,28.5 22,23" stroke={BULL} {...line} />
      <line x1="26" x2="33" y1="26" y2="26" stroke={SOFT} strokeWidth="2" strokeLinecap="round" />
      <circle cx="18.5" cy="35" r="2.5" stroke={SOFT} strokeWidth="2" fill="none" />
      <line x1="26" x2="33" y1="35" y2="35" stroke={SOFT} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type SessionIconName = keyof typeof icons;

export function isSessionIconName(value: unknown): value is SessionIconName {
  return typeof value === "string" && value in icons;
}

/** Ikon tanpa latar. Hanya hiasan: judul sesi selalu tertulis di sebelahnya. */
export function SessionIcon({ name, size = "md" }: { name: SessionIconName; size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-16 sm:size-20" : "size-12 sm:size-16";
  return (
    // Gambar memakai kotak 48 satuan; tepi kosongnya dipotong supaya ikon rata dengan tepi kolom.
    <svg viewBox="3 3 42 42" aria-hidden="true" className={`shrink-0 ${box}`}>
      {icons[name]}
    </svg>
  );
}
