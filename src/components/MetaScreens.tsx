import React, { useState } from 'react';
import {
  Archive,
  Award,
  Bell,
  CheckCircle2,
  Download,
  FolderOpen,
  Globe,
  MonitorPlay,
  Play,
  RotateCcw,
  Settings as SettingsIcon,
  Shield,
  Sliders,
  Trophy,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { noirAudio } from '../audio/noirAudio';
import { ASSETS, CASES } from '../data/cases';
import {
  AppLanguage,
  DifficultyLevel,
  GameSaveState,
  GameSettings,
  ScreenMode,
  SkillTree,
} from '../types/game';
import {
  ABILITY_DEFINITIONS,
  calculateCaseProgressPercent,
  getConductStyle,
  getReputationTier,
} from '../utils/gameState';
import { LANGUAGE_LABELS, t } from '../utils/i18n';

/* ============================================================================
 * MAIN MENU SCREEN
 * ============================================================================ */

interface MainMenuProps {
  hasSavedProgress: boolean;
  language: AppLanguage;
  onNewInvestigation: () => void;
  onContinueInvestigation: () => void;
  onStartDemo: () => void;
  onNavigate: (screen: ScreenMode) => void;
}

export const MainMenuScreen: React.FC<MainMenuProps> = ({
  hasSavedProgress,
  language,
  onNewInvestigation,
  onContinueInvestigation,
  onStartDemo,
  onNavigate,
}) => {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0B0D12]">
      {/* Backdrop */}
      {!imgErr && (
        <img
          src={ASSETS.cityBackdrop}
          alt="Ravenwood city streets at midnight in rain"
          referrerPolicy="no-referrer"
          onError={() => setImgErr(true)}
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(11,13,18,0.96) 0%, rgba(11,13,18,0.82) 52%, rgba(11,13,18,0.45) 100%)',
        }}
      />

      <div className="relative z-20 mx-auto flex min-h-screen max-w-[1320px] flex-col justify-between px-6 py-12 sm:px-10">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Ravenwood Homicide Division · File #407</span>
          <span>Five Interconnected Cases</span>
        </div>

        <div className="my-auto max-w-2xl space-y-8 py-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 text-xs font-medium tracking-wider text-[#C9A24D] uppercase">
              {/* Minimalist Red-Eye Playing Card Motif */}
              <svg viewBox="0 0 24 32" className="h-6 w-5" aria-hidden="true">
                <rect
                  x="1"
                  y="1"
                  width="22"
                  height="30"
                  rx="3"
                  fill="#121620"
                  stroke="#C9A24D"
                  strokeWidth="1.5"
                />
                <path
                  d="M4 16 Q12 9 20 16 Q12 23 4 16 Z"
                  fill="none"
                  stroke="#9E2A3B"
                  strokeWidth="1.8"
                />
                <circle cx="12" cy="16" r="2.6" fill="#9E2A3B" />
              </svg>
              <span>A Psychological Crime Investigation</span>
            </div>

            <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight text-white text-balance">
              THE LAST ALIBI
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-slate-300">
              In Ravenwood, every suspect has a story, every crime scene hides an inconvenient truth, and a black playing card with a crimson eye links five impossible murders. Gather forensic evidence, shatter false alibis, and expose The Phantom.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            {hasSavedProgress && (
              <button
                onClick={() => {
                  noirAudio.unlockAudio();
                  noirAudio.playSfx('discover');
                  onContinueInvestigation();
                }}
                className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-[#C9A24D] px-6 py-3.5 text-sm font-semibold text-[#0B0D12] hover:bg-[#D8B461] transition-colors whitespace-nowrap shrink-0"
              >
                <Play className="h-4 w-4" />
                <span>{t(language, 'continueInvestigation')}</span>
              </button>
            )}

            <button
              onClick={() => {
                noirAudio.unlockAudio();
                noirAudio.playSfx('click');
                onNewInvestigation();
              }}
              className={`inline-flex items-center justify-center gap-2.5 rounded-lg px-6 py-3.5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                hasSavedProgress
                  ? 'border border-white/20 bg-[#141923]/90 text-white hover:border-[#C9A24D]'
                  : 'bg-[#C9A24D] text-[#0B0D12] hover:bg-[#D8B461]'
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              <span>{t(language, 'newInvestigation')}</span>
            </button>

            <button
              onClick={() => {
                noirAudio.unlockAudio();
                noirAudio.playSfx('discover');
                onStartDemo();
              }}
              className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-[#C9A24D]/55 bg-[#141923]/90 px-5 py-3.5 text-sm font-semibold text-[#F2D58B] hover:border-[#C9A24D] hover:bg-[#1B2232] transition-colors whitespace-nowrap shrink-0"
            >
              <MonitorPlay className="h-4 w-4 text-[#C9A24D]" />
              <span>{t(language, 'computerDemo')}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-6 border-t border-white/10 pt-6 text-sm text-slate-300">
            <button
              onClick={() => {
                noirAudio.unlockAudio();
                noirAudio.playSfx('click');
                onNavigate('ARCHIVES');
              }}
              className="inline-flex items-center gap-2 hover:text-[#C9A24D] transition-colors whitespace-nowrap"
            >
              <Archive className="h-4 w-4" />
              <span>{t(language, 'caseArchives')}</span>
            </button>
            <button
              onClick={() => {
                noirAudio.unlockAudio();
                noirAudio.playSfx('click');
                onNavigate('PROFILE');
              }}
              className="inline-flex items-center gap-2 hover:text-[#C9A24D] transition-colors whitespace-nowrap"
            >
              <User className="h-4 w-4" />
              <span>{t(language, 'detectiveProfile')}</span>
            </button>
            <button
              onClick={() => {
                noirAudio.unlockAudio();
                noirAudio.playSfx('click');
                onNavigate('LEADERBOARD');
              }}
              className="inline-flex items-center gap-2 hover:text-[#C9A24D] transition-colors whitespace-nowrap"
            >
              <Trophy className="h-4 w-4" />
              <span>{t(language, 'leaderboard')}</span>
            </button>
            <button
              onClick={() => {
                noirAudio.unlockAudio();
                noirAudio.playSfx('click');
                onNavigate('SETTINGS');
              }}
              className="inline-flex items-center gap-2 hover:text-[#C9A24D] transition-colors whitespace-nowrap"
            >
              <SettingsIcon className="h-4 w-4" />
              <span>{t(language, 'settings')}</span>
            </button>
            <button
              onClick={() => {
                noirAudio.unlockAudio();
                noirAudio.playSfx('click');
                onNavigate('CREDITS');
              }}
              className="hover:text-[#C9A24D] transition-colors whitespace-nowrap"
            >
              {t(language, 'credits')}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          In Ravenwood, everyone has an alibi. The question is whose alibi is worth believing.
        </p>
      </div>
    </div>
  );
};

/* ============================================================================
 * CASE ARCHIVES SCREEN
 * ============================================================================ */

interface ArchivesProps {
  saveState: GameSaveState;
  onOpenCase: (caseId: string) => void;
  onBack: () => void;
}

export const CaseArchivesScreen: React.FC<ArchivesProps> = ({
  saveState,
  onOpenCase,
  onBack,
}) => {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="font-display text-3xl font-semibold text-white">
            Case Archives
          </h2>
          <p className="text-sm text-slate-400">
            Revisit completed investigations or resume active Ravenwood files.
          </p>
        </div>
        <button
          onClick={onBack}
          className="rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-slate-200 hover:border-[#C9A24D]"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CASES.map((c) => {
          const cs = saveState.caseStates[c.id];
          const locked = cs?.status === 'locked';
          const pct = cs ? calculateCaseProgressPercent(c.id, cs) : 0;
          return (
            <div
              key={c.id}
              className={`rounded-xl border p-5 space-y-3 ${
                locked
                  ? 'border-white/5 bg-[#0F1219] opacity-55'
                  : 'border-white/10 bg-[#121620]'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Case 0{c.number} · {c.locationName}
                </span>
                <span className="font-mono-tabular text-[#C9A24D]">
                  {cs?.status === 'solved_truth'
                    ? 'Truth Proven'
                    : cs?.status === 'solved_wrong'
                    ? 'Disputed Verdict'
                    : cs?.status === 'active'
                    ? `${pct}% Complete`
                    : 'Locked'}
                </span>
              </div>
              <h3 className="font-display text-2xl font-semibold text-white">
                {c.title}
              </h3>
              <p className="text-xs leading-relaxed text-slate-300">{c.subtitle}</p>
              <div className="pt-2">
                <button
                  disabled={locked}
                  onClick={() => onOpenCase(c.id)}
                  className="rounded-lg bg-[#C9A24D] px-4 py-2 text-xs font-semibold text-[#0B0D12] hover:bg-[#D8B461] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {locked ? 'Complete Previous Case' : 'Open Case File'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
 * DETECTIVE PROFILE & SKILL PROGRESSION SCREEN
 * ============================================================================ */

interface ProfileProps {
  saveState: GameSaveState;
  onBack: () => void;
  onOpenLeaderboard?: () => void;
}

const SKILL_LABELS: { key: keyof SkillTree; label: string; desc: string }[] = [
  {
    key: 'observation',
    label: 'Observation',
    desc: 'Earned by examining scene hotspots, UV traces, and capturing photographs.',
  },
  {
    key: 'interrogation',
    label: 'Interrogation',
    desc: 'Earned by questioning suspects and exposing contradictions.',
  },
  {
    key: 'forensics',
    label: 'Forensic Analysis',
    desc: 'Earned by solving DNA, fingerprint, audio, and lab puzzles.',
  },
  {
    key: 'deduction',
    label: 'Logical Reasoning',
    desc: 'Earned by connecting investigation board threads and verifying timelines.',
  },
  {
    key: 'digital',
    label: 'Digital Investigation',
    desc: 'Earned by cracking terminals, CCTV reels, and encrypted ciphers.',
  },
];

export const DetectiveProfileScreen: React.FC<ProfileProps> = ({
  saveState,
  onBack,
  onOpenLeaderboard,
}) => {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs text-[#C9A24D]">Badge #407 · Ravenwood Precinct</p>
          <h2 className="font-display text-3xl font-semibold text-white">
            Detective Alex Morgan
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {onOpenLeaderboard && (
            <button
              onClick={() => {
                noirAudio.playSfx('click');
                onOpenLeaderboard();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9A24D]/40 bg-[#171C28] px-3.5 py-2 text-xs font-medium text-[#C9A24D] hover:border-[#C9A24D] whitespace-nowrap shrink-0"
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Leaderboard</span>
            </button>
          )}
          <button
            onClick={onBack}
            className="rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-slate-200 hover:border-[#C9A24D]"
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-[#121620] p-5">
          <p className="text-xs text-slate-400">Current Rank</p>
          <p className="mt-1 font-display text-2xl font-semibold text-white">
            {saveState.detectiveRank}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#121620] p-5">
          <p className="text-xs text-slate-400">Experience Points</p>
          <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[#C9A24D]">
            {saveState.xp} XP
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#121620] p-5">
          <p className="text-xs text-slate-400">Precinct Reputation</p>
          <p className="mt-1 font-mono-tabular text-2xl font-semibold text-white">
            {saveState.reputation} / 100
          </p>
          <p className="mt-1 text-[11px] text-[#C9A24D]">
            {getReputationTier(saveState.reputation).label}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#121620] p-5">
          <p className="text-xs text-slate-400">Interrogation Conduct</p>
          <p className="mt-1 font-display text-2xl font-semibold text-white">
            {getConductStyle(saveState.conduct)}
          </p>
          <p className="mt-1 font-mono-tabular text-[11px] text-slate-400">
            {saveState.conduct.empatheticChoices} Empathetic ·{' '}
            {saveState.conduct.byTheBookChoices} Standard ·{' '}
            {saveState.conduct.aggressiveChoices} Hardball
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-[#121620] p-5 space-y-4">
          <div className="flex items-center gap-2 text-lg font-display font-semibold text-white">
            <Award className="h-5 w-5 text-[#C9A24D]" />
            <span>Investigative Disciplines</span>
          </div>
          <div className="space-y-4">
            {SKILL_LABELS.map((sk) => {
              const lvl = saveState.skills[sk.key];
              return (
                <div key={sk.key} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-white">{sk.label}</span>
                    <span className="font-mono-tabular text-[#C9A24D]">
                      Level {lvl} / 5
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#1B2230] overflow-hidden">
                    <div
                      className="h-full bg-[#C9A24D] transition-all"
                      style={{ width: `${(lvl / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">{sk.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#121620] p-5 space-y-4">
          <div className="flex items-center gap-2 text-lg font-display font-semibold text-white">
            <Shield className="h-5 w-5 text-[#C9A24D]" />
            <span>Unlocked Detective Abilities</span>
          </div>
          <div className="space-y-3">
            {ABILITY_DEFINITIONS.map((ab) => {
              const unlocked = saveState.unlockedAbilities.includes(ab.id);
              return (
                <div
                  key={ab.id}
                  className={`rounded-lg border p-3.5 text-xs space-y-1 ${
                    unlocked
                      ? 'border-[#C9A24D]/45 bg-[#181E2C] text-white'
                      : 'border-white/10 bg-[#151923] text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{ab.name}</span>
                    <span className="font-mono-tabular">
                      {unlocked ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Active
                        </span>
                      ) : (
                        `Requires ${ab.skill} Lv.${ab.requiredLevel}`
                      )}
                    </span>
                  </div>
                  <p className="text-slate-300">{ab.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * SETTINGS & CONSOLE SCREEN
 * ============================================================================ */

interface SettingsProps {
  saveState: GameSaveState;
  settings: GameSettings;
  onUpdateSettings: (next: GameSettings) => void;
  onResetSave: () => void;
  onBack: () => void;
}

type SettingsTab = 'audio' | 'notifications' | 'language_display' | 'gameplay';

export const SettingsScreen: React.FC<SettingsProps> = ({
  saveState,
  settings,
  onUpdateSettings,
  onResetSave,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('audio');
  const [confirmReset, setConfirmReset] = useState(false);
  const [notifStatus, setNotifStatus] = useState<string | null>(null);

  const requestDesktopNotifications = async () => {
    if (settings.browserNotifications) {
      onUpdateSettings({ ...settings, browserNotifications: false });
      setNotifStatus(null);
      return;
    }
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifStatus('Desktop notifications are not supported in this browser.');
      return;
    }
    if (Notification.permission === 'granted') {
      onUpdateSettings({ ...settings, browserNotifications: true });
      setNotifStatus('Desktop alerts enabled.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      onUpdateSettings({ ...settings, browserNotifications: true });
      setNotifStatus('Desktop alerts enabled.');
    } else {
      setNotifStatus('Permission declined by browser; in-app notifications remain active.');
    }
  };

  const exportSaveBackup = () => {
    const blob = new Blob([JSON.stringify(saveState, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `the_last_alibi_save_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <Sliders className="h-5 w-5 text-[#C9A24D]" />
          <div>
            <h2 className="font-display text-3xl font-semibold text-white">
              {t(settings.language, 'settingsTitle')}
            </h2>
            <p className="text-xs text-slate-400">
              Configure audio, notifications, language, accessibility, and save data.
            </p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-slate-200 hover:border-[#C9A24D]"
        >
          {t(settings.language, 'back')}
        </button>
      </div>

      {/* Console Section Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/10 bg-[#121620] p-1.5">
        {(
          [
            ['audio', 'Audio & Music'],
            ['notifications', 'Notifications'],
            ['language_display', 'Language & Display'],
            ['gameplay', 'Gameplay & Console'],
          ] as [SettingsTab, string][]
        ).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => {
              noirAudio.playSfx('click');
              setActiveTab(tab);
            }}
            className={`flex-1 min-w-[130px] rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-[#C9A24D] text-[#0B0D12]'
                : 'text-slate-300 hover:bg-[#171C28] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#121620] p-6 space-y-6">
        {activeTab === 'audio' && (
          <>
            {/* Mute Background Music */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Background Music</p>
                <p className="text-xs text-slate-400">
                  Mute or unmute ambient noir score and rain audio.
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({ ...settings, musicMuted: !settings.musicMuted })
                }
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
                  settings.musicMuted
                    ? 'border-[#9E2A3B]/60 bg-[#25151B] text-rose-200'
                    : 'border-white/15 bg-[#171C28] text-white hover:border-[#C9A24D]'
                }`}
              >
                {settings.musicMuted ? (
                  <>
                    <VolumeX className="h-4 w-4 text-rose-300" />
                    <span>Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 text-[#C9A24D]" />
                    <span>Active</span>
                  </>
                )}
              </button>
            </div>

            <div className="border-t border-white/10 pt-4">
              <label className="flex justify-between text-sm text-slate-200 mb-2">
                <span>Music & Rain Ambience Volume</span>
                <span className="font-mono-tabular text-[#C9A24D]">
                  {settings.musicMuted ? 'Muted' : `${Math.round(settings.musicVolume * 100)}%`}
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                disabled={settings.musicMuted}
                value={settings.musicVolume}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, musicVolume: Number(e.target.value) })
                }
                className="w-full accent-[#C9A24D] disabled:opacity-40"
              />
            </div>

            {/* Mute Sound Effects */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-sm font-medium text-white">Sound Effects</p>
                <p className="text-xs text-slate-400">
                  Mute or unmute evidence chimes, shutter clicks, and interrogation cues.
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({ ...settings, sfxMuted: !settings.sfxMuted })
                }
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
                  settings.sfxMuted
                    ? 'border-[#9E2A3B]/60 bg-[#25151B] text-rose-200'
                    : 'border-white/15 bg-[#171C28] text-white hover:border-[#C9A24D]'
                }`}
              >
                {settings.sfxMuted ? 'Muted' : 'Active'}
              </button>
            </div>

            <div>
              <label className="flex justify-between text-sm text-slate-200 mb-2">
                <span>Sound Effects Volume</span>
                <span className="font-mono-tabular text-[#C9A24D]">
                  {settings.sfxMuted ? 'Muted' : `${Math.round(settings.sfxVolume * 100)}%`}
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                disabled={settings.sfxMuted}
                value={settings.sfxVolume}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, sfxVolume: Number(e.target.value) })
                }
                className="w-full accent-[#C9A24D] disabled:opacity-40"
              />
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-sm font-medium text-white">AI Noir Music Composer</p>
                <p className="text-xs text-slate-400">
                  Automatically compose adaptive noir arrangements for each case & scene.
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    aiMusicEnabled: !settings.aiMusicEnabled,
                  })
                }
                className="rounded-lg border border-white/15 bg-[#171C28] px-4 py-2 text-xs font-medium text-white hover:border-[#C9A24D]"
              >
                {settings.aiMusicEnabled ? 'Enabled' : 'Synth Fallback'}
              </button>
            </div>
          </>
        )}

        {activeTab === 'notifications' && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-[#C9A24D] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">
                    In-App Investigation Notifications
                  </p>
                  <p className="text-xs text-slate-400">
                    Receive alerts for evidence logged, contradictions exposed, skill upgrades, and Focus readiness.
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    notificationsEnabled: !settings.notificationsEnabled,
                  })
                }
                className="rounded-lg border border-white/15 bg-[#171C28] px-4 py-2 text-xs font-semibold text-white hover:border-[#C9A24D] shrink-0"
              >
                {settings.notificationsEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-sm font-medium text-white">Notification Alert Chimes</p>
                <p className="text-xs text-slate-400">
                  Play subtle audio pings when new case alerts arrive.
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    notificationSound: !settings.notificationSound,
                  })
                }
                className="rounded-lg border border-white/15 bg-[#171C28] px-4 py-2 text-xs font-medium text-white"
              >
                {settings.notificationSound ? 'On' : 'Silent'}
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-sm font-medium text-white">Desktop Browser Notifications</p>
                <p className="text-xs text-slate-400">
                  Send browser alerts for major case verdicts and incoming precinct calls.
                </p>
              </div>
              <button
                onClick={requestDesktopNotifications}
                className="rounded-lg border border-white/15 bg-[#171C28] px-4 py-2 text-xs font-medium text-white hover:border-[#C9A24D] shrink-0"
              >
                {settings.browserNotifications ? 'Enabled' : 'Enable Alerts'}
              </button>
            </div>
            {notifStatus && (
              <p className="text-xs text-[#C9A24D]">{notifStatus}</p>
            )}
          </>
        )}

        {activeTab === 'language_display' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-[#C9A24D] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">Interface Language</p>
                  <p className="text-xs text-slate-400">
                    Select display language for menus, HUD controls, and office navigation.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 rounded-lg bg-[#0B0D12] p-1 border border-white/10">
                {(Object.keys(LANGUAGE_LABELS) as AppLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() =>
                      onUpdateSettings({ ...settings, language: lang })
                    }
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      settings.language === lang
                        ? 'bg-[#C9A24D] text-[#0B0D12]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {LANGUAGE_LABELS[lang]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-sm font-medium text-white">Atmospheric Graphics</p>
                <p className="text-xs text-slate-400">
                  Rain streaks and noir lighting vignettes.
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    graphicsQuality:
                      settings.graphicsQuality === 'High' ? 'Balanced' : 'High',
                  })
                }
                className="rounded-lg border border-white/15 bg-[#171C28] px-4 py-2 text-xs font-medium text-white"
              >
                {settings.graphicsQuality}
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-sm font-medium text-white">Text Readability Size</p>
                <p className="text-xs text-slate-400">
                  Increase interface & dialogue font scaling.
                </p>
              </div>
              <div className="flex gap-1 rounded-lg bg-[#0B0D12] p-1 border border-white/10">
                {(['Standard', 'Large'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => onUpdateSettings({ ...settings, textSize: sz })}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                      settings.textSize === sz
                        ? 'bg-[#C9A24D] text-[#0B0D12]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-sm font-medium text-white">Reduced Motion</p>
                <p className="text-xs text-slate-400">
                  Disable animated rain streaks and visual motion effects.
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    reducedMotion: !settings.reducedMotion,
                  })
                }
                className="rounded-lg border border-white/15 bg-[#171C28] px-4 py-2 text-xs font-medium text-white"
              >
                {settings.reducedMotion ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-sm font-medium text-white">Dialogue Subtitles & Transcripts</p>
                <p className="text-xs text-slate-400">
                  Show full captions for phone calls and audio reels.
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({ ...settings, subtitles: !settings.subtitles })
                }
                className="rounded-lg border border-white/15 bg-[#171C28] px-4 py-2 text-xs font-medium text-white"
              >
                {settings.subtitles ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </>
        )}

        {activeTab === 'gameplay' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Investigation Difficulty</p>
                <p className="text-xs text-slate-400">
                  Controls forensic puzzle calibration tolerance & Pressure Timer deadline.
                </p>
              </div>
              <div className="flex gap-1 rounded-lg bg-[#0B0D12] p-1 border border-white/10">
                {(['Detective', 'Veteran', 'Mastermind'] as DifficultyLevel[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => onUpdateSettings({ ...settings, difficulty: d })}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                      settings.difficulty === d
                        ? 'bg-[#C9A24D] text-[#0B0D12]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
              <div>
                <p className="text-sm font-medium text-white">
                  Pressure Timer (Timed Rank Rewards)
                </p>
                <p className="text-xs text-slate-400">
                  Adds an active precinct clock per case. Solving quickly awards +30 to +120 Detective Rank XP; overtime reduces rewards.
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    pressureTimerEnabled: !settings.pressureTimerEnabled,
                  })
                }
                className={`rounded-lg border px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  settings.pressureTimerEnabled
                    ? 'border-[#C9A24D]/60 bg-[#211B11] text-[#C9A24D]'
                    : 'border-white/15 bg-[#171C28] text-white hover:border-[#C9A24D]'
                }`}
              >
                {settings.pressureTimerEnabled ? 'Enabled' : 'Off'}
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-sm font-medium text-white">Automatic Progress Save</p>
                <p className="text-xs text-slate-400">
                  Automatically save evidence, deductions, and skills to browser storage.
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    autoSaveEnabled: !settings.autoSaveEnabled,
                  })
                }
                className="rounded-lg border border-white/15 bg-[#171C28] px-4 py-2 text-xs font-medium text-white"
              >
                {settings.autoSaveEnabled ? 'Enabled' : 'Manual Only'}
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-sm font-medium text-white">Keyboard Shortcuts</p>
                <p className="text-xs text-slate-400">
                  1–5 switch stations · I Intuition · J Journal · , Settings · Esc back.
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    keyboardHints: !settings.keyboardHints,
                  })
                }
                className="rounded-lg border border-white/15 bg-[#171C28] px-4 py-2 text-xs font-medium text-white"
              >
                {settings.keyboardHints ? 'Shown' : 'Hidden'}
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-sm font-medium text-white">Export Save File Backup</p>
                <p className="text-xs text-slate-400">
                  Download your current Ravenwood case dossier as JSON.
                </p>
              </div>
              <button
                onClick={exportSaveBackup}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#171C28] px-4 py-2 text-xs font-medium text-white hover:border-[#C9A24D]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export JSON</span>
              </button>
            </div>

            <div className="border-t border-white/10 pt-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-rose-300">Reset Investigation Save</p>
                <p className="text-xs text-slate-400">
                  Erase all case progress and start fresh.
                </p>
              </div>
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#9E2A3B]/60 px-4 py-2 text-xs font-medium text-rose-300 hover:bg-[#9E2A3B]/20"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Save</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setConfirmReset(false);
                      onResetSave();
                    }}
                    className="rounded-lg bg-[#9E2A3B] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Confirm Erase
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * CREDITS SCREEN
 * ============================================================================ */

export const CreditsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 space-y-6">
    <div className="flex items-center justify-between border-b border-white/10 pb-4">
      <h2 className="font-display text-3xl font-semibold text-white">Credits</h2>
      <button
        onClick={onBack}
        className="rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-slate-200 hover:border-[#C9A24D]"
      >
        Back
      </button>
    </div>

    <div className="rounded-xl border border-white/10 bg-[#121620] p-7 space-y-5 text-sm text-slate-300">
      <div>
        <h3 className="font-display text-2xl font-bold text-white">THE LAST ALIBI</h3>
        <p className="text-xs text-[#C9A24D]">
          An Interactive Ravenwood Noir Investigation
        </p>
      </div>
      <div className="space-y-2 border-t border-white/10 pt-4 text-xs leading-relaxed">
        <p>
          <span className="text-slate-400">Story & Case Architecture: </span>
          Five interconnected mysteries across Ravenwood Luxury Hotel, Platform 3, The Velvet Eclipse, Blackwood Manor, and the Underground Sanctum.
        </p>
        <p>
          <span className="text-slate-400">Investigation Systems: </span>
          Crime Scene UV/Macro Forensics, 9 Interactive Lab Puzzles, Behavioral Interrogation Contradictions, Corkboard Threading, and Chronological Timeline Reconstruction.
        </p>
        <p>
          <span className="text-slate-400">Audio Synthesis: </span>
          Procedural Web Audio API noir score, rain ambience, and dynamic scene cues.
        </p>
      </div>
    </div>
  </div>
);
