/**
 * Grafik candlestick uptrend dengan anotasi struktur (HH, HL, BOS).
 * Digambar dari data tetap supaya bisa ikut dirender statis.
 */
type Candle = [open: number, high: number, low: number, close: number];

const candles: Candle[] = [
  [20, 27, 19, 26], [26, 33, 25, 32], [32, 36, 30, 31], [31, 40, 30, 39], [39, 46, 38, 45], [45, 50, 43, 48],
  [48, 49, 43, 44], [44, 45, 39, 40], [40, 42, 35, 37], [37, 40, 34, 36],
  [36, 43, 35, 42], [42, 47, 41, 46], [46, 53, 45, 52], [52, 55, 50, 51], [51, 60, 50, 59], [59, 66, 58, 65], [65, 72, 63, 70],
  [70, 71, 64, 65], [65, 66, 60, 61], [61, 63, 56, 58], [58, 61, 55, 60],
  [60, 68, 59, 67], [67, 75, 66, 74], [74, 80, 72, 79], [79, 88, 78, 86],
];

const W = 720;
const H = 380;
const PAD = { top: 28, right: 28, bottom: 28, left: 28 };
const step = (W - PAD.left - PAD.right) / candles.length;
const x = (index: number) => PAD.left + step * (index + 0.5);
const y = (price: number) => PAD.top + ((92 - price) / (92 - 14)) * (H - PAD.top - PAD.bottom);

function Level({ from, to, price, label }: { from: number; to: number; price: number; label: string }) {
  return (
    <g>
      <line x1={x(from)} x2={x(to)} y1={y(price)} y2={y(price)} stroke="var(--color-ink)" strokeWidth="1.5" strokeDasharray="5 4" />
      <text x={(x(from) + x(to)) / 2 + step} y={y(price) - 9} textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--color-ink)">
        {label}
      </text>
    </g>
  );
}

function Swing({ index, price, label, above }: { index: number; price: number; label: string; above: boolean }) {
  return (
    <text x={x(index)} y={y(price) + (above ? -10 : 22)} textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--color-ink-soft)">
      {label}
    </text>
  );
}

export function StructureChart() {
  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Grafik candlestick uptrend: harga membentuk higher high dan higher low, dan setiap break of structure didahului pullback."
        className="h-auto w-full"
      >
        {[30, 50, 70].map((price) => (
          <line key={price} x1={PAD.left} x2={W - PAD.right} y1={y(price)} y2={y(price)} stroke="var(--color-rule)" strokeWidth="1" />
        ))}
        <Level from={5} to={12} price={50} label="BOS" />
        <Level from={16} to={22} price={72} label="BOS" />
        {candles.map(([open, high, low, close], index) => {
          const up = close >= open;
          const color = up ? "var(--color-bull)" : "var(--color-bear)";
          return (
            <g key={index}>
              <line x1={x(index)} x2={x(index)} y1={y(high)} y2={y(low)} stroke={color} strokeWidth="2" />
              <rect x={x(index) - step * 0.32} y={y(Math.max(open, close))} width={step * 0.64} height={Math.max(Math.abs(y(open) - y(close)), 2)} fill={color} />
            </g>
          );
        })}
        <Swing index={5} price={50} label="HH" above />
        <Swing index={9} price={34} label="HL" above={false} />
        <Swing index={16} price={72} label="HH" above />
        <Swing index={20} price={55} label="HL" above={false} />
      </svg>
      <figcaption className="mt-3 text-sm text-ink-soft">
        Uptrend yang sehat: setiap break of structure (BOS) didahului pullback yang membentuk higher low (HL).
      </figcaption>
    </figure>
  );
}
