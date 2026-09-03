import { Easing, interpolate, useCurrentFrame } from 'remotion';

import { colors, fonts } from '../theme';

export const Reveal: React.FC<{ from?: number; children: React.ReactNode }> = ({ from = 0, children }) => {
  const frame = useCurrentFrame();
  return <div style={{
    opacity: interpolate(frame, [from, from + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) }),
    translate: `0 ${interpolate(frame, [from, from + 18], [16, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) })}px`,
  }}>{children}</div>;
};

export const Token: React.FC<{ text: string; role?: 'reasoning' | 'answer' | 'neutral'; active?: boolean }> = ({ text, role = 'neutral', active = false }) => {
  const palette = role === 'reasoning'
    ? { background: colors.tealSoft, color: colors.teal }
    : role === 'answer'
      ? { background: colors.rustSoft, color: colors.rust }
      : { background: colors.white, color: colors.ink };
  return <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 60,
    padding: '10px 18px',
    borderRadius: 12,
    border: `1px solid ${active ? palette.color : colors.line}`,
    background: palette.background,
    color: palette.color,
    fontFamily: fonts.mono,
    fontSize: 27,
    fontWeight: active ? 700 : 540,
    scale: active ? 1.04 : 1,
  }}>{text}</span>;
};

export const MetricBar: React.FC<{ label: string; value: number; max: number; color?: string; delay?: number; suffix?: string }> = ({ label, value, max, color = colors.teal, delay = 0, suffix = '' }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) });
  return <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 130px', alignItems: 'center', gap: 24 }}>
    <span style={{ fontSize: 27, fontWeight: 600 }}>{label}</span>
    <div style={{ height: 30, borderRadius: 999, background: colors.line, overflow: 'hidden' }}><div style={{ width: `${value / max * 100 * progress}%`, height: '100%', borderRadius: 999, background: color }} /></div>
    <span style={{ color, fontFamily: fonts.serif, fontSize: 42, fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>{(value * progress).toFixed(2)}{suffix}</span>
  </div>;
};
