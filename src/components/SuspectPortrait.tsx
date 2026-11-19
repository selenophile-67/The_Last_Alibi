import React from 'react';
import { PortraitProfile, SuspectEmotion } from '../types/game';

interface SuspectPortraitProps {
  name: string;
  portrait: PortraitProfile;
  emotion: SuspectEmotion;
  size?: 'sm' | 'md' | 'lg';
}

export const SuspectPortrait: React.FC<SuspectPortraitProps> = ({
  name,
  portrait,
  emotion,
  size = 'md',
}) => {
  const dims =
    size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-44 h-52' : 'w-20 h-24';

  const rimColor =
    emotion === 'angry'
      ? '#9E2A3B'
      : emotion === 'nervous'
      ? '#D97706'
      : emotion === 'cooperative'
      ? '#4B8B73'
      : portrait.accentColor;

  // Dynamic brow/mouth geometry for behavioral reactions
  const browTiltLeft =
    emotion === 'angry'
      ? 'M34 45 L46 49'
      : emotion === 'nervous'
      ? 'M34 48 L46 44'
      : emotion === 'defensive'
      ? 'M34 46 L46 47'
      : 'M34 46 L46 45';

  const browTiltRight =
    emotion === 'angry'
      ? 'M66 45 L54 49'
      : emotion === 'nervous'
      ? 'M66 48 L54 44'
      : emotion === 'defensive'
      ? 'M66 46 L54 47'
      : 'M66 46 L54 45';

  const mouthPath =
    emotion === 'angry'
      ? 'M42 71 Q50 67 58 71'
      : emotion === 'nervous'
      ? 'M43 70 Q47 72 50 70 Q53 68 57 70'
      : emotion === 'cooperative'
      ? 'M43 68 Q50 72 57 68'
      : 'M43 69 L57 69';

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#0F131C] ${dims}`}
      title={`${name} · Demeanor: ${emotion}`}
    >
      <svg
        viewBox="0 0 100 115"
        className="h-full w-full"
        aria-label={`Portrait of ${name}`}
      >
        <defs>
          <radialGradient id={`bg-${name.replace(/\s+/g, '')}`} cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor={rimColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0B0D12" stopOpacity="1" />
          </radialGradient>
        </defs>

        <rect width="100" height="115" fill={`url(#bg-${name.replace(/\s+/g, '')})`} />

        {/* Noir Venetian blind light streaks */}
        <g opacity="0.12" fill="#E8ECF4">
          <rect x="0" y="12" width="100" height="4" />
          <rect x="0" y="26" width="100" height="4" />
          <rect x="0" y="40" width="100" height="4" />
        </g>

        {/* Shoulders / Coat */}
        <path
          d="M14 115 C16 86, 30 82, 50 82 C70 82, 84 86, 86 115 Z"
          fill={portrait.coatColor}
        />
        <path d="M40 82 L50 98 L60 82" fill="#E8ECF4" opacity="0.82" />
        <path d="M47 84 L50 105 L53 84" fill={portrait.accentColor} opacity="0.9" />

        {/* Neck */}
        <rect x="43" y="72" width="14" height="14" rx="4" fill={portrait.skinTone} />

        {/* Head */}
        <ellipse cx="50" cy="54" rx="19" ry="23" fill={portrait.skinTone} />

        {/* Subtle noir half-shadow */}
        <path
          d="M50 31 A19 23 0 0 1 50 77 L50 31 Z"
          fill="#0B0D12"
          opacity="0.22"
        />

        {/* Hair styles */}
        {portrait.hairStyle === 'slick' && (
          <path d="M31 48 C30 28, 70 28, 69 48 C65 36, 35 36, 31 48 Z" fill={portrait.hairColor} />
        )}
        {portrait.hairStyle === 'parted' && (
          <path d="M30 50 C29 27, 71 27, 70 50 C63 39, 48 34, 30 47 Z" fill={portrait.hairColor} />
        )}
        {portrait.hairStyle === 'bob' && (
          <path d="M27 65 C25 27, 75 27, 73 65 C68 58, 68 38, 50 37 C32 38, 32 58, 27 65 Z" fill={portrait.hairColor} />
        )}
        {portrait.hairStyle === 'wavy' && (
          <path d="M26 70 C24 25, 76 25, 74 70 C69 52, 65 38, 50 37 C35 38, 31 52, 26 70 Z" fill={portrait.hairColor} />
        )}
        {(portrait.hairStyle === 'silver' || portrait.hairStyle === 'short') && (
          <path d="M31 46 C31 28, 69 28, 69 46 C61 35, 39 35, 31 46 Z" fill={portrait.hairColor} />
        )}

        {/* Eyes */}
        <circle cx="41" cy="53" r="2.2" fill="#11151E" />
        <circle cx="59" cy="53" r="2.2" fill="#11151E" />
        <circle cx="41.6" cy="52.4" r="0.6" fill="#FFFFFF" opacity="0.8" />
        <circle cx="59.6" cy="52.4" r="0.6" fill="#FFFFFF" opacity="0.8" />

        {/* Brows */}
        <path d={browTiltLeft} stroke="#1B1818" strokeWidth="2.1" strokeLinecap="round" fill="none" />
        <path d={browTiltRight} stroke="#1B1818" strokeWidth="2.1" strokeLinecap="round" fill="none" />

        {/* Glasses */}
        {portrait.glasses && (
          <g stroke="#C9A24D" strokeWidth="1.3" fill="none" opacity="0.9">
            <rect x="34" y="48.5" width="13" height="8.5" rx="2" />
            <rect x="53" y="48.5" width="13" height="8.5" rx="2" />
            <line x1="47" y1="52.5" x2="53" y2="52.5" />
          </g>
        )}

        {/* Scar */}
        {portrait.scar && (
          <path d="M57 57 L62 64" stroke="#7F2D38" strokeWidth="1.4" strokeLinecap="round" />
        )}

        {/* Facial hair */}
        {portrait.facialHair === 'mustache' && (
          <path d="M41 64 Q50 61 59 64" stroke={portrait.hairColor} strokeWidth="2.6" strokeLinecap="round" fill="none" />
        )}
        {portrait.facialHair === 'stubble' && (
          <path d="M35 61 C36 74, 64 74, 65 61" stroke="#1E1E24" strokeWidth="5" strokeDasharray="1 2" opacity="0.24" fill="none" />
        )}

        {/* Mouth */}
        <path d={mouthPath} stroke="#23191B" strokeWidth="1.9" strokeLinecap="round" fill="none" />

        {/* Sweat drop if nervous */}
        {emotion === 'nervous' && (
          <path d="M64 44 C66 48, 66 51, 64 51 C62 51, 62 48, 64 44 Z" fill="#93C5FD" opacity="0.7" />
        )}
      </svg>
    </div>
  );
};
