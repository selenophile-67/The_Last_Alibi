import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Award,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Target,
  Trash2,
  Trophy,
} from 'lucide-react';
import { noirAudio } from '../audio/noirAudio';
import { CASES } from '../data/cases';
import { GameSaveState, LeaderboardEntry } from '../types/game';
import { formatTimerClock } from '../utils/gameState';
import {
  clearLeaderboardFromStorage,
  syncMissingSolvedCasesToLeaderboard,
} from '../utils/leaderboard';

interface LeaderboardScreenProps {
  saveState: GameSaveState;
  onBack: () => void;
  onSelectCase?: (caseId: string) => void;
}

type SortKey = 'score' | 'speed' | 'accuracy' | 'reputation';

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  saveState,
  onBack,
  onSelectCase,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() =>
    syncMissingSolvedCasesToLeaderboard(saveState)
  );
  const [selectedCaseId, setSelectedCaseId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setEntries(syncMissingSolvedCasesToLeaderboard(saveState));
  }, [saveState]);

  const caseBestMap = useMemo(() => {
    const map: Record<string, LeaderboardEntry> = {};
    entries.forEach((entry) => {
      const prev = map[entry.caseId];
      if (!prev || entry.score > prev.score) {
        map[entry.caseId] = entry;
      }
    });
    return map;
  }, [entries]);

  const filteredAndSorted = useMemo(() => {
    const filtered =
      selectedCaseId === 'all'
        ? entries
        : entries.filter((e) => e.caseId === selectedCaseId);

    return [...filtered].sort((a, b) => {
      if (sortBy === 'speed') {
        if (a.speedSeconds !== b.speedSeconds) return a.speedSeconds - b.speedSeconds;
        return b.score - a.score;
      }
      if (sortBy === 'accuracy') {
        if (a.accuracyPercent !== b.accuracyPercent) {
          return b.accuracyPercent - a.accuracyPercent;
        }
        return b.score - a.score;
      }
      if (sortBy === 'reputation') {
        if (a.reputationAtClose !== b.reputationAtClose) {
          return b.reputationAtClose - a.reputationAtClose;
        }
        return b.score - a.score;
      }
      return b.score - a.score;
    });
  }, [entries, selectedCaseId, sortBy]);

  const summaryStats = useMemo(() => {
    const scope =
      selectedCaseId === 'all'
        ? entries
        : entries.filter((e) => e.caseId === selectedCaseId);

    if (scope.length === 0) {
      return {
        topScore: 0,
        uniqueCases: 0,
        avgAccuracy: 0,
        fastestSeconds: null as number | null,
      };
    }

    const topScore = Math.max(...scope.map((e) => e.score));
    const uniqueCases = new Set(scope.map((e) => e.caseId)).size;
    const avgAccuracy = Math.round(
      scope.reduce((acc, e) => acc + e.accuracyPercent, 0) / scope.length
    );
    const truthRuns = scope.filter((e) => e.solvedTruth);
    const fastestSeconds =
      truthRuns.length > 0
        ? Math.min(...truthRuns.map((e) => e.speedSeconds))
        : Math.min(...scope.map((e) => e.speedSeconds));

    return { topScore, uniqueCases, avgAccuracy, fastestSeconds };
  }, [entries, selectedCaseId]);

  const handleClear = () => {
    noirAudio.playSfx('click');
    const updated = clearLeaderboardFromStorage(
      selectedCaseId === 'all' ? undefined : selectedCaseId
    );
    setEntries(updated);
    setConfirmClear(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-[#C9A24D] shrink-0" />
          <div>
            <p className="text-xs text-[#C9A24D]">
              Ravenwood Precinct Records · Stored Locally in Browser
            </p>
            <h2 className="font-display text-3xl font-semibold text-white">
              Detective Leaderboard
            </h2>
          </div>
        </div>
        <button
          onClick={() => {
            noirAudio.playSfx('click');
            onBack();
          }}
          className="rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-slate-200 hover:border-[#C9A24D] whitespace-nowrap shrink-0"
        >
          Back
        </button>
      </div>

      {/* 4-Column KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-[#121620] p-5">
          <p className="text-xs text-slate-400">Highest Case Score</p>
          <p className="mt-1 font-mono-tabular text-2xl font-semibold text-[#C9A24D]">
            {summaryStats.topScore.toLocaleString()} pts
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {selectedCaseId === 'all' ? 'Across all Ravenwood files' : 'Selected case record'}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#121620] p-5">
          <p className="text-xs text-slate-400">Cases Ranked</p>
          <p className="mt-1 font-mono-tabular text-2xl font-semibold text-white">
            {summaryStats.uniqueCases} / {CASES.length}
          </p>
          <p className="mt-1 font-mono-tabular text-[11px] text-slate-400">
            {filteredAndSorted.length} recorded run{filteredAndSorted.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#121620] p-5">
          <p className="text-xs text-slate-400">Avg Deduction Accuracy</p>
          <p className="mt-1 font-mono-tabular text-2xl font-semibold text-white">
            {summaryStats.avgAccuracy}%
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Culprit, proof, contradictions & timeline
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#121620] p-5">
          <p className="text-xs text-slate-400">Fastest Case Solve</p>
          <p className="mt-1 font-mono-tabular text-2xl font-semibold text-white">
            {summaryStats.fastestSeconds !== null
              ? formatTimerClock(summaryStats.fastestSeconds)
              : '--:--'}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Active investigation clock
          </p>
        </div>
      </div>

      {/* Case Filter & Sort Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#121620] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                noirAudio.playSfx('click');
                setSelectedCaseId('all');
                setConfirmClear(false);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                selectedCaseId === 'all'
                  ? 'bg-[#C9A24D] text-[#0B0D12]'
                  : 'bg-[#171C28] text-slate-300 hover:text-white'
              }`}
            >
              All Cases ({entries.length})
            </button>

            {CASES.map((c) => {
              const count = entries.filter((e) => e.caseId === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    noirAudio.playSfx('click');
                    setSelectedCaseId(c.id);
                    setConfirmClear(false);
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    selectedCaseId === c.id
                      ? 'bg-[#C9A24D] text-[#0B0D12] font-semibold'
                      : 'bg-[#171C28] text-slate-300 hover:text-white'
                  }`}
                >
                  Case 0{c.number} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 mr-1">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>Sort:</span>
            </span>
            {(
              [
                ['score', 'Total Score'],
                ['speed', 'Speed'],
                ['accuracy', 'Accuracy'],
                ['reputation', 'Reputation'],
              ] as [SortKey, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  noirAudio.playSfx('click');
                  setSortBy(key);
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  sortBy === key
                    ? 'bg-[#252D40] text-[#C9A24D] border border-[#C9A24D]/40'
                    : 'bg-[#171C28] text-slate-300 hover:text-white border border-transparent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Case Personal Best Highlights (All Cases View) */}
      {selectedCaseId === 'all' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {CASES.map((c) => {
            const best = caseBestMap[c.id];
            const cs = saveState.caseStates[c.id];
            const canOpen = Boolean(onSelectCase && cs && cs.status !== 'locked');
            return (
              <div
                key={c.id}
                className="rounded-xl border border-white/10 bg-[#121620] p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <p className="text-[11px] font-mono-tabular text-[#C9A24D]">
                    Case 0{c.number} · Best Record
                  </p>
                  <p className="text-sm font-semibold text-white truncate" title={c.title}>
                    {c.title}
                  </p>
                </div>

                {best ? (
                  <div className="space-y-1 text-xs">
                    <p className="font-mono-tabular text-xl font-bold text-[#C9A24D]">
                      {best.score.toLocaleString()} pts
                    </p>
                    <p className="font-mono-tabular text-[11px] text-slate-300">
                      {formatTimerClock(best.speedSeconds)} · {best.accuracyPercent}% Acc · Rep {best.reputationAtClose}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No closed verdict recorded yet.
                  </p>
                )}

                {canOpen && (
                  <button
                    onClick={() => {
                      noirAudio.playSfx('click');
                      onSelectCase?.(c.id);
                    }}
                    className="text-left text-[11px] font-medium text-slate-300 hover:text-[#C9A24D] transition-colors"
                  >
                    Open Case File →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ranked Leaderboard Table */}
      <div className="rounded-xl border border-white/10 bg-[#121620] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
          <div className="text-xs text-slate-400">
            <span className="font-semibold text-white">Case Verdict Rankings</span>
            <span aria-hidden="true"> · </span>
            <span>
              Composite Score = (Deduction Accuracy + Investigation Speed + Precinct Reputation) × Difficulty
            </span>
          </div>

          {filteredAndSorted.length > 0 && (
            <div className="flex items-center gap-2">
              {!confirmClear ? (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:border-[#9E2A3B] hover:text-rose-200 transition-colors whitespace-nowrap shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>
                    {selectedCaseId === 'all' ? 'Clear All Records' : 'Clear Case Records'}
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClear}
                    className="rounded-lg bg-[#9E2A3B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#B53346] whitespace-nowrap shrink-0"
                  >
                    Confirm Clear
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:text-white whitespace-nowrap shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {filteredAndSorted.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Award className="h-8 w-8 text-[#C9A24D] mx-auto opacity-80" />
            <h3 className="font-display text-xl font-semibold text-white">
              No Case Scores Recorded Yet
            </h3>
            <p className="mx-auto max-w-md text-xs leading-relaxed text-slate-400">
              Close an investigation by issuing an arrest warrant and filing your verdict. Every closed case automatically logs your speed, deduction accuracy, and reputation to localStorage.
            </p>
            <button
              onClick={onBack}
              className="mt-2 rounded-lg bg-[#C9A24D] px-4 py-2 text-xs font-semibold text-[#0B0D12] hover:bg-[#D8B461]"
            >
              Return to Investigation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#0E121A] text-[11px] font-semibold text-slate-400">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Case File</th>
                  <th className="py-3 px-4">Total Score</th>
                  <th className="py-3 px-4">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Speed
                    </span>
                  </th>
                  <th className="py-3 px-4">
                    <span className="inline-flex items-center gap-1">
                      <Target className="h-3 w-3" /> Accuracy
                    </span>
                  </th>
                  <th className="py-3 px-4">Reputation</th>
                  <th className="py-3 px-4">Rank & Difficulty</th>
                  <th className="py-3 px-4">Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredAndSorted.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-[#171C28]/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono-tabular font-semibold text-[#C9A24D]">
                      #{String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-white">
                        Case 0{entry.caseNumber} · {entry.caseTitle}
                      </p>
                      <p className="text-[11px] text-slate-400 inline-flex items-center gap-1 mt-0.5">
                        {entry.solvedTruth ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-300">True Culprit Proven</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="h-3 w-3 text-rose-400" />
                            <span className="text-rose-300">Disputed Verdict</span>
                          </>
                        )}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-sm font-bold text-[#C9A24D]">
                      {entry.score.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-slate-200">
                      <span>{formatTimerClock(entry.speedSeconds)}</span>
                      <span className="block text-[11px] text-slate-400">
                        {entry.speedRating}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-slate-200">
                      <span>{entry.accuracyPercent}%</span>
                      <span className="block text-[11px] text-slate-400">
                        Deduction Chain
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-slate-200">
                      <span>{entry.reputationAtClose} / 100</span>
                      <span className="block text-[11px] text-slate-400">
                        {entry.conductStyle}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span>{entry.detectiveRank}</span>
                      <span className="block text-[11px] text-slate-400">
                        {entry.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(entry.recordedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
