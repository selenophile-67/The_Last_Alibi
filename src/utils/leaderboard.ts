import { CASES } from '../data/cases';
import {
  CaseData,
  CaseProgressState,
  ConductStyle,
  DifficultyLevel,
  GameSaveState,
  LeaderboardEntry,
} from '../types/game';
import { getConductStyle, getPressureDeadlineSeconds } from './gameState';

export const LEADERBOARD_STORAGE_KEY = 'the_last_alibi_leaderboard_v1';

export function loadLeaderboardFromStorage(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is LeaderboardEntry =>
        Boolean(item && typeof item.id === 'string' && typeof item.score === 'number')
    );
  } catch {
    return [];
  }
}

export function saveLeaderboardToStorage(entries: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(entries.slice(0, 60)));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearLeaderboardFromStorage(caseId?: string): LeaderboardEntry[] {
  if (!caseId) {
    saveLeaderboardToStorage([]);
    return [];
  }
  const remaining = loadLeaderboardFromStorage().filter((e) => e.caseId !== caseId);
  saveLeaderboardToStorage(remaining);
  return remaining;
}

export interface RecordCaseLeaderboardInput {
  caseData: CaseData;
  caseState: CaseProgressState;
  detectiveRank: string;
  difficulty: DifficultyLevel;
  reputationAtClose: number;
  conductStyle: ConductStyle;
  solvedTruth: boolean;
  isRightCulprit: boolean;
  keyMatches: number;
  elapsedSeconds: number;
}

export function computeCaseLeaderboardEntry(
  input: RecordCaseLeaderboardInput
): LeaderboardEntry {
  const {
    caseData,
    caseState,
    detectiveRank,
    difficulty,
    reputationAtClose,
    conductStyle,
    solvedTruth,
    isRightCulprit,
    keyMatches,
    elapsedSeconds,
  } = input;

  // 1. Deduction Accuracy (0 - 100%)
  const totalContras = Math.max(
    1,
    caseData.suspects.reduce((sum, s) => sum + s.contradictions.length, 0)
  );
  const foundContraCount = Object.values(caseState.foundContradictions).reduce(
    (sum, list) => sum + list.length,
    0
  );
  const keyTotal = Math.max(1, caseData.keyContradictionEvidenceIds.length);

  const culpritPoints = isRightCulprit ? 40 : 0;
  const keyEvidencePoints = Math.min(30, Math.round((keyMatches / keyTotal) * 30));
  const contradictionPoints = Math.min(
    20,
    Math.round((foundContraCount / totalContras) * 20)
  );
  const timelinePoints = caseState.timelineVerified ? 10 : 0;
  const accuracyPercent = Math.min(
    100,
    culpritPoints + keyEvidencePoints + contradictionPoints + timelinePoints
  );

  // 2. Investigation Speed Score (up to 350 pts)
  const deadline = getPressureDeadlineSeconds(difficulty, caseData.number);
  const clampedSeconds = Math.max(15, Math.round(elapsedSeconds));
  const ratio = clampedSeconds / Math.max(1, deadline);

  let speedRating = 'On Time';
  let speedScore = 175;
  if (!solvedTruth) {
    speedRating = 'Disputed';
    speedScore = Math.max(40, Math.round(110 - Math.min(70, ratio * 50)));
  } else if (ratio <= 0.45) {
    speedRating = 'Lightning';
    speedScore = 350;
  } else if (ratio <= 0.75) {
    speedRating = 'Swift';
    speedScore = 285;
  } else if (ratio <= 1.0) {
    speedRating = 'On Time';
    speedScore = 220;
  } else {
    speedRating = 'Overtime';
    speedScore = Math.max(90, Math.round(180 - Math.min(90, (ratio - 1) * 90)));
  }

  // 3. Composite Score: Accuracy (up to 500) + Speed (up to 350) + Reputation (up to 250) * Difficulty Multiplier
  const accuracyScore = accuracyPercent * 5;
  const reputationScore = Math.round(Math.max(0, Math.min(100, reputationAtClose)) * 2.5);
  const diffMultiplier =
    difficulty === 'Mastermind' ? 1.25 : difficulty === 'Veteran' ? 1.12 : 1.0;

  const rawScore = (accuracyScore + speedScore + reputationScore) * diffMultiplier;
  const score = Math.round(solvedTruth ? rawScore : rawScore * 0.55);

  return {
    id: `lb_${caseData.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    caseId: caseData.id,
    caseNumber: caseData.number,
    caseTitle: caseData.title,
    detectiveRank,
    difficulty,
    solvedTruth,
    score,
    speedSeconds: clampedSeconds,
    speedRating,
    accuracyPercent,
    reputationAtClose: Math.max(0, Math.min(100, Math.round(reputationAtClose))),
    conductStyle,
    recordedAt: new Date().toISOString(),
  };
}

export function recordCaseLeaderboardEntry(
  input: RecordCaseLeaderboardInput
): LeaderboardEntry[] {
  const entry = computeCaseLeaderboardEntry(input);
  const existing = loadLeaderboardFromStorage();
  const updated = [entry, ...existing].sort((a, b) => b.score - a.score);
  saveLeaderboardToStorage(updated);
  return updated;
}

export function syncMissingSolvedCasesToLeaderboard(
  saveState: GameSaveState
): LeaderboardEntry[] {
  const existing = loadLeaderboardFromStorage();
  let changed = false;
  const next = [...existing];
  const conductStyle = getConductStyle(saveState.conduct);

  CASES.forEach((caseData) => {
    const cs = saveState.caseStates[caseData.id];
    if (!cs || (cs.status !== 'solved_truth' && cs.status !== 'solved_wrong')) {
      return;
    }
    const alreadyRecorded = next.some((e) => e.caseId === caseData.id);
    if (alreadyRecorded) return;

    const solvedTruth = cs.status === 'solved_truth';
    const isRightCulprit = cs.accusedSuspectId === caseData.correctCulpritId;
    const keyMatches = caseData.keyContradictionEvidenceIds.filter((k) =>
      cs.analyzedEvidenceIds.includes(k)
    ).length;

    const computed = computeCaseLeaderboardEntry({
      caseData,
      caseState: cs,
      detectiveRank: saveState.detectiveRank,
      difficulty: saveState.settings.difficulty,
      reputationAtClose: saveState.reputation,
      conductStyle,
      solvedTruth,
      isRightCulprit,
      keyMatches,
      elapsedSeconds: cs.elapsedSeconds ?? 180,
    });
    next.push(computed);
    changed = true;
  });

  if (changed) {
    next.sort((a, b) => b.score - a.score);
    saveLeaderboardToStorage(next);
  }
  return next;
}
