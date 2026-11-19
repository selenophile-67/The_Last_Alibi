import { CASES } from '../data/cases';
import {
  CaseData,
  CaseProgressState,
  ConductMetrics,
  ConductStyle,
  DifficultyLevel,
  EndingType,
  GameSaveState,
  GameSettings,
  SuspectEmotion,
  SuspectProfile,
  TranscriptEntry,
} from '../types/game';

const STORAGE_KEY = 'the_last_alibi_save_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.45,
  sfxVolume: 0.65,
  musicMuted: false,
  sfxMuted: false,
  aiMusicEnabled: true,
  notificationsEnabled: true,
  browserNotifications: false,
  notificationSound: true,
  language: 'en',
  textSize: 'Standard',
  reducedMotion: false,
  autoSaveEnabled: true,
  pressureTimerEnabled: false,
  graphicsQuality: 'High',
  difficulty: 'Detective',
  subtitles: true,
  keyboardHints: true,
};

export const ABILITY_DEFINITIONS = [
  {
    id: 'keen_eye',
    skill: 'observation' as const,
    requiredLevel: 2,
    name: 'Keen Eye',
    description: 'Faint UV & Zoom hotspots shimmer slightly even before switching tools.',
  },
  {
    id: 'cold_read',
    skill: 'interrogation' as const,
    requiredLevel: 2,
    name: 'Cold Read',
    description: 'Reveals exact behavioral tells when a suspect’s alibi is vulnerable to evidence.',
  },
  {
    id: 'lab_prodigy',
    skill: 'forensics' as const,
    requiredLevel: 2,
    name: 'Forensic Instinct',
    description: 'Provides extra calibration guidance in lab puzzles and safe cracking.',
  },
  {
    id: 'master_deductor',
    skill: 'deduction' as const,
    requiredLevel: 2,
    name: 'Master Deductor',
    description: 'Highlights recommended logical pairs on the Investigation Board.',
  },
  {
    id: 'shadow_access',
    skill: 'digital' as const,
    requiredLevel: 2,
    name: 'Shadow Access',
    description: 'Auto-flags anomalous CCTV frames and cipher shift hints in digital evidence.',
  },
];

export function createInitialCaseState(caseIndex: number): CaseProgressState {
  const caseData = CASES[caseIndex];
  const suspectTrust: Record<string, number> = {};
  const suspectPressure: Record<string, number> = {};
  const suspectEmotions: Record<string, SuspectEmotion> = {};
  const askedDialogueIds: Record<string, string[]> = {};
  const foundContradictions: Record<string, string[]> = {};
  const boardPositions: Record<string, { x: number; y: number }> = {};

  boardPositions[`victim_${caseData.id}`] = { x: 420, y: 60 };

  caseData.suspects.forEach((s, idx) => {
    suspectTrust[s.id] = 50;
    suspectPressure[s.id] = 10;
    suspectEmotions[s.id] = s.initialEmotion;
    askedDialogueIds[s.id] = [];
    foundContradictions[s.id] = [];
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    boardPositions[s.id] = { x: 80 + col * 290, y: 185 + row * 185 };
  });

  caseData.evidence.forEach((ev, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    boardPositions[ev.id] = { x: 60 + col * 215, y: 390 + row * 125 };
  });

  const unlockedTimelineIds = caseData.timelineEvents
    .filter((t) => t.unlockedByDefault)
    .map((t) => t.id);

  return {
    caseId: caseData.id,
    status: caseIndex === 0 ? 'active' : 'locked',
    discoveredEvidenceIds: [],
    analyzedEvidenceIds: caseData.evidence
      .filter((e) => !e.requiresAnalysis)
      .map((e) => e.id),
    photographedHotspotIds: [],
    inspectedHotspotIds: [],
    askedDialogueIds,
    foundContradictions,
    suspectTrust,
    suspectPressure,
    suspectEmotions,
    unlockedTimelineIds,
    orderedTimelineIds: [...unlockedTimelineIds],
    timelineVerified: false,
    boardConnections: [],
    boardPositions,
    playerNotes: '',
    journalEntries: [],
    interrogationTranscripts: {},
    flaggedTranscriptIds: [],
    phoneCallHeard: false,
    elapsedSeconds: 0,
  };
}

