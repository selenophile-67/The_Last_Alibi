import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
  Clock,
  Eye,
  Gavel,
  HelpCircle,
  Menu,
  Music,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { MusicMood, noirAudio } from './audio/noirAudio';
import { AtmosphereOverlay } from './components/AtmosphereOverlay';
import { BoardTimelineView } from './components/BoardTimelineView';
import {
  AccusationModal,
  CaseFileScreen,
  CaseOutcomeScreen,
  FinalEndingScreen,
} from './components/CaseFileAndModals';
import { ComputerDemoBar } from './components/ComputerDemoBar';
import { CrimeSceneView } from './components/CrimeSceneView';
import { DetectiveJournalDrawer } from './components/DetectiveJournalDrawer';
import { DetectiveOfficeView } from './components/DetectiveOfficeView';
import { ForensicLabView } from './components/ForensicLabView';
import { InterrogationView } from './components/InterrogationView';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { XpGainPopups, XpPopupItem } from './components/XpGainPopups';
import {
  CaseArchivesScreen,
  CreditsScreen,
  DetectiveProfileScreen,
  MainMenuScreen,
  SettingsScreen,
} from './components/MetaScreens';
import { CASES } from './data/cases';
import { COMPUTER_DEMO_STEPS, ComputerDemoStep } from './data/computerDemo';
import { PrecinctSupportId } from './data/precinctNpcs';
import {
  AiMusicScore,
  DialogueOption,
  GameSaveState,
  GameSettings,
  InterrogationStance,
  JournalEntry,
  LinkRelationType,
  SceneHotspot,
  ScreenMode,
  SkillTree,
  TranscriptEntry,
} from './types/game';
import {
  ABILITY_DEFINITIONS,
  calculateCaseProgressPercent,
  calculatePressureReward,
  computeFinalEnding,
  createNewGameState,
  formatTimerClock,
  getConductStyle,
  getPressureDeadlineSeconds,
  getRankForXp,
  getSuspectTranscriptHistory,
  loadGameFromStorage,
  recalculateUnlockedAbilities,
  saveGameToStorage,
} from './utils/gameState';
import { t } from './utils/i18n';
import { recordCaseLeaderboardEntry } from './utils/leaderboard';

const INTUITION_COST = 35;

interface InAppNotification {
  id: string;
  title: string;
  message: string;
  tone: 'gold' | 'crimson' | 'emerald';
}

