import React from 'react';

interface AtmosphereOverlayProps {
  enabled: boolean;
  intensity?: 'subtle' | 'storm';
}

const RAIN_DROPS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${(i * 3.7) % 100}%`,
  duration: `${0.75 + (i % 5) * 0.16}s`,
  delay: `${(i % 7) * 0.19}s`,
  height: `${28 + (i % 4) * 14}px`,
}));

export const AtmosphereOverlay: React.FC<AtmosphereOverlayProps> = ({
  enabled,
  intensity = 'subtle',
}) => {
  if (!enabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, transparent 45%, rgba(6, 8, 12, 0.72) 100%)',
        }}
      />
      {/* Rain Streaks */}
      {RAIN_DROPS.slice(0, intensity === 'storm' ? 28 : 14).map((drop) => (
        <span
          key={drop.id}
          className="rain-streak absolute top-0 w-px bg-gradient-to-b from-transparent via-slate-300/35 to-transparent"
          style={{
            left: drop.left,
            height: drop.height,
            animationDuration: drop.duration,
            animationDelay: drop.delay,
          }}
        />
      ))}
    </div>
  );
};