export function createNewGameState(existingSettings?: GameSettings): GameSaveState {
  const caseStates: Record<string, CaseProgressState> = {};
  CASES.forEach((_, idx) => {
    const st = createInitialCaseState(idx);
    caseStates[st.caseId] = st;
  });

  return {
    version: 1,
    started: false,
    activeCaseId: CASES[0].id,
    currentScreen: 'MAIN_MENU',
    detectiveRank: 'Homicide Detective',
    xp: 0,
    reputation: 65,
    focus: 80,
    conduct: {
      empatheticChoices: 0,
      aggressiveChoices: 0,
      byTheBookChoices: 0,
    },
    usedSupportActions: {},
    skills: {
      observation: 1,
      interrogation: 1,
      forensics: 1,
      deduction: 1,
      digital: 1,
    },
    unlockedAbilities: [],
    decisionFlags: [],
    caseStates,
    settings: existingSettings
      ? { ...DEFAULT_SETTINGS, ...existingSettings }
      : { ...DEFAULT_SETTINGS },
    lastSavedAt: new Date().toISOString(),
  };
}

export function saveGameToStorage(state: GameSaveState): void {
  try {
    const updated: GameSaveState = {
      ...state,
      lastSavedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadGameFromStorage(): GameSaveState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameSaveState;
    if (!parsed || parsed.version !== 1 || !parsed.caseStates) return null;
    const hydratedCases: Record<string, CaseProgressState> = {};
    Object.entries(parsed.caseStates).forEach(([id, cs]) => {
      hydratedCases[id] = {
        ...cs,
        journalEntries: Array.isArray(cs.journalEntries) ? cs.journalEntries : [],
        interrogationTranscripts:
          cs.interrogationTranscripts && typeof cs.interrogationTranscripts === 'object'
            ? cs.interrogationTranscripts
            : {},
        flaggedTranscriptIds: Array.isArray(cs.flaggedTranscriptIds)
          ? cs.flaggedTranscriptIds
          : [],
      };
    });
    return {
      ...parsed,
      caseStates: hydratedCases,
      focus: typeof parsed.focus === 'number' ? parsed.focus : 80,
      conduct: parsed.conduct ?? {
        empatheticChoices: 0,
        aggressiveChoices: 0,
        byTheBookChoices: 0,
      },
      usedSupportActions: parsed.usedSupportActions ?? {},
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    };
  } catch {
    return null;
  }
}

export function getSuspectTranscriptHistory(
  caseData: CaseData,
  caseState: CaseProgressState,
  suspect: SuspectProfile
): TranscriptEntry[] {
  const stored = caseState.interrogationTranscripts?.[suspect.id];
  if (stored && stored.length > 0) {
    return stored;
  }

  const reconstructed: TranscriptEntry[] = [
    {
      id: `tr_greeting_${suspect.id}`,
      suspectId: suspect.id,
      suspectName: suspect.name,
      speaker: suspect.name,
      text: suspect.greeting,
      tone: 'suspect',
      kind: 'greeting',
      timestamp: 'Opening Statement',
    },
  ];

  const askedIds = caseState.askedDialogueIds[suspect.id] ?? [];
  askedIds.forEach((optId, idx) => {
    const opt = suspect.dialogueOptions.find((o) => o.id === optId);
    if (!opt) return;
    reconstructed.push({
      id: `tr_hist_q_${suspect.id}_${opt.id}`,
      suspectId: suspect.id,
      suspectName: suspect.name,
      speaker: 'Detective Alex Morgan',
      text: opt.label,
      tone: 'detective',
      kind: 'question',
      questionLabel: opt.label,
      timestamp: `Exchange ${idx + 1}`,
    });
    reconstructed.push({
      id: `tr_hist_a_${suspect.id}_${opt.id}`,
      suspectId: suspect.id,
      suspectName: suspect.name,
      speaker: suspect.name,
      text: opt.response,
      tone: 'suspect',
      kind: 'answer',
      questionLabel: opt.label,
      timestamp: `Exchange ${idx + 1}`,
    });
  });

  const foundContraIds = caseState.foundContradictions[suspect.id] ?? [];
  foundContraIds.forEach((evId, idx) => {
    const contra = suspect.contradictions.find((c) => c.evidenceId === evId);
    if (!contra) return;
    const ev = caseData.evidence.find((e) => e.id === evId);
    reconstructed.push({
      id: `tr_hist_c_det_${suspect.id}_${evId}`,
      suspectId: suspect.id,
      suspectName: suspect.name,
      speaker: `Detective Morgan [Presents: ${ev?.name ?? 'Evidence'}]`,
      text: contra.rebuttalDialogue,
      tone: 'contradiction',
      kind: 'contradiction',
      evidenceId: evId,
      evidenceName: ev?.name,
      timestamp: `Contradiction ${idx + 1}`,
    });
    reconstructed.push({
      id: `tr_hist_c_sus_${suspect.id}_${evId}`,
      suspectId: suspect.id,
      suspectName: suspect.name,
      speaker: suspect.name,
      text: contra.suspectReaction,
      tone: 'suspect',
      kind: 'answer',
      evidenceId: evId,
      evidenceName: ev?.name,
      timestamp: `Contradiction ${idx + 1}`,
    });
  });

  return reconstructed;
}

export function getRankForXp(xp: number): string {
  if (xp >= 1400) return 'Mastermind of Ravenwood';
  if (xp >= 1000) return 'Chief Investigator';
  if (xp >= 650) return 'Lead Inspector';
  if (xp >= 320) return 'Senior Detective';
  return 'Homicide Detective';
}

export function getRankTierIndex(xp: number): number {
  if (xp >= 1400) return 4;
  if (xp >= 1000) return 3;
  if (xp >= 650) return 2;
  if (xp >= 320) return 1;
  return 0;
}

export function getConductStyle(conduct: ConductMetrics): ConductStyle {
  const diff = conduct.empatheticChoices - conduct.aggressiveChoices;
  if (diff >= 2 && conduct.empatheticChoices >= conduct.byTheBookChoices * 0.6) {
    return 'Empathetic';
  }
  if (diff <= -2 && conduct.aggressiveChoices >= conduct.byTheBookChoices * 0.6) {
    return 'Aggressive';
  }
  return 'Balanced';
}

export function getReputationTier(reputation: number): {
  label: string;
  summary: string;
} {
  if (reputation >= 75) {
    return {
      label: 'Precinct Exemplar',
      summary: 'High departmental trust; full warrants and lab priority unlocked.',
    };
  }
  if (reputation >= 45) {
    return {
      label: 'Active Standing',
      summary: 'Standard precinct backing; street patrols and case support available.',
    };
  }
  return {
    label: 'Internal Review',
    summary: 'Brass scrutiny active; official warrants restricted unless strong-armed.',
  };
}

export function getPressureDeadlineSeconds(
  difficulty: DifficultyLevel,
  caseNumber: number
): number {
  const baseMinutes =
    difficulty === 'Mastermind' ? 4 : difficulty === 'Veteran' ? 5 : 6;
  return (baseMinutes + caseNumber) * 60;
}

export function formatTimerClock(totalSeconds: number): string {
  const abs = Math.max(0, Math.floor(Math.abs(totalSeconds)));
  const mins = Math.floor(abs / 60);
  const secs = abs % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return totalSeconds < 0 ? `-${formatted}` : formatted;
}

export function calculatePressureReward(
  elapsedSeconds: number,
  deadlineSeconds: number,
  solvedTruth: boolean,
  timerEnabled: boolean
): {
  tier?: 'Lightning' | 'Swift' | 'On Time' | 'Overtime';
  xpBonus: number;
  repDelta: number;
  label: string;
} {
  if (!timerEnabled) {
    return { xpBonus: 0, repDelta: 0, label: 'Standard Pace (Timer Off)' };
  }
  if (!solvedTruth) {
    return {
      tier: 'Overtime',
      xpBonus: -20,
      repDelta: -5,
      label: 'Rushed Unproven Verdict (-20 Rank XP)',
    };
  }
  const ratio = elapsedSeconds / Math.max(1, deadlineSeconds);
  if (ratio <= 0.45) {
    return {
      tier: 'Lightning',
      xpBonus: 120,
      repDelta: 8,
      label: 'Lightning Deduction (+120 Rank XP)',
    };
  }
  if (ratio <= 0.75) {
    return {
      tier: 'Swift',
      xpBonus: 70,
      repDelta: 4,
      label: 'Swift Resolution (+70 Rank XP)',
    };
  }
  if (ratio <= 1.0) {
    return {
      tier: 'On Time',
      xpBonus: 30,
      repDelta: 2,
      label: 'Beat the Clock (+30 Rank XP)',
    };
  }
  return {
    tier: 'Overtime',
    xpBonus: -35,
    repDelta: -5,
    label: 'Deadline Exceeded (-35 Rank XP)',
  };
}

export function recalculateUnlockedAbilities(skills: GameSaveState['skills']): string[] {
  return ABILITY_DEFINITIONS.filter((ab) => skills[ab.skill] >= ab.requiredLevel).map(
    (ab) => ab.id
  );
}

export function calculateCaseProgressPercent(
  caseId: string,
  progress: CaseProgressState
): number {
  const c = CASES.find((x) => x.id === caseId);
  if (!c) return 0;
  const totalEvidence = c.evidence.length;
  const foundCount = progress.discoveredEvidenceIds.length;

  const analyzable = c.evidence.filter((e) => e.requiresAnalysis);
  const analyzedCount = analyzable.filter((e) =>
    progress.analyzedEvidenceIds.includes(e.id)
  ).length;

  const totalContradictions = c.suspects.reduce((acc, s) => acc + s.contradictions.length, 0);
  const foundContraCount = Object.values(progress.foundContradictions).reduce(
    (acc, arr) => acc + arr.length,
    0
  );

  const boardDone = progress.boardConnections.length >= c.deductionRules.length ? 1 : 0;
  const timelineDone = progress.timelineVerified ? 1 : 0;

  const score =
    (foundCount / Math.max(1, totalEvidence)) * 35 +
    (analyzedCount / Math.max(1, analyzable.length)) * 25 +
    (foundContraCount / Math.max(1, totalContradictions)) * 20 +
    boardDone * 10 +
    timelineDone * 10;

  return Math.min(100, Math.round(score));
}

export function computeFinalEnding(save: GameSaveState): EndingType {
  const c5 = save.caseStates['case_5'];
  const solvedCasesTruth = Object.values(save.caseStates).filter(
    (cs) => cs.status === 'solved_truth'
  ).length;
  const wrongCases = Object.values(save.caseStates).filter(
    (cs) => cs.status === 'solved_wrong'
  ).length;

  // Count secret hidden evidence discovered across all 5 cases
  const allSecretIds = CASES.flatMap((c) =>
    c.evidence.filter((e) => e.importance === 'Secret').map((e) => e.id)
  );
  const foundSecretIds = allSecretIds.filter((eid) =>
    Object.values(save.caseStates).some((cs) => cs.discoveredEvidenceIds.includes(eid))
  );

  const hasFatherFile =
    c5?.discoveredEvidenceIds.includes('ev_c5_fatherfile') &&
    c5?.analyzedEvidenceIds.includes('ev_c5_fatherfile');
  const hasCovenant = c5?.discoveredEvidenceIds.includes('ev_c5_covenant');

  // Secret ending: Correctly unmasked Liam Voss + discovered almost all secret clues (4+) + 1999 file + Covenant binder
  if (
    c5?.status === 'solved_truth' &&
    hasFatherFile &&
    hasCovenant &&
    foundSecretIds.length >= 4 &&
    solvedCasesTruth >= 4
  ) {
    return 'THE_RED_EYE_COVENANT';
  }

  // Wrong Verdict: Accused innocent or wrong person in final case or >2 wrong verdicts
  if (c5?.status === 'solved_wrong' || wrongCases >= 3) {
    return 'THE_WRONG_VERDICT';
  }

  // Perfect Crime: Solved Case 5 without key contradiction proof or compromised/missed key ledger
  const vossContra = c5?.foundContradictions['sus_c5_voss']?.length ?? 0;
  if (c5?.status === 'solved_truth' && (vossContra < 2 || !c5.timelineVerified)) {
    return 'THE_PERFECT_CRIME';
  }

  // Truth Revealed: Exposed Voss & Ward cleanly
  if (c5?.status === 'solved_truth') {
    return 'THE_TRUTH_REVEALED';
  }

  return 'THE_PERFECT_CRIME';
}
