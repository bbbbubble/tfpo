import { Audio } from '@remotion/media';
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from 'remotion';

import { colors, fonts } from '../theme';
import { CaptionTrack } from './CaptionTrack';

export const SceneShell: React.FC<{
  id: string;
  label: string;
  title: string;
  children: React.ReactNode;
  dark?: boolean;
}> = ({ id, label, title, children, dark = false }) => {
  const frame = useCurrentFrame();
  const entrance = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{
      backgroundColor: dark ? colors.navy : colors.paper,
      color: dark ? colors.white : colors.ink,
      fontFamily: fonts.sans,
      overflow: 'hidden',
    }}>
      <Audio src={staticFile(`video/audio/${id}.mp3`)} />
      <div style={{ position: 'absolute', left: 96, right: 96, top: 65, display: 'flex', alignItems: 'center', gap: 20 }}>
        <span style={{ fontFamily: fonts.serif, fontSize: 30, fontWeight: 650 }}>TFPO</span>
        <span style={{ width: 48, height: 1, background: dark ? 'rgba(255,255,255,.35)' : colors.line }} />
        <span style={{ color: dark ? 'rgba(255,255,255,.65)' : colors.muted, fontFamily: fonts.mono, fontSize: 17, letterSpacing: '.11em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <h1 style={{
        position: 'absolute',
        left: 96,
        top: 118,
        width: 1540,
        margin: 0,
        fontFamily: fonts.serif,
        fontSize: 68,
        fontWeight: 560,
        letterSpacing: '-0.032em',
        lineHeight: 1.08,
        opacity: entrance,
        translate: `0 ${interpolate(entrance, [0, 1], [18, 0])}px`,
      }}>{title}</h1>
      <div style={{ position: 'absolute', left: 96, right: 96, top: 275, bottom: 365, opacity: entrance }}>
        {children}
      </div>
      <div style={{ position: 'absolute', left: 96, right: 96, bottom: 354, height: 1, background: dark ? 'rgba(255,255,255,.2)' : colors.line }} />
      <CaptionTrack sceneId={id} />
    </AbsoluteFill>
  );
};
