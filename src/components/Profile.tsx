import { useMemo } from 'react';
import { BodyModel } from '../engine/model';
import type { Species } from '../engine/types';

/** Lateral morphometric diagram (snout to the right, like the 3D side view). */
export default function Profile({ sp }: { sp: Species }) {
  const d = useMemo(() => {
    const m = new BodyModel(sp, 1);
    const ro = sp.rostrum?.len ?? 0;
    const cl = sp.fins.caudal.len ?? sp.fins.caudal.span * 0.6;
    const s0 = -ro - 0.02, s1 = 1 + Math.max(0.04, cl) + 0.03;
    const W = 340, H = 150;
    const k = W / (s1 - s0);
    const maxY = Math.max(0.3, ...Array.from({ length: 60 }, (_, i) => Math.max(m.top(i / 59), m.bot(i / 59)) + 0.02),
      ...(sp.fins.dorsal ?? []).map((f) => m.top((f.s0 + f.s1) / 2) + f.h), sp.fins.caudal.span / 2 + 0.02);
    const ky = Math.min(k, (H / 2 - 6) / maxY);
    const X = (s: number) => W - (s - s0) * k;
    const Y = (y: number) => H / 2 - y * ky;
    const N = 90;
    let body = '';
    for (let i = 0; i <= N; i++) { const s = i / N; body += `${i ? 'L' : 'M'}${X(s).toFixed(1)},${Y(m.top(s)).toFixed(1)}`; }
    for (let i = N; i >= 0; i--) { const s = i / N; body += `L${X(s).toFixed(1)},${Y(-m.bot(s)).toFixed(1)}`; }
    body += 'Z';
    const fins: string[] = [];
    const med = (s0f: number, s1f: number, h: number, side: 1 | -1) => {
      const a = side > 0 ? m.top(s0f) : -m.bot(s0f);
      const b = side > 0 ? m.top(s1f) : -m.bot(s1f);
      const mid = (s0f + s1f) / 2;
      const c = (side > 0 ? m.top(mid) : -m.bot(mid)) + side * h;
      fins.push(`M${X(s0f)},${Y(a)} Q${X(s0f + (s1f - s0f) * 0.15)},${Y(c)} ${X(mid)},${Y(c)} L${X(s1f)},${Y(b + side * h * 0.25)} L${X(s1f)},${Y(b)}Z`);
    };
    (sp.fins.dorsal ?? []).forEach((f) => med(f.s0, f.s1, f.h, 1));
    (sp.fins.anal ?? []).forEach((f) => med(f.s0, f.s1, f.h, -1));
    const cs = sp.fins.caudal;
    if (cs.span > 0) {
      const up = cs.up ?? (cs.type === 'hetero' ? 0.68 : 0.5);
      const fork = cs.type === 'forked' || cs.type === 'lunate' || cs.type === 'hetero' || cs.type === 'lyre' ? 0.35 : 0.9;
      fins.push(`M${X(1)},${Y(m.top(1))} L${X(1 + cl)},${Y(cs.span * up)} L${X(1 + cl * fork)},${Y(0)} L${X(1 + cl)},${Y(-cs.span * (1 - up))} L${X(1)},${Y(-m.bot(1))}Z`);
    }
    const tip = m.mouthTip, ric = m.rictus, hin = m.hinge;
    let cleft = '';
    for (let i = 0; i <= 18; i++) {
      const s = tip.s + ((ric.s - tip.s) * i) / 18;
      cleft += `${i ? 'L' : 'M'}${X(s).toFixed(1)},${Y(m.mouthY(s)).toFixed(1)}`;
    }
    const eyeY = m.normY(sp.eye.s, sp.eye.y);
    return { W, H, body, fins, X, Y, tip, ric, hin, cleft, eyeY, ky, k, ro, m };
  }, [sp]);
  const { W, H, X, Y, tip, ric, hin, cleft } = d;
  const jaw = sp.mouth.kind === 'jaw' || sp.mouth.kind === undefined;
  const hasMouth = jaw && sp.mouth.gape > 0.004;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <pattern id="gridp" width="17" height="17" patternUnits="userSpaceOnUse">
          <path d="M17 0H0V17" fill="none" stroke="#1e3a4c" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#gridp)" />
      <line x1={0} x2={W} y1={Y(0)} y2={Y(0)} stroke="#2c5870" strokeDasharray="3 3" strokeWidth="0.6" />
      {d.ro > 0 && <rect x={X(0)} y={Y(0.012)} width={X(-d.ro) - X(0)} height={0.024 * d.ky} fill="#3c7fa0" opacity="0.6" />}
      {d.fins.map((f, i) => <path key={i} d={f} fill="#2b6a8a" opacity="0.45" stroke="#5fb4d8" strokeWidth="0.6" />)}
      <path d={d.body} fill="#1b4a63" stroke="#8fd6f5" strokeWidth="1.1" />
      <line x1={X(sp.HL)} x2={X(sp.HL)} y1={Y(d.m.top(sp.HL))} y2={Y(-d.m.bot(sp.HL))} stroke="#8fd6f5" strokeDasharray="2 2" strokeWidth="0.6" opacity="0.7" />
      {sp.eye.d > 0 && <circle cx={X(sp.eye.s)} cy={Y(d.eyeY)} r={Math.max(1.5, (sp.eye.d / 2) * d.k)} fill="#0b1820" stroke="#ffd36a" strokeWidth="0.9" />}
      {hasMouth && (
        <g>
          <path d={cleft} fill="none" stroke="#ff5a6a" strokeWidth="2" strokeLinecap="round" />
          <circle cx={X(ric.s)} cy={Y(ric.y)} r="2.4" fill="#ff5a6a" />
          <circle cx={X(hin.s)} cy={Y(hin.y)} r="2" fill="none" stroke="#ffd36a" strokeWidth="1" />
          <line x1={X(tip.s)} y1={Y(tip.y)} x2={X(tip.s + 0.12)} y2={Y(tip.y)} stroke="#ff8a96" strokeWidth="0.6" strokeDasharray="2 2" />
          <text x={X(ric.s) - 4} y={Y(ric.y) + 13} fill="#ffb3bb" fontSize="9" fontFamily="ui-monospace,monospace" textAnchor="end">
            {`cleft ${sp.mouth.angle}° · gape ${(sp.mouth.gape * 100).toFixed(1)}% SL`}
          </text>
        </g>
      )}
      <text x={6} y={12} fill="#6fa8c4" fontSize="8.5" fontFamily="ui-monospace,monospace">caudal</text>
      <text x={W - 6} y={12} fill="#6fa8c4" fontSize="8.5" fontFamily="ui-monospace,monospace" textAnchor="end">snout</text>
    </svg>
  );
}
