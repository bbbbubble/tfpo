import { useEffect, useMemo, useState } from 'react';
import type { Caption } from '@remotion/captions';
import { Easing, interpolate, staticFile, useCurrentFrame, useDelayRender, useVideoConfig } from 'remotion';

import { colors, fonts } from '../theme';

export const CaptionTrack: React.FC<{ sceneId: string }> = ({ sceneId }) => {
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender(`captions-${sceneId}`));
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  useEffect(() => {
    fetch(staticFile(`captions/${sceneId}.json`))
      .then((response) => response.json())
      .then((data: Caption[]) => {
        setCaptions(data);
        continueRender(handle);
      })
      .catch((error: unknown) => cancelRender(error));
  }, [cancelRender, continueRender, handle, sceneId]);

  const active = useMemo(() => {
    const now = frame / fps * 1000;
    return captions?.find((caption) => caption.startMs <= now && caption.endMs >= now) ?? null;
  }, [captions, frame, fps]);

  const opacity = active
    ? interpolate(frame / fps * 1000, [active.startMs, active.startMs + 180, active.endMs - 140, active.endMs], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    : 0;

  const emphasizedSegments = useMemo(() => {
    const text = active?.text.trim() ?? '';
    const pattern = /(TFPO|token-level(?: route| routing)?|content gate|preference (?:objective|shaping)|likelihood anchoring|answer agreement|majority accuracy|explanation diversity|AUPRC|\b\d[\d.,/-]*\b)/gi;
    return text.split(pattern).filter(Boolean).map((segment, index) => {
      const isNumber = /^\d[\d.,/-]*$/.test(segment);
      const isKeyword = !isNumber && pattern.test(segment);
      pattern.lastIndex = 0;
      return <span key={`${segment}-${index}`} style={{ color: isNumber ? colors.rust : isKeyword ? colors.teal : colors.ink }}>{segment}</span>;
    });
  }, [active]);

  return (
    <div style={{
      position: 'absolute',
      left: 210,
      right: 210,
      bottom: 224,
      minHeight: 82,
      maxHeight: 92,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.ink,
      fontFamily: fonts.sans,
      fontSize: 35,
      fontWeight: 560,
      lineHeight: 1.2,
      letterSpacing: '-0.012em',
      textAlign: 'center',
      whiteSpace: 'pre-wrap',
      textShadow: '0 1px 0 #fff, 0 0 12px rgba(247,247,243,.98), 0 0 24px rgba(247,247,243,.92)',
      opacity,
    }}>
      {emphasizedSegments}
    </div>
  );
};