export default function App() {
  const [saveState, setSaveState] = useState<GameSaveState>(() => {
    const loaded = loadGameFromStorage();
    return loaded ?? createNewGameState();
  });
  const [showAccusation, setShowAccusation] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [hintToast, setHintToast] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [intuitionSeconds, setIntuitionSeconds] = useState(0);
  const [aiTrack, setAiTrack] = useState<AiMusicScore | null>(null);
  const [composingMusic, setComposingMusic] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [xpPopups, setXpPopups] = useState<XpPopupItem[]>([]);
  const [demoActive, setDemoActive] = useState(false);
  const [demoStepIndex, setDemoStepIndex] = useState(0);
  const [demoPaused, setDemoPaused] = useState(false);
  const [demoSpeed, setDemoSpeed] = useState<1 | 2>(1);
  const [demoFocusHotspotId, setDemoFocusHotspotId] = useState<string | null>(null);
  const [demoFocusSuspectId, setDemoFocusSuspectId] = useState<string | null>(null);

  const realSaveBackupRef = useRef<GameSaveState | null>(null);
  const lastExecutedDemoStepRef = useRef<number>(-1);

  const pendingXpMetaRef = useRef<{
    reason: string;
    skill: keyof SkillTree;
    focusBonus?: number;
    isSecretOrDeduction?: boolean;
  } | null>(null);

  const prevProgressRef = useRef<{
    xp: number;
    skills: SkillTree;
    abilities: string[];
    rank: string;
  }>({
    xp: saveState.xp,
    skills: { ...saveState.skills },
    abilities: [...saveState.unlockedAbilities],
    rank: saveState.detectiveRank,
  });

  const lang = saveState.settings.language;
  const activeCase = CASES.find((c) => c.id === saveState.activeCaseId) ?? CASES[0];
  const activeProgress = saveState.caseStates[activeCase.id];
  const intuitionActive = intuitionSeconds > 0;

  const pressureEnabled = saveState.settings.pressureTimerEnabled;
  const pressureDeadline = getPressureDeadlineSeconds(
    saveState.settings.difficulty,
    activeCase.number
  );
  const elapsedSeconds = activeProgress.elapsedSeconds ?? 0;
  const remainingSeconds = pressureDeadline - elapsedSeconds;
  const isOvertime = remainingSeconds < 0;
  const liveSpeedReward = calculatePressureReward(
    elapsedSeconds,
    pressureDeadline,
    true,
    pressureEnabled
  );

  const isInCasePlay = [
    'DETECTIVE_OFFICE',
    'CRIME_SCENE',
    'INTERROGATION',
    'FORENSIC_LAB',
    'BOARD_AND_TIMELINE',
    'CASE_FILE',
  ].includes(saveState.currentScreen);

  const pushNotification = useCallback(
    (title: string, message: string, tone: 'gold' | 'crimson' | 'emerald' = 'gold') => {
      if (!saveState.settings.notificationsEnabled) return;
      const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setNotifications((prev) => [...prev.slice(-2), { id, title, message, tone }]);
      if (saveState.settings.notificationSound && !saveState.settings.sfxMuted) {
        noirAudio.playSfx('discover');
      }
      if (
        saveState.settings.browserNotifications &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(`THE LAST ALIBI · ${title}`, { body: message });
        } catch {
          // Ignore browser notification exceptions in restricted iframes
        }
      }
      window.setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 4200);
    },
    [
      saveState.settings.notificationsEnabled,
      saveState.settings.notificationSound,
      saveState.settings.sfxMuted,
      saveState.settings.browserNotifications,
    ]
  );

  // Persist save state automatically (paused during sandbox Computer Demo Mode)
  useEffect(() => {
    if (!saveState.settings.autoSaveEnabled || demoActive) return;
    const timer = window.setTimeout(() => {
      saveGameToStorage(saveState);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [saveState, demoActive]);

  // Spawn visual Experience Gain popups whenever XP increases
  useEffect(() => {
    const prev = prevProgressRef.current;
    const xpDelta = saveState.xp - prev.xp;

    let leveledUpSkill: { skill: keyof SkillTree; level: number } | undefined;
    (Object.keys(saveState.skills) as (keyof SkillTree)[]).forEach((k) => {
      if (saveState.skills[k] > prev.skills[k]) {
        leveledUpSkill = { skill: k, level: saveState.skills[k] };
      }
    });

    const newlyUnlockedId = saveState.unlockedAbilities.find(
      (id) => !prev.abilities.includes(id)
    );
    const unlockedAbility = newlyUnlockedId
      ? ABILITY_DEFINITIONS.find((a) => a.id === newlyUnlockedId)?.name
      : undefined;

    const promotedRank =
      saveState.detectiveRank !== prev.rank && saveState.xp > prev.xp
        ? saveState.detectiveRank
        : undefined;

    prevProgressRef.current = {
      xp: saveState.xp,
      skills: { ...saveState.skills },
      abilities: [...saveState.unlockedAbilities],
      rank: saveState.detectiveRank,
    };

    if (xpDelta > 0) {
      const meta = pendingXpMetaRef.current;
      pendingXpMetaRef.current = null;
      const skill: keyof SkillTree =
        meta?.skill ?? leveledUpSkill?.skill ?? 'observation';
      const reason = meta?.reason ?? 'Investigation Progress';
      const isMilestone = Boolean(
        leveledUpSkill || unlockedAbility || promotedRank
      );

      if (isMilestone && !saveState.settings.sfxMuted) {
        noirAudio.playSfx('unlock');
      }

      const id = `xp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const popup: XpPopupItem = {
        id,
        xpAmount: xpDelta,
        skill,
        reason,
        focusBonus: meta?.focusBonus,
        leveledUpSkill,
        unlockedAbility,
        promotedRank,
        isSecretOrDeduction: meta?.isSecretOrDeduction,
      };

      setXpPopups((curr) => [...curr.slice(-2), popup]);
      window.setTimeout(() => {
        setXpPopups((curr) => curr.filter((p) => p.id !== id));
      }, isMilestone ? 4500 : 3200);
    } else {
      pendingXpMetaRef.current = null;
    }
  }, [
    saveState.xp,
    saveState.skills,
    saveState.unlockedAbilities,
    saveState.detectiveRank,
    saveState.settings.sfxMuted,
  ]);

  const resolveSceneMood = useCallback((): MusicMood => {
    if (intuitionActive) return 'intuition';
    const screen = saveState.currentScreen;
    if (screen === 'MAIN_MENU') return 'menu';
    if (screen === 'CRIME_SCENE') return 'crime_scene';
    if (screen === 'INTERROGATION') return 'interrogation';
    if (screen === 'CASE_OUTCOME' || screen === 'FINAL_ENDING') return 'revelation';
    return 'office';
  }, [intuitionActive, saveState.currentScreen]);

  // Sync Web Audio volumes, mute flags, dynamic mood & AI music score
  useEffect(() => {
    noirAudio.setVolumes(
      saveState.settings.musicMuted ? 0 : saveState.settings.musicVolume,
      saveState.settings.sfxMuted ? 0 : saveState.settings.sfxVolume
    );

    const mood = resolveSceneMood();
    noirAudio.setMood(mood);

    if (
      saveState.settings.aiMusicEnabled &&
      !saveState.settings.musicMuted &&
      saveState.started &&
      !intuitionActive
    ) {
      let cancelled = false;
      const tension =
        mood === 'revelation'
          ? 85
          : mood === 'interrogation'
          ? 72
          : mood === 'crime_scene'
          ? 58
          : 38;

      setComposingMusic(true);
      noirAudio
        .composeAiTrack({
          mood,
          caseTitle: activeCase.title,
          locationName: activeCase.locationName,
          tension,
        })
        .then((res) => {
          if (!cancelled && res.score) {
            setAiTrack(res.score);
          }
        })
        .finally(() => {
          if (!cancelled) setComposingMusic(false);
        });

      return () => {
        cancelled = true;
      };
    }
  }, [
    resolveSceneMood,
    saveState.settings.musicVolume,
    saveState.settings.sfxVolume,
    saveState.settings.musicMuted,
    saveState.settings.sfxMuted,
    saveState.settings.aiMusicEnabled,
    saveState.started,
    activeCase.title,
    activeCase.locationName,
    intuitionActive,
  ]);

  // Detective's Intuition countdown timer (1s tick)
  useEffect(() => {
    if (intuitionSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setIntuitionSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [intuitionSeconds]);

  // Passive Focus recharge (+2 every 4s during active gameplay when Intuition is off)
  useEffect(() => {
    if (!isInCasePlay || intuitionActive) return;
    const timer = window.setInterval(() => {
      setSaveState((prev) => {
        if (prev.focus >= 100) return prev;
        return { ...prev, focus: Math.min(100, prev.focus + 2) };
      });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [isInCasePlay, intuitionActive]);

  // Active investigation clock (tracks elapsed case speed for Pressure Timer & Leaderboard)
  useEffect(() => {
    if (
      !isInCasePlay ||
      demoActive ||
      activeProgress.status !== 'active' ||
      showAccusation
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setSaveState((prev) => {
        const cs = prev.caseStates[activeCase.id];
        if (!cs || cs.status !== 'active') return prev;
        return {
          ...prev,
          caseStates: {
            ...prev.caseStates,
            [activeCase.id]: {
              ...cs,
              elapsedSeconds: (cs.elapsedSeconds ?? 0) + 1,
            },
          },
        };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [
    isInCasePlay,
    demoActive,
    activeProgress.status,
    showAccusation,
    activeCase.id,
  ]);

  // Trigger Pressure Timer urgency cues at 60s remaining and deadline expiration
  useEffect(() => {
    if (!isInCasePlay || !pressureEnabled || activeProgress.status !== 'active') return;
    if (remainingSeconds === 60) {
      pushNotification(
        'Precinct Deadline Approaching',
        'One minute remaining to secure full Rank speed bonuses.',
        'crimson'
      );
    } else if (remainingSeconds === 0) {
      if (!saveState.settings.sfxMuted) noirAudio.playSfx('siren');
      pushNotification(
        'Deadline Expired',
        'Overtime active — Detective Rank speed bonus lost.',
        'crimson'
      );
    }
  }, [
    isInCasePlay,
    pressureEnabled,
    activeProgress.status,
    remainingSeconds,
    saveState.settings.sfxMuted,
    pushNotification,
  ]);

  const navigate = useCallback(
    (screen: ScreenMode) => {
      setHintToast(null);
      if (demoActive && screen === 'MAIN_MENU') {
        const backup = realSaveBackupRef.current;
        realSaveBackupRef.current = null;
        lastExecutedDemoStepRef.current = -1;
        setDemoActive(false);
        setDemoPaused(false);
        setDemoFocusHotspotId(null);
        setDemoFocusSuspectId(null);
        setIntuitionSeconds(0);
        setXpPopups([]);
        if (backup) {
          prevProgressRef.current = {
            xp: backup.xp,
            skills: { ...backup.skills },
            abilities: [...backup.unlockedAbilities],
            rank: backup.detectiveRank,
          };
          setSaveState({ ...backup, currentScreen: 'MAIN_MENU' });
          return;
        }
      }
      setSaveState((prev) => ({ ...prev, currentScreen: screen }));
    },
    [demoActive]
  );

  const activateIntuition = useCallback(() => {
    if (intuitionActive) return;
    if (saveState.focus < INTUITION_COST) {
      setHintToast(
        `Not enough Focus (${saveState.focus}/${INTUITION_COST}). Focus recharges over time and when uncovering clues.`
      );
      return;
    }
    noirAudio.unlockAudio();
    noirAudio.playSfx('intuition');
    const duration =
      14 + Math.min(6, (saveState.skills.observation + saveState.skills.deduction - 2) * 2);
    setSaveState((prev) => ({
      ...prev,
      focus: Math.max(0, prev.focus - INTUITION_COST),
    }));
    setIntuitionSeconds(duration);
    pushNotification(
      "Detective's Intuition",
      `Heightened perception active for ${duration}s.`,
      'crimson'
    );
  }, [
    intuitionActive,
    saveState.focus,
    saveState.skills.observation,
    saveState.skills.deduction,
    pushNotification,
  ]);

  // Keyboard shortcuts during gameplay
  useEffect(() => {
    if (!isInCasePlay) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === '1') navigate('DETECTIVE_OFFICE');
      else if (e.key === '2') navigate('CRIME_SCENE');
      else if (e.key === '3') navigate('INTERROGATION');
      else if (e.key === '4') navigate('FORENSIC_LAB');
      else if (e.key === '5') navigate('BOARD_AND_TIMELINE');
      else if (e.key.toLowerCase() === 'i') activateIntuition();
      else if (e.key.toLowerCase() === 'j') {
        noirAudio.playSfx('click');
        setShowJournal((prev) => !prev);
      } else if (e.key === ',') navigate('SETTINGS');
      else if (e.key === 'Escape') {
        if (showJournal) setShowJournal(false);
        else if (showAccusation) setShowAccusation(false);
        else navigate('DETECTIVE_OFFICE');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isInCasePlay, showAccusation, showJournal, navigate, activateIntuition]);

  const handleUpdateNotes = (notes: string) => {
    setSaveState((prev) => ({
      ...prev,
      caseStates: {
        ...prev.caseStates,
        [activeCase.id]: {
          ...prev.caseStates[activeCase.id],
          playerNotes: notes,
        },
      },
    }));
  };

  const handleAddJournalEntry = (
    entry: Omit<JournalEntry, 'id' | 'createdAt'>,
    syncToNotes: boolean
  ) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: `jrn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const catLabel =
      entry.category === 'suspect_quirk'
        ? 'Suspect Quirk'
        : entry.category === 'theory'
        ? 'Personal Theory'
        : 'Observation';
    const suspectName = entry.suspectId
      ? activeCase.suspects.find((s) => s.id === entry.suspectId)?.name
      : undefined;
    const prefix = suspectName ? `[${catLabel} · ${suspectName}]` : `[${catLabel}]`;
    const syncLine = `• ${prefix} ${newEntry.title}: ${newEntry.content}`;

    setSaveState((prev) => {
      const cs = prev.caseStates[activeCase.id];
      const existingEntries = cs.journalEntries ?? [];
      const nextNotes =
        syncToNotes && !cs.playerNotes.includes(syncLine)
          ? cs.playerNotes
            ? `${cs.playerNotes}\n${syncLine}`
            : syncLine
          : cs.playerNotes;

      return {
        ...prev,
        caseStates: {
          ...prev.caseStates,
          [activeCase.id]: {
            ...cs,
            journalEntries: [newEntry, ...existingEntries],
            playerNotes: nextNotes,
          },
        },
      };
    });
    pushNotification('Journal Entry Logged', newEntry.title, 'gold');
  };

  const handleUpdateJournalEntry = (
    entryId: string,
    updates: Partial<
      Pick<JournalEntry, 'category' | 'suspectId' | 'title' | 'content' | 'pinned'>
    >
  ) => {
    setSaveState((prev) => {
      const cs = prev.caseStates[activeCase.id];
      return {
        ...prev,
        caseStates: {
          ...prev.caseStates,
          [activeCase.id]: {
            ...cs,
            journalEntries: (cs.journalEntries ?? []).map((item) =>
              item.id === entryId ? { ...item, ...updates } : item
            ),
          },
        },
      };
    });
  };

  const handleDeleteJournalEntry = (entryId: string) => {
    setSaveState((prev) => {
      const cs = prev.caseStates[activeCase.id];
      return {
        ...prev,
        caseStates: {
          ...prev.caseStates,
          [activeCase.id]: {
            ...cs,
            journalEntries: (cs.journalEntries ?? []).filter(
              (item) => item.id !== entryId
            ),
          },
        },
      };
    });
  };

  const awardSkillXp = (
    prev: GameSaveState,
    xpAmount: number,
    skillKey: keyof SkillTree,
    focusBonus = 0
  ): Pick<
    GameSaveState,
    'xp' | 'detectiveRank' | 'skills' | 'unlockedAbilities' | 'focus'
  > => {
    const newXp = prev.xp + xpAmount;
    const nextSkillLevel = Math.min(
      5,
      1 + Math.floor((prev.skills[skillKey] * 120 + xpAmount) / 140)
    );
    const updatedSkills: SkillTree = {
      ...prev.skills,
      [skillKey]: Math.max(prev.skills[skillKey], nextSkillLevel),
    };
    return {
      xp: newXp,
      detectiveRank: getRankForXp(newXp),
      skills: updatedSkills,
      unlockedAbilities: recalculateUnlockedAbilities(updatedSkills),
      focus: Math.min(100, prev.focus + focusBonus),
    };
  };

  // Handlers
  const handleNewInvestigation = () => {
    const fresh = createNewGameState(saveState.settings);
    fresh.started = true;
    fresh.currentScreen = 'DETECTIVE_OFFICE';
    prevProgressRef.current = {
      xp: fresh.xp,
      skills: { ...fresh.skills },
      abilities: [...fresh.unlockedAbilities],
      rank: fresh.detectiveRank,
    };
    realSaveBackupRef.current = null;
    lastExecutedDemoStepRef.current = -1;
    setDemoActive(false);
    setDemoFocusHotspotId(null);
    setDemoFocusSuspectId(null);
    setXpPopups([]);
    setShowJournal(false);
    setIntuitionSeconds(0);
    setSaveState(fresh);
  };

  const handleContinueInvestigation = () => {
    realSaveBackupRef.current = null;
    setDemoActive(false);
    setDemoFocusHotspotId(null);
    setDemoFocusSuspectId(null);
    setSaveState((prev) => ({
      ...prev,
      started: true,
      currentScreen: 'DETECTIVE_OFFICE',
    }));
  };

  const handleStartDemo = () => {
    if (!demoActive) {
      realSaveBackupRef.current = saveState;
    }
    const demoState = createNewGameState(saveState.settings);
    demoState.started = true;
    demoState.currentScreen = 'DETECTIVE_OFFICE';
    prevProgressRef.current = {
      xp: demoState.xp,
      skills: { ...demoState.skills },
      abilities: [...demoState.unlockedAbilities],
      rank: demoState.detectiveRank,
    };
    lastExecutedDemoStepRef.current = -1;
    setXpPopups([]);
    setShowJournal(false);
    setShowAccusation(false);
    setIntuitionSeconds(0);
    setDemoFocusHotspotId(null);
    setDemoFocusSuspectId(null);
    setDemoStepIndex(0);
    setDemoPaused(false);
    setDemoActive(true);
    setSaveState(demoState);
  };

  const handleExitDemo = () => {
    const backup = realSaveBackupRef.current;
    realSaveBackupRef.current = null;
    lastExecutedDemoStepRef.current = -1;
    setDemoActive(false);
    setDemoPaused(false);
    setDemoFocusHotspotId(null);
    setDemoFocusSuspectId(null);
    setIntuitionSeconds(0);
    setXpPopups([]);
    if (backup) {
      prevProgressRef.current = {
        xp: backup.xp,
        skills: { ...backup.skills },
        abilities: [...backup.unlockedAbilities],
        rank: backup.detectiveRank,
      };
      setSaveState(backup);
    } else {
      navigate('MAIN_MENU');
    }
  };

  const handleTakeOverFromDemo = () => {
    realSaveBackupRef.current = null;
    lastExecutedDemoStepRef.current = -1;
    setDemoActive(false);
    setDemoPaused(false);
    setDemoFocusHotspotId(null);
    setDemoFocusSuspectId(null);
    saveGameToStorage(saveState);
    pushNotification(
      'Player Control Active',
      'You have taken over the investigation from Computer Mode.',
      'emerald'
    );
  };

  const handleInspectHotspot = (hs: SceneHotspot) => {
    if (!activeProgress.inspectedHotspotIds.includes(hs.id)) {
      pendingXpMetaRef.current = {
        reason:
          hs.requiresUV || hs.requiresZoom
            ? `Hidden Detail: ${hs.label}`
            : `Inspected: ${hs.label}`,
        skill: 'observation',
        focusBonus: 10,
        isSecretOrDeduction: Boolean(hs.requiresUV || hs.requiresZoom),
      };
    }
    setSaveState((prev) => {
      const cs = prev.caseStates[activeCase.id];
      const already = cs.inspectedHotspotIds.includes(hs.id);
      const skillUp = already ? {} : awardSkillXp(prev, 25, 'observation', 10);

      return {
        ...prev,
        ...skillUp,
        caseStates: {
          ...prev.caseStates,
          [activeCase.id]: {
            ...cs,
            inspectedHotspotIds: already
              ? cs.inspectedHotspotIds
              : [...cs.inspectedHotspotIds, hs.id],
          },
        },
      };
    });
  };

  const handlePhotographHotspot = (hs: SceneHotspot) => {
    if (!activeProgress.photographedHotspotIds.includes(hs.id)) {
      pendingXpMetaRef.current = {
        reason: `Photographed: ${hs.label}`,
        skill: 'observation',
        focusBonus: 8,
      };
    }
    setSaveState((prev) => {
      const cs = prev.caseStates[activeCase.id];
      const already = cs.photographedHotspotIds.includes(hs.id);
      const skillUp = already ? {} : awardSkillXp(prev, 20, 'observation', 8);

      return {
        ...prev,
        ...skillUp,
        caseStates: {
          ...prev.caseStates,
          [activeCase.id]: {
            ...cs,
            photographedHotspotIds: already
              ? cs.photographedHotspotIds
              : [...cs.photographedHotspotIds, hs.id],
            inspectedHotspotIds: cs.inspectedHotspotIds.includes(hs.id)
              ? cs.inspectedHotspotIds
              : [...cs.inspectedHotspotIds, hs.id],
          },
        },
      };
    });
  };

  const handleCollectEvidence = (evidenceId: string) => {
    const ev = activeCase.evidence.find((e) => e.id === evidenceId);
    const isNew = !activeProgress.discoveredEvidenceIds.includes(evidenceId);
    if (isNew && ev) {
      pendingXpMetaRef.current = {
        reason:
          ev.importance === 'Secret'
            ? `Secret Clue Found: ${ev.name}`
            : `Clue Collected: ${ev.name}`,
        skill: ev.category === 'Digital' ? 'digital' : 'observation',
        focusBonus: 18,
        isSecretOrDeduction: ev.importance === 'Secret' || ev.importance === 'Critical',
      };
      pushNotification(
        'Evidence Logged',
        `${ev.name} added to Case File (+18 Focus).`,
        'gold'
      );
    }

    setSaveState((prev) => {
      const cs = prev.caseStates[activeCase.id];
      if (cs.discoveredEvidenceIds.includes(evidenceId)) return prev;

      const unlockedTL = activeCase.timelineEvents
        .filter(
          (t) =>
            t.requiredEvidenceId === evidenceId &&
            (!ev?.requiresAnalysis || !ev.requiresAnalysis)
        )
        .map((t) => t.id);

      const mergedTL = Array.from(
        new Set([...cs.unlockedTimelineIds, ...unlockedTL])
      );
      const orderedTL = Array.from(
        new Set([...cs.orderedTimelineIds, ...unlockedTL])
      );

      const skillUp = awardSkillXp(
        prev,
        ev?.importance === 'Secret' ? 55 : 35,
        ev?.category === 'Digital' ? 'digital' : 'observation',
        18
      );

      return {
        ...prev,
        ...skillUp,
        caseStates: {
          ...prev.caseStates,
          [activeCase.id]: {
            ...cs,
            discoveredEvidenceIds: [...cs.discoveredEvidenceIds, evidenceId],
            unlockedTimelineIds: mergedTL,
            orderedTimelineIds: orderedTL,
          },
        },
      };
    });
  };

  const handleCompleteAnalysis = (evidenceId: string) => {
    const ev = activeCase.evidence.find((e) => e.id === evidenceId);
    const isNew = !activeProgress.analyzedEvidenceIds.includes(evidenceId);
    if (isNew && ev) {
      pendingXpMetaRef.current = {
        reason: `Lab Verified: ${ev.name}`,
        skill: ev.category === 'Digital' ? 'digital' : 'forensics',
        focusBonus: 22,
        isSecretOrDeduction: true,
      };
      pushNotification(
        'Forensic Analysis Complete',
        `${ev.name} verified in Forensic Lab.`,
        'emerald'
      );
    }

    setSaveState((prev) => {
      const cs = prev.caseStates[activeCase.id];
      if (cs.analyzedEvidenceIds.includes(evidenceId)) return prev;

      const unlockedTL = activeCase.timelineEvents
        .filter((t) => t.requiredEvidenceId === evidenceId)
        .map((t) => t.id);

      const mergedTL = Array.from(
        new Set([...cs.unlockedTimelineIds, ...unlockedTL])
      );
      const orderedTL = Array.from(
        new Set([...cs.orderedTimelineIds, ...unlockedTL])
      );

      const skillKey: keyof SkillTree =
        ev?.category === 'Digital' ? 'digital' : 'forensics';
      const skillUp = awardSkillXp(prev, 65, skillKey, 22);

      return {
        ...prev,
        ...skillUp,
        caseStates: {
          ...prev.caseStates,
          [activeCase.id]: {
            ...cs,
            analyzedEvidenceIds: [...cs.analyzedEvidenceIds, evidenceId],
            unlockedTimelineIds: mergedTL,
            orderedTimelineIds: orderedTL,
          },
        },
      };
    });
  };

  const handleAskQuestion = (
    suspectId: string,
    option: DialogueOption,
    stance: InterrogationStance = 'balanced'
  ) => {
    const alreadyAsked = (
      activeProgress.askedDialogueIds[suspectId] ?? []
    ).includes(option.id);
    if (!alreadyAsked) {
      pendingXpMetaRef.current = {
        reason:
          stance === 'empathetic'
            ? 'Empathetic Inquiry'
            : stance === 'aggressive'
            ? 'Hardball Interrogation'
            : 'Suspect Questioned',
        skill: 'interrogation',
        focusBonus: 8,
      };
    }

    const stanceTrustDelta =
      stance === 'empathetic' ? 6 : stance === 'aggressive' ? -8 : 0;
    const stancePressureDelta =
      stance === 'empathetic' ? -4 : stance === 'aggressive' ? 12 : 0;
    const stanceRepDelta = alreadyAsked
      ? 0
      : stance === 'aggressive'
      ? -2
      : 1;

    setSaveState((prev) => {
      const cs = prev.caseStates[activeCase.id];
      const asked = cs.askedDialogueIds[suspectId] ?? [];
      const trust = Math.max(
        0,
        Math.min(
          100,
          (cs.suspectTrust[suspectId] ?? 50) + option.trustDelta + stanceTrustDelta
        )
      );
      const pressure = Math.max(
        0,
        Math.min(
          100,
          (cs.suspectPressure[suspectId] ?? 10) +
            option.pressureDelta +
            stancePressureDelta
        )
      );

      const unlockedTL = option.unlocksTimelineEventId
        ? [option.unlocksTimelineEventId]
        : [];
      const mergedTL = Array.from(
        new Set([...cs.unlockedTimelineIds, ...unlockedTL])
      );
      const orderedTL = Array.from(
        new Set([...cs.orderedTimelineIds, ...unlockedTL])
      );

      const notes =
        option.unlocksNote && !cs.playerNotes.includes(option.unlocksNote)
          ? `${cs.playerNotes ? cs.playerNotes + '\n' : ''}• ${option.unlocksNote}`
          : cs.playerNotes;

      const skillUp = asked.includes(option.id)
        ? {}
        : awardSkillXp(prev, 25, 'interrogation', 8);

      const nextConduct = asked.includes(option.id)
        ? prev.conduct
        : {
            empatheticChoices:
              prev.conduct.empatheticChoices + (stance === 'empathetic' ? 1 : 0),
            aggressiveChoices:
              prev.conduct.aggressiveChoices + (stance === 'aggressive' ? 1 : 0),
            byTheBookChoices:
              prev.conduct.byTheBookChoices + (stance === 'balanced' ? 1 : 0),
          };

      const suspectObj = activeCase.suspects.find((s) => s.id === suspectId);
      const baseTranscript = suspectObj
        ? getSuspectTranscriptHistory(activeCase, cs, suspectObj)
        : cs.interrogationTranscripts?.[suspectId] ?? [];
      const timeStamp = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const stancePrefix =
        stance === 'empathetic'
          ? '[Empathetic] '
          : stance === 'aggressive'
          ? '[Hardball] '
          : '';
      const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const appendedEntries: TranscriptEntry[] = suspectObj
        ? [
            {
              id: `tr_q_${uid}`,
              suspectId,
              suspectName: suspectObj.name,
              speaker: 'Detective Alex Morgan',
              text: `${stancePrefix}${option.label}`,
              tone: 'detective',
              kind: 'question',
              stance,
              questionLabel: option.label,
              timestamp: timeStamp,
            },
            {
              id: `tr_a_${uid}`,
              suspectId,
              suspectName: suspectObj.name,
              speaker: suspectObj.name,
              text: option.response,
              tone: 'suspect',
              kind: 'answer',
              stance,
              questionLabel: option.label,
              timestamp: timeStamp,
            },
          ]
        : [];

      return {
        ...prev,
        ...skillUp,
        reputation: Math.max(0, Math.min(100, prev.reputation + stanceRepDelta)),
        conduct: nextConduct,
        caseStates: {
          ...prev.caseStates,
          [activeCase.id]: {
            ...cs,
            askedDialogueIds: {
              ...cs.askedDialogueIds,
              [suspectId]: asked.includes(option.id) ? asked : [...asked, option.id],
            },
            suspectTrust: { ...cs.suspectTrust, [suspectId]: trust },
            suspectPressure: { ...cs.suspectPressure, [suspectId]: pressure },
            suspectEmotions: {
              ...cs.suspectEmotions,
              [suspectId]: option.emotionAfter,
            },
            unlockedTimelineIds: mergedTL,
            orderedTimelineIds: orderedTL,
            playerNotes: notes,
            interrogationTranscripts: {
              ...(cs.interrogationTranscripts ?? {}),
              [suspectId]: [...baseTranscript, ...appendedEntries],
            },
          },
        },
      };
    });
  };

  const handleToggleTranscriptFlag = (entryId: string) => {
    setSaveState((prev) => {
      const cs = prev.caseStates[activeCase.id];
      const existing = cs.flaggedTranscriptIds ?? [];
      const nextFlags = existing.includes(entryId)
        ? existing.filter((id) => id !== entryId)
        : [...existing, entryId];
      return {
        ...prev,
        caseStates: {
          ...prev.caseStates,
          [activeCase.id]: {
            ...cs,
            flaggedTranscriptIds: nextFlags,
          },
        },
      };
    });
  };

  const handlePresentEvidence = (suspectId: string, evidenceId: string) => {
    const suspect = activeCase.suspects.find((s) => s.id === suspectId);
    if (!suspect) {
      return { matched: false, reaction: 'No suspect selected.' };
    }

    const ev = activeCase.evidence.find((e) => e.id === evidenceId);
    const evName = ev?.name ?? 'Evidence';
    const timeStamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const match = suspect.contradictions.find((c) => c.evidenceId === evidenceId);
    if (!match) {
      setSaveState((prev) => {
        const cs = prev.caseStates[activeCase.id];
        const baseTranscript = getSuspectTranscriptHistory(activeCase, cs, suspect);
        const rejectionEntries: TranscriptEntry[] = [
          {
            id: `tr_ev_d_${uid}`,
            suspectId,
            suspectName: suspect.name,
            speaker: `Detective Morgan [Presents: ${evName}]`,
            text: `What do you say to ${evName}?`,
            tone: 'detective',
            kind: 'evidence_check',
            evidenceId,
            evidenceName: evName,
            timestamp: timeStamp,
          },
          {
            id: `tr_ev_s_${uid}`,
            suspectId,
            suspectName: suspect.name,
            speaker: suspect.name,
            text: suspect.genericRejection,
            tone: 'suspect',
            kind: 'evidence_check',
            evidenceId,
            evidenceName: evName,
            timestamp: timeStamp,
          },
        ];
        return {
          ...prev,
          caseStates: {
            ...prev.caseStates,
            [activeCase.id]: {
              ...cs,
              interrogationTranscripts: {
                ...(cs.interrogationTranscripts ?? {}),
                [suspectId]: [...baseTranscript, ...rejectionEntries],
              },
            },
          },
        };
      });
      return { matched: false, reaction: suspect.genericRejection };
    }

    const analyzed = activeProgress.analyzedEvidenceIds.includes(evidenceId);
    if (match.mustBeAnalyzed && !analyzed) {
      const needsMsg =
        'You cannot prove a contradiction with raw unexamined evidence. Analyze this item in the Forensic Lab first.';
      setSaveState((prev) => {
        const cs = prev.caseStates[activeCase.id];
        const baseTranscript = getSuspectTranscriptHistory(activeCase, cs, suspect);
        const sysEntries: TranscriptEntry[] = [
          {
            id: `tr_ev_d_${uid}`,
            suspectId,
            suspectName: suspect.name,
            speaker: `Detective Morgan [Presents: ${evName}]`,
            text: `Look closely at ${evName}.`,
            tone: 'detective',
            kind: 'evidence_check',
            evidenceId,
            evidenceName: evName,
            timestamp: timeStamp,
          },
          {
            id: `tr_ev_sys_${uid}`,
            suspectId,
            suspectName: suspect.name,
            speaker: 'Case Protocol',
            text: needsMsg,
            tone: 'system',
            kind: 'system',
            evidenceId,
            evidenceName: evName,
            timestamp: timeStamp,
          },
        ];
        return {
          ...prev,
          caseStates: {
            ...prev.caseStates,
            [activeCase.id]: {
              ...cs,
              interrogationTranscripts: {
                ...(cs.interrogationTranscripts ?? {}),
                [suspectId]: [...baseTranscript, ...sysEntries],
              },
            },
          },
        };
      });
      return {
        matched: false,
        needsAnalysis: true,
        reaction: needsMsg,
      };
    }

    const alreadyFound = (
      activeProgress.foundContradictions[suspectId] ?? []
    ).includes(evidenceId);

    if (!alreadyFound) {
      pendingXpMetaRef.current = {
        reason: `Contradiction Exposed: ${suspect.name}`,
        skill: 'interrogation',
        focusBonus: 25,
        isSecretOrDeduction: true,
      };
      pushNotification(
        'Contradiction Exposed',
        `${suspect.name}'s alibi fractured under cross-examination.`,
        'crimson'
      );
    }

    setSaveState((prev) => {
      const cs = prev.caseStates[activeCase.id];
      const existing = cs.foundContradictions[suspectId] ?? [];
      const trust = Math.max(
        0,
        Math.min(100, (cs.suspectTrust[suspectId] ?? 50) + match.trustDelta)
      );
      const pressure = Math.max(
        0,
        Math.min(100, (cs.suspectPressure[suspectId] ?? 10) + match.pressureDelta)
      );

      const unlockedTL = match.unlocksTimelineEventId
        ? [match.unlocksTimelineEventId]
        : [];
      const mergedTL = Array.from(
        new Set([...cs.unlockedTimelineIds, ...unlockedTL])
      );
      const orderedTL = Array.from(
        new Set([...cs.orderedTimelineIds, ...unlockedTL])
      );

      const notes =
        match.unlocksNote && !cs.playerNotes.includes(match.unlocksNote)
          ? `${cs.playerNotes ? cs.playerNotes + '\n' : ''}• ${match.unlocksNote}`
          : cs.playerNotes;

      const skillUp = alreadyFound
        ? {}
        : awardSkillXp(prev, match.xpReward, 'interrogation', 25);

      const baseTranscript = getSuspectTranscriptHistory(activeCase, cs, suspect);
      const contraEntries: TranscriptEntry[] = [
        {
          id: `tr_con_d_${uid}`,
          suspectId,
          suspectName: suspect.name,
          speaker: `Detective Morgan [Presents: ${evName}]`,
          text: match.rebuttalDialogue,
          tone: 'contradiction',
          kind: 'contradiction',
          evidenceId,
          evidenceName: evName,
          timestamp: timeStamp,
        },
        {
          id: `tr_con_s_${uid}`,
          suspectId,
          suspectName: suspect.name,
          speaker: suspect.name,
          text: match.suspectReaction,
          tone: 'suspect',
          kind: 'answer',
          evidenceId,
          evidenceName: evName,
          timestamp: timeStamp,
        },
      ];

      return {
        ...prev,
        ...skillUp,
        reputation: Math.max(
          0,
          Math.min(100, prev.reputation + (alreadyFound ? 0 : 3))
        ),
        caseStates: {
          ...prev.caseStates,
          [activeCase.id]: {
            ...cs,
            foundContradictions: {
              ...cs.foundContradictions,
              [suspectId]: existing.includes(evidenceId)
                ? existing
                : [...existing, evidenceId],
            },
            suspectTrust: { ...cs.suspectTrust, [suspectId]: trust },
            suspectPressure: { ...cs.suspectPressure, [suspectId]: pressure },
            suspectEmotions: {
              ...cs.suspectEmotions,
              [suspectId]: match.emotionAfter,
            },
            unlockedTimelineIds: mergedTL,
            orderedTimelineIds: orderedTL,
            playerNotes: notes,
            interrogationTranscripts: {
              ...(cs.interrogationTranscripts ?? {}),
              [suspectId]: [...baseTranscript, ...contraEntries],
            },
          },
        },
      };
    });

    return {
      matched: true,
      alreadyFound,
      rebuttal: match.rebuttalDialogue,
      reaction: match.suspectReaction,
    };
  };

  const handleUpdateBoardPosition = (nodeId: string, x: number, y: number) => {
    setSaveState((prev) => {
      const cs = prev.caseStates[activeCase.id];
      return {
        ...prev,
        caseStates: {
          ...prev.caseStates,
          [activeCase.id]: {
            ...cs,
            boardPositions: { ...cs.boardPositions, [nodeId]: { x, y } },
          },
        },
      };
    });
  };

  const handleAddBoardConnection = (
    fromId: string,
    toId: string,
    relation: LinkRelationType
  ) => {
    const matchingRule = activeCase.deductionRules.find(
      (r) =>
        (r.nodeA === fromId && r.nodeB === toId) ||
        (r.nodeA === toId && r.nodeB === fromId)
    );
    const alreadyLinked = activeProgress.boardConnections.some(
      (c) =>
        (c.fromId === fromId && c.toId === toId) ||
        (c.fromId === toId && c.toId === fromId)
    );
    if (!alreadyLinked) {
      pendingXpMetaRef.current = {
        reason: matchingRule
          ? `Deduction Confirmed: ${matchingRule.label}`
          : 'Board Thread Linked',
        skill: 'deduction',
        focusBonus: matchingRule ? 12 : 6,
        isSecretOrDeduction: Boolean(matchingRule),
      };
    }

    setSaveState((prev) => {
      const cs = prev.caseStates[activeCase.id];
      const dup = cs.boardConnections.some(
        (c) =>
          (c.fromId === fromId && c.toId === toId) ||
          (c.fromId === toId && c.toId === fromId)
      );
      if (dup) return prev;
      const newConn = {
        id: `conn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        fromId,
        toId,
        relation,
      };
      const skillUp = awardSkillXp(
        prev,
        matchingRule ? 45 : 20,
        'deduction',
        matchingRule ? 12 : 6
      );
      return {
        ...prev,
        ...skillUp,
        caseStates: {
          ...prev.caseStates,
          [activeCase.id]: {
            ...cs,
            boardConnections: [...cs.boardConnections, newConn],
          },
        },
      };
    });
  };

  const handleRemoveBoardConnection = (connId: string) => {
    setSaveState((prev) => {
      const cs = prev.caseStates[activeCase.id];
      return {
        ...prev,
        caseStates: {
          ...prev.caseStates,
          [activeCase.id]: {
            ...cs,
            boardConnections: cs.boardConnections.filter((c) => c.id !== connId),
          },
        },
      };
    });
  };

  const handleReorderTimeline = (newOrder: string[]) => {
    setSaveState((prev) => {
      const cs = prev.caseStates[activeCase.id];
      return {
        ...prev,
        caseStates: {
          ...prev.caseStates,
          [activeCase.id]: {
            ...cs,
            orderedTimelineIds: newOrder,
            timelineVerified: false,
          },
        },
      };
    });
  };

  const handleVerifyTimeline = (): boolean => {
    const cs = activeProgress;
    const hasRequired = activeCase.requiredTimelineIds.every((id) =>
      cs.orderedTimelineIds.includes(id)
    );
    if (!hasRequired) return false;

    const events = cs.orderedTimelineIds
      .map((id) => activeCase.timelineEvents.find((t) => t.id === id))
      .filter((t): t is NonNullable<typeof t> => Boolean(t));

    for (let i = 1; i < events.length; i++) {
      if (events[i].sortMinutes < events[i - 1].sortMinutes) return false;
    }

    pendingXpMetaRef.current = {
      reason: 'Chronological Timeline Verified',
      skill: 'deduction',
      focusBonus: 20,
      isSecretOrDeduction: true,
    };

    setSaveState((prev) => {
      const skillUp = awardSkillXp(prev, 60, 'deduction', 20);
      return {
        ...prev,
        ...skillUp,
        caseStates: {
          ...prev.caseStates,
          [activeCase.id]: {
            ...prev.caseStates[activeCase.id],
            timelineVerified: true,
          },
        },
      };
    });
    pushNotification(
      'Timeline Verified',
      'Chronological sequence confirmed for case dossier.',
      'emerald'
    );
    return true;
  };

  const handleSubmitAccusation = (
    suspectId: string,
    selectedEvidenceIds: string[]
  ) => {
    const keyMatches = activeCase.keyContradictionEvidenceIds.filter((k) =>
      selectedEvidenceIds.includes(k)
    ).length;

    const isRightCulprit = suspectId === activeCase.correctCulpritId;
    const hasSufficientProof =
      keyMatches >= Math.min(2, activeCase.keyContradictionEvidenceIds.length);

    const solvedTruth = isRightCulprit && hasSufficientProof;
    const caseElapsed = activeProgress.elapsedSeconds ?? 0;
    const pressureReward = calculatePressureReward(
      caseElapsed,
      pressureDeadline,
      solvedTruth,
      pressureEnabled
    );

    const baseXp = solvedTruth ? 140 : 35;
    const netXpGain = baseXp + pressureReward.xpBonus;
    const prevRank = saveState.detectiveRank;
    const projectedXp = Math.max(0, saveState.xp + netXpGain);
    const projectedRank = getRankForXp(projectedXp);
    const projectedReputation = Math.max(
      0,
      Math.min(
        100,
        saveState.reputation + (solvedTruth ? 10 : -15) + pressureReward.repDelta
      )
    );

    recordCaseLeaderboardEntry({
      caseData: activeCase,
      caseState: activeProgress,
      detectiveRank: projectedRank,
      difficulty: saveState.settings.difficulty,
      reputationAtClose: projectedReputation,
      conductStyle: getConductStyle(saveState.conduct),
      solvedTruth,
      isRightCulprit,
      keyMatches,
      elapsedSeconds: caseElapsed,
    });

    setShowAccusation(false);
    setIntuitionSeconds(0);
    pushNotification(
      'Case Verdict Filed',
      pressureEnabled
        ? `${activeCase.title} closed · ${pressureReward.label}.`
        : solvedTruth
        ? `${activeCase.title} closed with verified culprit.`
        : `${activeCase.title} closed with disputed verdict.`,
      solvedTruth ? 'emerald' : 'crimson'
    );
    if (projectedRank !== prevRank) {
      pushNotification(
        'Detective Rank Promoted',
        `You have been promoted to ${projectedRank}.`,
        'gold'
      );
    }

    pendingXpMetaRef.current = {
      reason: solvedTruth
        ? `Case 0${activeCase.number} Solved`
        : `Case 0${activeCase.number} Closed`,
      skill: 'deduction',
      focusBonus: solvedTruth ? 35 : 10,
      isSecretOrDeduction: solvedTruth,
    };

    setSaveState((prev) => {
      const cs = prev.caseStates[activeCase.id];
      const skillUp = awardSkillXp(
        prev,
        Math.max(0, netXpGain),
        'deduction',
        solvedTruth ? 35 : 10
      );
      const finalXp = Math.max(0, prev.xp + netXpGain);

      return {
        ...prev,
        ...skillUp,
        xp: finalXp,
        detectiveRank: getRankForXp(finalXp),
        reputation: Math.max(
          0,
          Math.min(
            100,
            prev.reputation + (solvedTruth ? 10 : -15) + pressureReward.repDelta
          )
        ),
        currentScreen: 'CASE_OUTCOME',
        caseStates: {
          ...prev.caseStates,
          [activeCase.id]: {
            ...cs,
            status: solvedTruth ? 'solved_truth' : 'solved_wrong',
            accusedSuspectId: suspectId,
            speedBonusXp: pressureEnabled ? pressureReward.xpBonus : undefined,
            speedTier: pressureReward.tier,
          },
        },
      };
    });
  };

  const handleChooseDecision = (
    _optionId: string,
    flag: string,
    repDelta: number
  ) => {
    setSaveState((prev) => {
      const cs = prev.caseStates[activeCase.id];
      const flags = prev.decisionFlags.includes(flag)
        ? prev.decisionFlags
        : [...prev.decisionFlags, flag];
      const nextConduct = {
        empatheticChoices:
          prev.conduct.empatheticChoices + (repDelta > 0 ? 1 : 0),
        aggressiveChoices:
          prev.conduct.aggressiveChoices + (repDelta < 0 ? 1 : 0),
        byTheBookChoices:
          prev.conduct.byTheBookChoices + (repDelta === 0 ? 1 : 0),
      };
      return {
        ...prev,
        reputation: Math.max(0, Math.min(100, prev.reputation + repDelta)),
        conduct: nextConduct,
        decisionFlags: flags,
        caseStates: {
          ...prev.caseStates,
          [activeCase.id]: {
            ...cs,
            decisionFlagChosen: flag,
          },
        },
      };
    });
  };

  const handleActivateSupport = (supportId: PrecinctSupportId) => {
    const usedForCase = saveState.usedSupportActions[activeCase.id] ?? [];
    if (usedForCase.includes(supportId)) return;

    const style = getConductStyle(saveState.conduct);

    if (supportId === 'street_canvas') {
      const focusGain = style === 'Empathetic' ? 25 : 15;
      const uncollected = activeCase.evidence.find(
        (e) => !activeProgress.discoveredEvidenceIds.includes(e.id)
      );
      const canvasNote = uncollected
        ? `• [Precinct Patrol Canvas · Sgt. Hale] Patrol witness spotted suspicious activity near ${uncollected.discoveryLocation}.`
        : `• [Precinct Patrol Canvas · Sgt. Hale] Perimeter sweep complete; all primary scene zones accounted for.`;

      setSaveState((prev) => {
        const cs = prev.caseStates[activeCase.id];
        const nextNotes = cs.playerNotes.includes(canvasNote)
          ? cs.playerNotes
          : cs.playerNotes
          ? `${cs.playerNotes}\n${canvasNote}`
          : canvasNote;
        return {
          ...prev,
          focus: Math.min(100, prev.focus + focusGain),
          usedSupportActions: {
            ...prev.usedSupportActions,
            [activeCase.id]: [...(prev.usedSupportActions[activeCase.id] ?? []), supportId],
          },
          caseStates: {
            ...prev.caseStates,
            [activeCase.id]: {
              ...cs,
              playerNotes: nextNotes,
            },
          },
        };
      });
      pushNotification(
        'Street Patrol Canvas Complete',
        `Patrol sighting added to Case Notes (+${focusGain} Focus).`,
        'gold'
      );
    } else if (supportId === 'forensic_rush') {
      const rawTarget = activeCase.evidence.find(
        (e) =>
          activeProgress.discoveredEvidenceIds.includes(e.id) &&
          e.requiresAnalysis &&
          !activeProgress.analyzedEvidenceIds.includes(e.id)
      );

      pendingXpMetaRef.current = {
        reason: rawTarget
          ? `Lab Priority Sweep: ${rawTarget.name}`
          : 'Lab Priority Calibration',
        skill: 'forensics',
        focusBonus: 20,
        isSecretOrDeduction: Boolean(rawTarget),
      };

      setSaveState((prev) => {
        const cs = prev.caseStates[activeCase.id];
        const skillUp = awardSkillXp(prev, 20, 'forensics', 20);
        const unlockedTL = rawTarget
          ? activeCase.timelineEvents
              .filter((t) => t.requiredEvidenceId === rawTarget.id)
              .map((t) => t.id)
          : [];
        return {
          ...prev,
          ...skillUp,
          usedSupportActions: {
            ...prev.usedSupportActions,
            [activeCase.id]: [...(prev.usedSupportActions[activeCase.id] ?? []), supportId],
          },
          caseStates: {
            ...prev.caseStates,
            [activeCase.id]: {
              ...cs,
              analyzedEvidenceIds: rawTarget
                ? [...cs.analyzedEvidenceIds, rawTarget.id]
                : cs.analyzedEvidenceIds,
              unlockedTimelineIds: Array.from(
                new Set([...cs.unlockedTimelineIds, ...unlockedTL])
              ),
              orderedTimelineIds: Array.from(
                new Set([...cs.orderedTimelineIds, ...unlockedTL])
              ),
            },
          },
        };
      });
      pushNotification(
        'Priority Forensics Sweep',
        rawTarget
          ? `Dr. Lin expedited lab verification for ${rawTarget.name}.`
          : 'Dr. Lin calibrated lab equipment (+20 Forensics XP & +20 Focus).',
        'emerald'
      );
    } else if (supportId === 'emergency_warrant') {
      const repCost = saveState.reputation >= 75 ? 0 : 4;
      setSaveState((prev) => {
        const cs = prev.caseStates[activeCase.id];
        const nextPressure = { ...cs.suspectPressure };
        activeCase.suspects.forEach((s) => {
          nextPressure[s.id] = Math.min(100, (nextPressure[s.id] ?? 10) + 15);
        });
        return {
          ...prev,
          focus: Math.min(100, prev.focus + 20),
          reputation: Math.max(0, prev.reputation - repCost),
          usedSupportActions: {
            ...prev.usedSupportActions,
            [activeCase.id]: [...(prev.usedSupportActions[activeCase.id] ?? []), supportId],
          },
          caseStates: {
            ...prev.caseStates,
            [activeCase.id]: {
              ...cs,
              suspectPressure: nextPressure,
            },
          },
        };
      });
      pushNotification(
        'Emergency Warrant Executed',
        'Suspect pressure increased (+15) across all interrogation files (+20 Focus).',
        'crimson'
      );
    } else if (supportId === 'ia_clearance') {
      setSaveState((prev) => {
        const cs = prev.caseStates[activeCase.id];
        const nextTrust = { ...cs.suspectTrust };
        activeCase.suspects.forEach((s) => {
          nextTrust[s.id] = Math.min(100, (nextTrust[s.id] ?? 50) + 12);
        });
        return {
          ...prev,
          focus: Math.min(100, prev.focus + 25),
          usedSupportActions: {
            ...prev.usedSupportActions,
            [activeCase.id]: [...(prev.usedSupportActions[activeCase.id] ?? []), supportId],
          },
          caseStates: {
            ...prev.caseStates,
            [activeCase.id]: {
              ...cs,
              suspectTrust: nextTrust,
            },
          },
        };
      });
      pushNotification(
        'Precinct Moral Backing Active',
        'Suspect cooperation trust increased (+12) and Focus restored (+25).',
        'emerald'
      );
    }
  };

  const runDemoStepRef = useRef<(step: ComputerDemoStep) => void>(() => {});
  runDemoStepRef.current = (step: ComputerDemoStep) => {
    const caseOne = CASES[0];
    navigate(step.screen);
    setDemoFocusHotspotId(step.hotspotId ?? null);
    setDemoFocusSuspectId(step.suspectId ?? null);

    if (step.useIntuition && !intuitionActive) {
      activateIntuition();
    }

    if (step.actionType === 'SCENE_COLLECT' && step.hotspotId) {
      const hotspot = caseOne.locations
        .flatMap((loc) => loc.hotspots)
        .find((h) => h.id === step.hotspotId);
      if (hotspot) {
        handleInspectHotspot(hotspot);
        handlePhotographHotspot(hotspot);
      }
      if (step.evidenceId) {
        handleCollectEvidence(step.evidenceId);
      }
    } else if (step.actionType === 'LAB_ANALYZE' && step.evidenceId) {
      handleCompleteAnalysis(step.evidenceId);
    } else if (
      step.actionType === 'INTERROGATE_ASK' &&
      step.suspectId &&
      step.dialogueId
    ) {
      const sus = caseOne.suspects.find((s) => s.id === step.suspectId);
      const opt = sus?.dialogueOptions.find((o) => o.id === step.dialogueId);
      if (sus && opt) {
        noirAudio.playSfx('click');
        handleAskQuestion(sus.id, opt, step.stance ?? 'balanced');
      }
    } else if (
      step.actionType === 'INTERROGATE_PRESENT' &&
      step.suspectId &&
      step.evidenceId
    ) {
      noirAudio.playSfx('contradiction');
      handlePresentEvidence(step.suspectId, step.evidenceId);
    } else if (step.actionType === 'BOARD_SOLVE') {
      caseOne.deductionRules.forEach((rule) => {
        handleAddBoardConnection(rule.nodeA, rule.nodeB, 'connection');
      });
      const orderedIds = [
        'tl_c1_argument',
        'tl_c1_elena_witness',
        'tl_c1_swipe',
        'tl_c1_tod',
        'tl_c1_locked_trick',
      ];
      pendingXpMetaRef.current = {
        reason: 'Chronological Timeline Verified',
        skill: 'deduction',
        focusBonus: 20,
        isSecretOrDeduction: true,
      };
      setSaveState((prev) => {
        const cs = prev.caseStates[caseOne.id];
        const skillUp = awardSkillXp(prev, 60, 'deduction', 20);
        return {
          ...prev,
          ...skillUp,
          caseStates: {
            ...prev.caseStates,
            [caseOne.id]: {
              ...cs,
              unlockedTimelineIds: Array.from(
                new Set([...cs.unlockedTimelineIds, ...orderedIds])
              ),
              orderedTimelineIds: orderedIds,
              timelineVerified: true,
            },
          },
        };
      });
      pushNotification(
        'Timeline Verified',
        'Chronological sequence confirmed for case dossier.',
        'emerald'
      );
    }
  };

  useEffect(() => {
    if (!demoActive) return;
    const step = COMPUTER_DEMO_STEPS[demoStepIndex];
    if (!step) return;

    if (lastExecutedDemoStepRef.current !== demoStepIndex) {
      lastExecutedDemoStepRef.current = demoStepIndex;
      runDemoStepRef.current(step);
    }

    if (demoPaused || step.durationMs <= 0) return;

    const timer = window.setTimeout(() => {
      setDemoStepIndex((idx) =>
        Math.min(COMPUTER_DEMO_STEPS.length - 1, idx + 1)
      );
    }, Math.round(step.durationMs / demoSpeed));

    return () => window.clearTimeout(timer);
  }, [demoActive, demoStepIndex, demoPaused, demoSpeed]);

  const handleProceedNext = () => {
    const idx = CASES.findIndex((c) => c.id === activeCase.id);
    if (idx < CASES.length - 1) {
      const nextCase = CASES[idx + 1];
      setSaveState((prev) => {
        const nextState = prev.caseStates[nextCase.id];
        return {
          ...prev,
          activeCaseId: nextCase.id,
          currentScreen: 'DETECTIVE_OFFICE',
          caseStates: {
            ...prev.caseStates,
            [nextCase.id]: {
              ...nextState,
              status: nextState.status === 'locked' ? 'active' : nextState.status,
            },
          },
        };
      });
    } else {
      setSaveState((prev) => {
        const ending = computeFinalEnding(prev);
        return {
          ...prev,
          finalEnding: ending,
          currentScreen: 'FINAL_ENDING',
        };
      });
    }
  };

  const handleRecomposeMusic = async () => {
    noirAudio.unlockAudio();
    noirAudio.playSfx('click');
    setComposingMusic(true);
    const res = await noirAudio.composeAiTrack({
      mood: resolveSceneMood(),
      caseTitle: activeCase.title,
      locationName: activeCase.locationName,
      tension: intuitionActive ? 88 : 60,
      forceRefresh: true,
    });
    if (res.score) setAiTrack(res.score);
    else if (res.error) setHintToast(`AI Composer: ${res.error}`);
    setComposingMusic(false);
  };

  // Compute current active objective dynamically for HUD
  const getActiveObjective = (): string => {
    const missingEvidence =
      activeProgress.discoveredEvidenceIds.length <
      Math.max(2, activeCase.keyContradictionEvidenceIds.length);
    if (missingEvidence) {
      return 'Search the Crime Scene for key physical and digital evidence';
    }
    const unanalyzedKey = activeCase.evidence.some(
      (e) =>
        activeProgress.discoveredEvidenceIds.includes(e.id) &&
        e.requiresAnalysis &&
        !activeProgress.analyzedEvidenceIds.includes(e.id)
    );
    if (unanalyzedKey) {
      return 'Analyze raw evidence in the Forensic Lab';
    }
    const foundContraCount = Object.values(
      activeProgress.foundContradictions
    ).reduce((acc, a) => acc + a.length, 0);
    if (foundContraCount === 0) {
      return 'Present verified evidence during Suspect Interrogation';
    }
    if (!activeProgress.timelineVerified) {
      return 'Verify the Chronological Timeline & Investigation Board';
    }
    return 'Open Case File or Accuse Suspect to close the case';
  };

  const showHint = () => {
    noirAudio.playSfx('click');
    setHintToast(activeCase.phoneCallTip.hintText);
  };

  const progressPct = calculateCaseProgressPercent(activeCase.id, activeProgress);

  const hasSavedProgress =
    saveState.started ||
    Object.values(saveState.caseStates).some(
      (cs) => cs.discoveredEvidenceIds.length > 0 || cs.status !== 'active'
    );

  return (
    <div
      className={`min-h-screen bg-[#0B0D12] text-[#E8ECF4] ${
        saveState.settings.textSize === 'Large' ? 'text-[17px]' : ''
      }`}
    >
      <AtmosphereOverlay
        enabled={
          saveState.settings.graphicsQuality === 'High' &&
          !saveState.settings.reducedMotion
        }
        intensity={saveState.currentScreen === 'MAIN_MENU' ? 'storm' : 'subtle'}
      />

      {/* Psychological Thriller Vignette Overlay when Detective's Intuition is active */}
      {intuitionActive && isInCasePlay && (
        <div
          className="pointer-events-none fixed inset-0 z-10 transition-opacity duration-300"
          style={{
            boxShadow: 'inset 0 0 130px rgba(158, 42, 59, 0.48)',
          }}
          aria-hidden="true"
        />
      )}

      {/* TOP NAVIGATION BAR (3-Zone Contract during active gameplay) */}
      {isInCasePlay && (
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0B0D12]/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-8 px-4 py-3 sm:px-6">
            {/* Zone 1: Brand Title */}
            <button
              onClick={() => navigate('MAIN_MENU')}
              className="font-display text-xl font-bold tracking-wide text-white hover:text-[#C9A24D] transition-colors whitespace-nowrap shrink-0"
            >
              THE LAST ALIBI
            </button>

            {/* Zone 2: 5 Single-Line Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              {(
                [
                  ['DETECTIVE_OFFICE', t(lang, 'navOffice')],
                  ['CRIME_SCENE', t(lang, 'navScene')],
                  ['INTERROGATION', t(lang, 'navInterrogate')],
                  ['FORENSIC_LAB', t(lang, 'navLab')],
                  ['BOARD_AND_TIMELINE', t(lang, 'navBoard')],
                ] as [ScreenMode, string][]
              ).map(([scr, label]) => (
                <button
                  key={scr}
                  onClick={() => {
                    noirAudio.playSfx('click');
                    navigate(scr);
                  }}
                  className={`whitespace-nowrap shrink-0 pb-0.5 transition-colors ${
                    saveState.currentScreen === scr
                      ? 'border-b-2 border-[#C9A24D] text-white'
                      : 'hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Zone 3: Primary Action */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  noirAudio.playSfx('click');
                  setShowAccusation(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-[#9E2A3B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B53346] transition-colors whitespace-nowrap shrink-0"
              >
                <Gavel className="h-3.5 w-3.5" />
                <span>{t(lang, 'accuseSuspect')}</span>
              </button>
            </div>
          </div>

          {/* Mobile Nav Row */}
          <div className="flex md:hidden items-center gap-3 overflow-x-auto border-t border-white/5 px-4 py-2 text-xs">
            {(
              [
                ['DETECTIVE_OFFICE', t(lang, 'navOffice')],
                ['CRIME_SCENE', t(lang, 'navScene')],
                ['INTERROGATION', t(lang, 'navInterrogate')],
                ['FORENSIC_LAB', t(lang, 'navLab')],
                ['BOARD_AND_TIMELINE', t(lang, 'navBoard')],
              ] as [ScreenMode, string][]
            ).map(([scr, label]) => (
              <button
                key={scr}
                onClick={() => navigate(scr)}
                className={`whitespace-nowrap shrink-0 rounded px-2.5 py-1 ${
                  saveState.currentScreen === scr
                    ? 'bg-[#C9A24D] text-[#0B0D12] font-semibold'
                    : 'text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Compact Gameplay HUD Strip */}
          <div className="border-t border-white/5 bg-[#10141D]">
            <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-4 px-4 py-2 text-xs text-slate-400 sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-white">
                  Case 0{activeCase.number}: {activeCase.title}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular text-[#C9A24D]">
                  Progress {progressPct}%
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">
                  Evidence {activeProgress.discoveredEvidenceIds.length}/
                  {activeCase.evidence.length}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-300 truncate max-w-sm">
                  {t(lang, 'objectiveLabel')}: {getActiveObjective()}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {/* Optional Pressure Timer Readout */}
                {pressureEnabled && (
                  <button
                    onClick={() => navigate('SETTINGS')}
                    title="Pressure Timer active: solve before deadline for Detective Rank XP bonuses. Click to configure in Settings."
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-mono-tabular whitespace-nowrap transition-colors ${
                      isOvertime
                        ? 'border-[#9E2A3B]/60 bg-[#25151B] text-rose-200'
                        : remainingSeconds <= 60
                        ? 'border-amber-500/50 bg-[#231C11] text-amber-300'
                        : 'border-white/10 bg-[#151A25] text-slate-200 hover:border-[#C9A24D]'
                    }`}
                  >
                    <Clock className="h-3 w-3 text-[#C9A24D]" />
                    <span>
                      {isOvertime
                        ? `Overtime ${formatTimerClock(remainingSeconds)}`
                        : formatTimerClock(remainingSeconds)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        liveSpeedReward.xpBonus >= 0 ? 'text-emerald-400' : 'text-rose-300'
                      }
                    >
                      {liveSpeedReward.xpBonus >= 0
                        ? `+${liveSpeedReward.xpBonus} XP`
                        : `${liveSpeedReward.xpBonus} XP`}
                    </span>
                  </button>
                )}

                {/* Detective's Intuition Focus Meter & Activation */}
                <div className="flex items-center gap-2 rounded-md border border-white/10 bg-[#151A25] px-2.5 py-1">
                  <span className="font-mono-tabular text-[11px] text-slate-300">
                    Focus {saveState.focus}/100
                  </span>
                  <div className="h-1.5 w-14 rounded-full bg-[#0B0D12] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        intuitionActive ? 'bg-[#9E2A3B]' : 'bg-[#C9A24D]'
                      }`}
                      style={{ width: `${saveState.focus}%` }}
                    />
                  </div>
                  <button
                    onClick={activateIntuition}
                    disabled={!intuitionActive && saveState.focus < INTUITION_COST}
                    title={
                      saveState.settings.keyboardHints
                        ? 'Spend 35 Focus to reveal hidden clues, UV traces, and contradiction cues (Shortcut: I)'
                        : 'Spend 35 Focus to activate heightened perception'
                    }
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap transition-colors ${
                      intuitionActive
                        ? 'bg-[#9E2A3B] text-white'
                        : 'bg-[#C9A24D] text-[#0B0D12] hover:bg-[#D8B461] disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    <span>
                      {intuitionActive
                        ? `${t(lang, 'intuitionLabel')} · ${intuitionSeconds}s`
                        : `${t(lang, 'intuitionLabel')} (${INTUITION_COST})`}
                    </span>
                  </button>
                </div>

                {/* Quick Mute / Unmute Background Music */}
                <button
                  onClick={() => {
                    noirAudio.unlockAudio();
                    setSaveState((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        musicMuted: !prev.settings.musicMuted,
                      },
                    }));
                  }}
                  title={
                    saveState.settings.musicMuted
                      ? 'Unmute background music'
                      : 'Mute background music'
                  }
                  className={`inline-flex items-center gap-1 text-[11px] transition-colors whitespace-nowrap ${
                    saveState.settings.musicMuted
                      ? 'text-rose-300 hover:text-rose-200'
                      : 'text-slate-300 hover:text-[#C9A24D]'
                  }`}
                >
                  {saveState.settings.musicMuted ? (
                    <VolumeX className="h-3.5 w-3.5" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5 text-[#C9A24D]" />
                  )}
                  <span className="hidden sm:inline">
                    {saveState.settings.musicMuted ? 'Muted' : 'Audio'}
                  </span>
                </button>

                {/* AI Background Music Status & Re-Compose */}
                {saveState.settings.aiMusicEnabled && !saveState.settings.musicMuted && (
                  <button
                    onClick={handleRecomposeMusic}
                    disabled={composingMusic}
                    title="Compose a new adaptive AI noir score for this scene"
                    className="inline-flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-[#C9A24D] transition-colors whitespace-nowrap"
                  >
                    <Music className="h-3.5 w-3.5 text-[#C9A24D]" />
                    <span className="max-w-[130px] truncate">
                      {composingMusic
                        ? 'Composing Score...'
                        : aiTrack
                        ? `${aiTrack.title} · ${aiTrack.keySignature}`
                        : 'AI Score'}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    noirAudio.playSfx('click');
                    setShowJournal(true);
                  }}
                  title={
                    saveState.settings.keyboardHints
                      ? 'Open Detective Journal to log observations, quirks, and theories (Shortcut: J)'
                      : 'Open Detective Journal'
                  }
                  className="inline-flex items-center gap-1 text-[#C9A24D] hover:text-[#D8B461] transition-colors whitespace-nowrap"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>
                    {t(lang, 'journal')}
                    {(activeProgress.journalEntries?.length ?? 0) > 0
                      ? ` (${activeProgress.journalEntries.length})`
                      : ''}
                  </span>
                </button>
                <button
                  onClick={() => navigate('CASE_FILE')}
                  className="hover:text-white transition-colors whitespace-nowrap"
                >
                  {t(lang, 'caseFile')}
                </button>
                <button
                  onClick={showHint}
                  className="inline-flex items-center gap-1 text-[#C9A24D] hover:underline whitespace-nowrap"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>{t(lang, 'hint')}</span>
                </button>
                <button
                  onClick={() => {
                    saveGameToStorage(saveState);
                    setSavedNotice(true);
                    setTimeout(() => setSavedNotice(false), 1800);
                  }}
                  className="hover:text-white transition-colors whitespace-nowrap"
                >
                  {savedNotice ? t(lang, 'saved') : t(lang, 'save')}
                </button>
                <button
                  onClick={() => {
                    noirAudio.playSfx('click');
                    navigate('SETTINGS');
                  }}
                  title={
                    saveState.settings.keyboardHints
                      ? 'Open Settings & Console (Shortcut: ,)'
                      : 'Open Settings & Console'
                  }
                  className="inline-flex items-center gap-1 hover:text-white transition-colors whitespace-nowrap"
                >
                  <SettingsIcon className="h-3.5 w-3.5" />
                  <span>{t(lang, 'settings')}</span>
                </button>
                <button
                  onClick={() => navigate('MAIN_MENU')}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors whitespace-nowrap"
                >
                  <Menu className="h-3.5 w-3.5" />
                  <span>{t(lang, 'menu')}</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Optional Hint Banner */}
      {hintToast && isInCasePlay && (
        <div className="mx-auto mt-3 max-w-[1380px] px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[#C9A24D]/40 bg-[#171C28] px-4 py-2.5 text-xs text-slate-200">
            <span>
              <strong className="text-[#C9A24D]">Detective Instinct: </strong>
              {hintToast}
            </span>
            <button
              onClick={() => setHintToast(null)}
              className="text-slate-400 hover:text-white shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Computer Mode (Demo) Playback & Takeover Bar */}
      {demoActive && isInCasePlay && (
        <ComputerDemoBar
          currentStep={COMPUTER_DEMO_STEPS[demoStepIndex]}
          stepIndex={demoStepIndex}
          totalSteps={COMPUTER_DEMO_STEPS.length}
          paused={demoPaused}
          speed={demoSpeed}
          completed={demoStepIndex >= COMPUTER_DEMO_STEPS.length - 1}
          hasPreviousSave={Boolean(
            realSaveBackupRef.current &&
              (realSaveBackupRef.current.started ||
                Object.values(realSaveBackupRef.current.caseStates).some(
                  (cs) => cs.discoveredEvidenceIds.length > 0 || cs.status !== 'active'
                ))
          )}
          onTogglePause={() => {
            noirAudio.playSfx('click');
            setDemoPaused((p) => !p);
          }}
          onNextStep={() => {
            noirAudio.playSfx('click');
            setDemoStepIndex((idx) =>
              Math.min(COMPUTER_DEMO_STEPS.length - 1, idx + 1)
            );
          }}
          onToggleSpeed={() => {
            noirAudio.playSfx('click');
            setDemoSpeed((s) => (s === 1 ? 2 : 1));
          }}
          onReplayDemo={handleStartDemo}
          onPlayFresh={handleNewInvestigation}
          onTakeOver={handleTakeOverFromDemo}
          onExitDemo={handleExitDemo}
        />
      )}

      {/* MAIN SCREEN ROUTER */}
      <main className="relative z-20">
        {saveState.currentScreen === 'MAIN_MENU' && (
          <MainMenuScreen
            hasSavedProgress={hasSavedProgress}
            language={lang}
            onNewInvestigation={handleNewInvestigation}
            onContinueInvestigation={handleContinueInvestigation}
            onStartDemo={handleStartDemo}
            onNavigate={navigate}
          />
        )}

        {saveState.currentScreen === 'DETECTIVE_OFFICE' && (
          <DetectiveOfficeView
            saveState={saveState}
            activeCase={activeCase}
            activeProgress={activeProgress}
            onNavigate={navigate}
            onHearPhoneTip={() =>
              setSaveState((prev) => ({
                ...prev,
                caseStates: {
                  ...prev.caseStates,
                  [activeCase.id]: {
                    ...prev.caseStates[activeCase.id],
                    phoneCallHeard: true,
                  },
                },
              }))
            }
            onSelectCase={(caseId) =>
              setSaveState((prev) => ({
                ...prev,
                activeCaseId: caseId,
                currentScreen: 'DETECTIVE_OFFICE',
              }))
            }
            onActivateSupport={handleActivateSupport}
          />
        )}

        {saveState.currentScreen === 'CRIME_SCENE' && (
          <CrimeSceneView
            caseData={activeCase}
            caseState={activeProgress}
            hasKeenEye={saveState.unlockedAbilities.includes('keen_eye')}
            intuitionActive={intuitionActive}
            demoFocusHotspotId={demoActive ? demoFocusHotspotId : null}
            onInspectHotspot={handleInspectHotspot}
            onPhotographHotspot={handlePhotographHotspot}
            onCollectEvidence={handleCollectEvidence}
            onTravelToLab={() => navigate('FORENSIC_LAB')}
          />
        )}

        {saveState.currentScreen === 'INTERROGATION' && (
          <InterrogationView
            caseData={activeCase}
            caseState={activeProgress}
            decisionFlags={saveState.decisionFlags}
            hasColdRead={saveState.unlockedAbilities.includes('cold_read')}
            intuitionActive={intuitionActive}
            reputation={saveState.reputation}
            conductStyle={getConductStyle(saveState.conduct)}
            demoFocusSuspectId={demoActive ? demoFocusSuspectId : null}
            onAskQuestion={handleAskQuestion}
            onPresentEvidence={handlePresentEvidence}
            onToggleTranscriptFlag={handleToggleTranscriptFlag}
            onLogToJournal={(entry) => handleAddJournalEntry(entry, true)}
          />
        )}

        {saveState.currentScreen === 'FORENSIC_LAB' && (
          <ForensicLabView
            caseData={activeCase}
            caseState={activeProgress}
            difficulty={saveState.settings.difficulty}
            hasLabProdigy={saveState.unlockedAbilities.includes('lab_prodigy')}
            hasShadowAccess={saveState.unlockedAbilities.includes('shadow_access')}
            intuitionActive={intuitionActive}
            onCompleteAnalysis={handleCompleteAnalysis}
          />
        )}

        {saveState.currentScreen === 'BOARD_AND_TIMELINE' && (
          <BoardTimelineView
            caseData={activeCase}
            caseState={activeProgress}
            hasMasterDeductor={saveState.unlockedAbilities.includes('master_deductor')}
            intuitionActive={intuitionActive}
            onUpdateBoardPosition={handleUpdateBoardPosition}
            onAddBoardConnection={handleAddBoardConnection}
            onRemoveBoardConnection={handleRemoveBoardConnection}
            onReorderTimeline={handleReorderTimeline}
            onVerifyTimeline={handleVerifyTimeline}
          />
        )}

        {saveState.currentScreen === 'CASE_FILE' && (
          <CaseFileScreen
            caseData={activeCase}
            caseState={activeProgress}
            onUpdateNotes={handleUpdateNotes}
            onOpenAccusation={() => setShowAccusation(true)}
            onOpenJournal={() => {
              noirAudio.playSfx('click');
              setShowJournal(true);
            }}
          />
        )}

        {saveState.currentScreen === 'CASE_OUTCOME' && (
          <CaseOutcomeScreen
            caseData={activeCase}
            caseState={activeProgress}
            detectiveRank={saveState.detectiveRank}
            totalXp={saveState.xp}
            isFinalCase={activeCase.id === CASES[CASES.length - 1].id}
            onChooseDecision={handleChooseDecision}
            onProceedNext={handleProceedNext}
            onOpenLeaderboard={() => navigate('LEADERBOARD')}
          />
        )}

        {saveState.currentScreen === 'FINAL_ENDING' && (
          <FinalEndingScreen
            saveState={saveState}
            ending={saveState.finalEnding ?? computeFinalEnding(saveState)}
            onReturnMenu={() => navigate('MAIN_MENU')}
            onOpenArchives={() => navigate('ARCHIVES')}
            onOpenLeaderboard={() => navigate('LEADERBOARD')}
          />
        )}

        {saveState.currentScreen === 'ARCHIVES' && (
          <CaseArchivesScreen
            saveState={saveState}
            onOpenCase={(caseId) =>
              setSaveState((prev) => ({
                ...prev,
                started: true,
                activeCaseId: caseId,
                currentScreen: 'DETECTIVE_OFFICE',
              }))
            }
            onBack={() =>
              navigate(saveState.started ? 'DETECTIVE_OFFICE' : 'MAIN_MENU')
            }
          />
        )}

        {saveState.currentScreen === 'PROFILE' && (
          <DetectiveProfileScreen
            saveState={saveState}
            onOpenLeaderboard={() => navigate('LEADERBOARD')}
            onBack={() =>
              navigate(saveState.started ? 'DETECTIVE_OFFICE' : 'MAIN_MENU')
            }
          />
        )}

        {saveState.currentScreen === 'LEADERBOARD' && (
          <LeaderboardScreen
            saveState={saveState}
            onSelectCase={(caseId) =>
              setSaveState((prev) => ({
                ...prev,
                started: true,
                activeCaseId: caseId,
                currentScreen: 'DETECTIVE_OFFICE',
              }))
            }
            onBack={() =>
              navigate(saveState.started ? 'DETECTIVE_OFFICE' : 'MAIN_MENU')
            }
          />
        )}

        {saveState.currentScreen === 'SETTINGS' && (
          <SettingsScreen
            saveState={saveState}
            settings={saveState.settings}
            onUpdateSettings={(next: GameSettings) =>
              setSaveState((prev) => ({ ...prev, settings: next }))
            }
            onResetSave={() => {
              const fresh = createNewGameState(saveState.settings);
              saveGameToStorage(fresh);
              prevProgressRef.current = {
                xp: fresh.xp,
                skills: { ...fresh.skills },
                abilities: [...fresh.unlockedAbilities],
                rank: fresh.detectiveRank,
              };
              setXpPopups([]);
              setShowJournal(false);
              setIntuitionSeconds(0);
              setSaveState(fresh);
            }}
            onBack={() =>
              navigate(saveState.started ? 'DETECTIVE_OFFICE' : 'MAIN_MENU')
            }
          />
        )}

        {saveState.currentScreen === 'CREDITS' && (
          <CreditsScreen
            onBack={() =>
              navigate(saveState.started ? 'DETECTIVE_OFFICE' : 'MAIN_MENU')
            }
          />
        )}
      </main>

      {/* In-App Investigation Notification Toasts */}
      {saveState.settings.notificationsEnabled && notifications.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none"
        >
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 shadow-xl backdrop-blur-md ${
                n.tone === 'crimson'
                  ? 'border-[#9E2A3B]/60 bg-[#1B1217]/95 text-rose-100'
                  : n.tone === 'emerald'
                  ? 'border-emerald-500/45 bg-[#101C18]/95 text-emerald-100'
                  : 'border-[#C9A24D]/50 bg-[#141923]/95 text-slate-100'
              }`}
            >
              <Bell className="h-4 w-4 text-[#C9A24D] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">{n.title}</p>
                <p className="text-[11px] text-slate-300 leading-snug">{n.message}</p>
              </div>
              <button
                onClick={() =>
                  setNotifications((prev) => prev.filter((item) => item.id !== n.id))
                }
                aria-label="Dismiss notification"
                className="text-slate-400 hover:text-white shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detective Journal Slide-Over Drawer */}
      {showJournal && isInCasePlay && (
        <DetectiveJournalDrawer
          caseData={activeCase}
          caseState={activeProgress}
          onClose={() => setShowJournal(false)}
          onAddEntry={handleAddJournalEntry}
          onUpdateEntry={handleUpdateJournalEntry}
          onDeleteEntry={handleDeleteJournalEntry}
          onUpdateNotes={handleUpdateNotes}
        />
      )}

      {/* Visual Experience Gain & Skill Progression Popups */}
      <XpGainPopups
        popups={xpPopups}
        reducedMotion={saveState.settings.reducedMotion}
      />

      {/* Accusation Modal */}
      {showAccusation && (
        <AccusationModal
          caseData={activeCase}
          caseState={activeProgress}
          onClose={() => setShowAccusation(false)}
          onSubmitAccusation={handleSubmitAccusation}
        />
      )}
    </div>
  );
}
