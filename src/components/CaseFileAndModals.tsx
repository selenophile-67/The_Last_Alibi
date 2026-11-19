import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gavel,
  ShieldAlert,
  Trophy,
  X,
} from 'lucide-react';
import { noirAudio } from '../audio/noirAudio';
import {
  CaseData,
  CaseProgressState,
  EndingType,
  GameSaveState,
} from '../types/game';
import { formatTimerClock } from '../utils/gameState';
import { SuspectPortrait } from './SuspectPortrait';

/* ============================================================================
 * CASE FILE SCREEN (Profile, Victim, Suspects, Evidence, Editable Notes)
 * ============================================================================ */

interface CaseFileScreenProps {
  caseData: CaseData;
  caseState: CaseProgressState;
  onUpdateNotes: (notes: string) => void;
  onOpenAccusation: () => void;
  onOpenJournal?: () => void;
}

export const CaseFileScreen: React.FC<CaseFileScreenProps> = ({
  caseData,
  caseState,
  onUpdateNotes,
  onOpenAccusation,
  onOpenJournal,
}) => {
  const collected = caseData.evidence.filter((e) =>
    caseState.discoveredEvidenceIds.includes(e.id)
  );

  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 py-5 sm:px-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs text-[#C9A24D]">
            Case 0{caseData.number} · {caseData.dateTime}
          </p>
          <h2 className="font-display text-3xl font-semibold text-white">
            {caseData.title} — Official Dossier
          </h2>
        </div>
        <button
          onClick={onOpenAccusation}
          className="inline-flex items-center gap-2 rounded-lg bg-[#9E2A3B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#B53346] whitespace-nowrap shrink-0"
        >
          <Gavel className="h-4 w-4" />
          <span>Formal Accusation</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Victim & Briefing */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-xl border border-white/10 bg-[#121620] p-5 space-y-3">
            <h3 className="font-display text-2xl font-semibold text-white">
              Victim Profile
            </h3>
            <div className="text-xs text-[#C9A24D]">
              {caseData.victim.name} · Age {caseData.victim.age} ·{' '}
              {caseData.victim.occupation}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {caseData.briefing}
            </p>
            <div className="border-t border-white/10 pt-3 text-xs space-y-1.5 text-slate-300">
              <p>
                <span className="text-slate-400">Cause of Death: </span>
                {caseData.victim.causeOfDeath}
              </p>
              <p>
                <span className="text-slate-400">Estimated Time: </span>
                {caseData.victim.estimatedTimeOfDeath}
              </p>
              <p>
                <span className="text-slate-400">Scene Notes: </span>
                {caseData.victim.notes}
              </p>
            </div>
          </div>

          {/* Investigation Notes */}
          <div className="rounded-xl border border-white/10 bg-[#121620] p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-2xl font-semibold text-white">
                Detective Notes
              </h3>
              {onOpenJournal && (
                <button
                  onClick={onOpenJournal}
                  className="text-xs font-medium text-[#C9A24D] hover:underline whitespace-nowrap shrink-0"
                >
                  Open Journal ({caseState.journalEntries?.length ?? 0})
                </button>
              )}
            </div>
            <textarea
              value={caseState.playerNotes}
              onChange={(e) => onUpdateNotes(e.target.value)}
              rows={7}
              placeholder="Record suspicions, timeline contradictions, safe combinations, and motives..."
              className="w-full rounded-lg border border-white/10 bg-[#0B0D12] p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-[#C9A24D] focus:outline-none"
            />
          </div>
        </div>

        {/* Suspects & Evidence Summary */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-xl border border-white/10 bg-[#121620] p-5 space-y-4">
            <h3 className="font-display text-2xl font-semibold text-white">
              Suspects ({caseData.suspects.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {caseData.suspects.map((s) => (
                <div
                  key={s.id}
                  className="flex gap-3 rounded-lg border border-white/10 bg-[#171C28] p-3.5"
                >
                  <SuspectPortrait
                    name={s.name}
                    portrait={s.portrait}
                    emotion={caseState.suspectEmotions[s.id] ?? s.initialEmotion}
                    size="sm"
                  />
                  <div className="min-w-0 space-y-1 text-xs">
                    <p className="font-semibold text-white">{s.name}</p>
                    <p className="text-[#C9A24D]">
                      {s.occupation} · Age {s.age}
                    </p>
                    <p className="text-slate-300 leading-relaxed">{s.alibi}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#121620] p-5 space-y-3">
            <h3 className="font-display text-2xl font-semibold text-white">
              Collected Evidence ({collected.length}/{caseData.evidence.length})
            </h3>
            {collected.length === 0 ? (
              <p className="text-xs text-slate-400">
                No evidence logged yet. Investigate the Crime Scene first.
              </p>
            ) : (
              <div className="space-y-2">
                {collected.map((ev) => {
                  const analyzed = caseState.analyzedEvidenceIds.includes(ev.id);
                  return (
                    <div
                      key={ev.id}
                      className="rounded-lg border border-white/10 bg-[#171C28] p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-slate-400">
                        <span>
                          {ev.category} · {ev.discoveryLocation}
                        </span>
                        <span className={analyzed ? 'text-emerald-400' : 'text-[#C9A24D]'}>
                          {analyzed ? 'Verified' : 'Unanalyzed'}
                        </span>
                      </div>
                      <p className="font-medium text-white text-sm">{ev.name}</p>
                      <p className="text-slate-300">
                        {analyzed ? ev.analysisResult : ev.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * ACCUSATION MODAL (Requires Evidence Selection, Blocks Blind Guessing)
 * ============================================================================ */

interface AccusationModalProps {
  caseData: CaseData;
  caseState: CaseProgressState;
  onClose: () => void;
  onSubmitAccusation: (suspectId: string, selectedEvidenceIds: string[]) => void;
}

export const AccusationModal: React.FC<AccusationModalProps> = ({
  caseData,
  caseState,
  onClose,
  onSubmitAccusation,
}) => {
  const [suspectId, setSuspectId] = useState<string>(caseData.suspects[0]?.id ?? '');
  const [selectedEv, setSelectedEv] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const verifiedEvidence = caseData.evidence.filter(
    (e) =>
      caseState.discoveredEvidenceIds.includes(e.id) &&
      caseState.analyzedEvidenceIds.includes(e.id)
  );

  const minRequired = Math.min(2, caseData.keyContradictionEvidenceIds.length);

  const toggleEv = (id: string) => {
    noirAudio.playSfx('click');
    setSelectedEv((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setError(null);
  };

  const handleConfirm = () => {
    if (selectedEv.length < minRequired) {
      setError(
        `You must present at least ${minRequired} pieces of verified evidence before issuing an arrest warrant.`
      );
      return;
    }
    noirAudio.playSfx('reveal');
    onSubmitAccusation(suspectId, selectedEv);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-white/15 bg-[#121620] p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <p className="text-xs text-[#9E2A3B] font-semibold">
              Final Case Submission · Case 0{caseData.number}
            </p>
            <h3 className="font-display text-3xl font-semibold text-white">
              Issue Arrest Warrant & Accuse Suspect
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Cancel accusation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {verifiedEvidence.length < minRequired ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-medium text-sm">
              <AlertTriangle className="h-5 w-5" />
              <span>Insufficient Forensic Proof</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ravenwood District Court will not sign an arrest warrant on guesswork. Collect and analyze at least {minRequired} key pieces of evidence in the Forensic Lab before accusing a suspect.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2.5">
              <p className="text-xs font-medium text-slate-300">
                1. Name the Perpetrator
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {caseData.suspects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSuspectId(s.id);
                      noirAudio.playSfx('click');
                    }}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      suspectId === s.id
                        ? 'border-[#9E2A3B] bg-[#25151B]'
                        : 'border-white/10 bg-[#171C28] hover:border-white/25'
                    }`}
                  >
                    <SuspectPortrait
                      name={s.name}
                      portrait={s.portrait}
                      emotion={caseState.suspectEmotions[s.id] ?? s.initialEmotion}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{s.name}</p>
                      <p className="text-xs text-slate-400 truncate">{s.occupation}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-medium text-slate-300">
                2. Attach Supporting Forensic & Documentary Proof ({selectedEv.length} selected)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {verifiedEvidence.map((ev) => {
                  const checked = selectedEv.includes(ev.id);
                  return (
                    <button
                      key={ev.id}
                      onClick={() => toggleEv(ev.id)}
                      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition-colors ${
                        checked
                          ? 'border-[#C9A24D] bg-[#1F2433] text-white'
                          : 'border-white/10 bg-[#171C28] text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <span className="truncate font-medium">{ev.name}</span>
                      {checked && <CheckCircle2 className="h-4 w-4 text-[#C9A24D] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:text-white"
          >
            Return to Investigation
          </button>
          {verifiedEvidence.length >= minRequired && (
            <button
              onClick={handleConfirm}
              className="rounded-lg bg-[#9E2A3B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#B53346]"
            >
              Confirm Accusation
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * CASE OUTCOME & DECISION SCREEN
 * ============================================================================ */

interface CaseOutcomeScreenProps {
  caseData: CaseData;
  caseState: CaseProgressState;
  detectiveRank: string;
  totalXp: number;
  isFinalCase: boolean;
  onChooseDecision: (optionId: string, flag: string, repDelta: number) => void;
  onProceedNext: () => void;
  onOpenLeaderboard?: () => void;
}

export const CaseOutcomeScreen: React.FC<CaseOutcomeScreenProps> = ({
  caseData,
  caseState,
  detectiveRank,
  totalXp,
  isFinalCase,
  onChooseDecision,
  onProceedNext,
  onOpenLeaderboard,
}) => {
  const solvedTruth = caseState.status === 'solved_truth';
  const accused = caseData.suspects.find((s) => s.id === caseState.accusedSuspectId);
  const chosenFlag = caseState.decisionFlagChosen;
  const chosenOpt = caseData.postCaseDecision.options.find(
    (o) => o.flag === chosenFlag
  );
  const speedXp = caseState.speedBonusXp ?? 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 space-y-6">
      <div
        className={`rounded-xl border p-7 space-y-4 ${
          solvedTruth
            ? 'border-[#C9A24D]/50 bg-[#141923]'
            : 'border-[#9E2A3B]/60 bg-[#1B1217]'
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-medium text-[#C9A24D]">
          {solvedTruth ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          )}
          <span>
            Case 0{caseData.number} Closed ·{' '}
            {solvedTruth ? 'True Culprit Exposed' : 'Miscarriage of Justice'}
          </span>
        </div>

        <h2 className="font-display text-4xl font-bold text-white">
          {solvedTruth ? caseData.newspaperSolvedHeadline : caseData.newspaperWrongHeadline}
        </h2>

        <p className="text-sm leading-relaxed text-slate-300">
          {solvedTruth
            ? `Your forensic chain held under scrutiny. ${accused?.name} broke under the weight of verified evidence. ${caseData.newspaperSolvedBody}`
            : `You charged ${accused?.name ?? 'the wrong suspect'} without airtight proof against the real perpetrator. ${caseData.newspaperWrongBody}`}
        </p>

        {/* Detective Rank & Optional Pressure Timer Speed Evaluation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/10 pt-4 text-xs">
          <div>
            <p className="text-slate-400">Detective Rank</p>
            <p className="mt-1 text-sm font-semibold text-white">{detectiveRank}</p>
          </div>
          <div>
            <p className="text-slate-400">Total Rank XP</p>
            <p className="mt-1 font-mono-tabular text-sm font-semibold text-[#C9A24D]">
              {totalXp} XP
            </p>
          </div>
          <div>
            <p className="text-slate-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#C9A24D]" />
              <span>Pressure Timer</span>
            </p>
            {caseState.speedTier ? (
              <p
                className={`mt-1 font-mono-tabular text-sm font-semibold ${
                  speedXp >= 0 ? 'text-emerald-400' : 'text-rose-300'
                }`}
              >
                {caseState.speedTier} · {formatTimerClock(caseState.elapsedSeconds ?? 0)} ({speedXp >= 0 ? `+${speedXp}` : speedXp} XP)
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-300">Standard Pace (Timer Off)</p>
            )}
          </div>
        </div>
      </div>

      {/* Post-Case Moral / Tactical Decision */}
      <div className="rounded-xl border border-white/10 bg-[#121620] p-7 space-y-4">
        <p className="text-xs font-medium text-[#C9A24D]">Critical Decision</p>
        <h3 className="font-display text-2xl font-semibold text-white">
          {caseData.postCaseDecision.prompt}
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {caseData.postCaseDecision.context}
        </p>

        {!chosenFlag ? (
          <div className="space-y-2.5 pt-2">
            {caseData.postCaseDecision.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  noirAudio.playSfx('click');
                  onChooseDecision(opt.id, opt.flag, opt.reputationDelta);
                }}
                className="w-full rounded-lg border border-white/15 bg-[#171C28] p-4 text-left hover:border-[#C9A24D] transition-colors"
              >
                <p className="text-sm font-semibold text-white">{opt.label}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="rounded-lg border border-[#C9A24D]/40 bg-[#171C28] p-4 space-y-1">
              <p className="text-sm font-semibold text-[#C9A24D]">{chosenOpt?.label}</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {chosenOpt?.consequenceSummary}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  noirAudio.playSfx('unlock');
                  onProceedNext();
                }}
                className="rounded-lg bg-[#C9A24D] px-6 py-2.5 text-sm font-semibold text-[#0B0D12] hover:bg-[#D8B461]"
              >
                {isFinalCase ? 'Reveal Final Ravenwood Ending' : 'Proceed to Next Case'}
              </button>
              {onOpenLeaderboard && (
                <button
                  onClick={() => {
                    noirAudio.playSfx('click');
                    onOpenLeaderboard();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-[#C9A24D] hover:text-white"
                >
                  <Trophy className="h-4 w-4 text-[#C9A24D]" />
                  <span>View Leaderboard</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * FINAL ENDING SCREEN (4 MULTIPLE ENDINGS)
 * ============================================================================ */

interface FinalEndingScreenProps {
  saveState: GameSaveState;
  ending: EndingType;
  onReturnMenu: () => void;
  onOpenArchives: () => void;
  onOpenLeaderboard?: () => void;
}

const ENDING_COPY: Record<
  EndingType,
  { kicker: string; title: string; body: string; epilogue: string }
> = {
  THE_RED_EYE_COVENANT: {
    kicker: 'Secret Ending IV · All Hidden Truths Uncovered',
    title: 'The Red Eye Covenant',
    body: 'Armed with the 1999 Cold-Case File (#TM-99), the Blackwood UV photograph, and the Sanctum Covenant Binder, you proved to Liam Voss that your father Lt. Thomas Morgan gave his life pulling young Liam from the 1999 arson fire—not betraying him.',
    epilogue:
      'Liam laid down his weapon and handed over every encrypted Phantom switchboard log. Judge Hawthorne and Captain Ward were indicted before sunrise, Clara Novak was rescued alive from Annex B, and Ravenwood finally saw morning without shadows.',
  },
  THE_TRUTH_REVEALED: {
    kicker: 'Ending I · Justice Served',
    title: 'The Truth Revealed',
    body: 'By linking the Sanctum audio tape, the Red-Eye Cipher Card, and Captain Ward’s Internal Affairs terminal, you unmasked your former partner Liam Voss as The Phantom and shattered the Red Eye Syndicate’s hold over Ravenwood.',
    epilogue:
      'Though scars remain across the precinct, the city’s corruption has been exposed in open court. Badge #407 returns to your chest with honor intact.',
  },
  THE_WRONG_VERDICT: {
    kicker: 'Ending II · Miscarriage of Justice',
    title: 'The Wrong Verdict',
    body: 'Under crushing midnight pressure, the wrong suspect was indicted while the real Phantom slipped past Ravenwood’s harbor patrol.',
    epilogue:
      'Days later, a solitary black playing card with a crimson eye appeared on your empty office desk—proof that the final alibi belonged to someone still walking free.',
  },
  THE_PERFECT_CRIME: {
    kicker: 'Ending III · Unfinished Proof',
    title: 'The Perfect Crime',
    body: 'You identified the shadow behind the mask, yet missing timeline links and unverified forensic recordings allowed the warehouse archive to burn before federal marshals arrived.',
    epilogue:
      'Voss vanished into the coastal fog, leaving Captain Ward’s lawyers to bury half the Syndicate’s ledger. Ravenwood remains quiet—for now.',
  },
};

export const FinalEndingScreen: React.FC<FinalEndingScreenProps> = ({
  saveState,
  ending,
  onReturnMenu,
  onOpenArchives,
  onOpenLeaderboard,
}) => {
  const data = ENDING_COPY[ending];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 space-y-6">
      <div className="rounded-xl border border-[#C9A24D]/50 bg-[#121620] p-8 space-y-5">
        <p className="text-xs font-semibold text-[#C9A24D]">{data.kicker}</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white text-balance">
          {data.title}
        </h1>
        <p className="text-base leading-relaxed text-slate-200">{data.body}</p>
        <p className="text-sm leading-relaxed text-slate-400 border-t border-white/10 pt-4">
          {data.epilogue}
        </p>

        <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-5 text-center">
          <div>
            <p className="text-xs text-slate-400">Final Rank</p>
            <p className="mt-1 font-medium text-white">{saveState.detectiveRank}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Total XP</p>
            <p className="mt-1 font-mono-tabular text-lg font-semibold text-[#C9A24D]">
              {saveState.xp}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Reputation</p>
            <p className="mt-1 font-mono-tabular text-lg font-semibold text-white">
              {saveState.reputation}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          {onOpenLeaderboard && (
            <button
              onClick={() => {
                noirAudio.playSfx('click');
                onOpenLeaderboard();
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#C9A24D] px-5 py-2.5 text-sm font-semibold text-[#0B0D12] hover:bg-[#D8B461]"
            >
              <Trophy className="h-4 w-4" />
              <span>Detective Leaderboard</span>
            </button>
          )}
          <button
            onClick={onOpenArchives}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold ${
              onOpenLeaderboard
                ? 'border border-white/15 text-slate-200 hover:border-[#C9A24D] hover:text-white'
                : 'bg-[#C9A24D] text-[#0B0D12] hover:bg-[#D8B461]'
            }`}
          >
            Revisit Case Archives
          </button>
          <button
            onClick={onReturnMenu}
            className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-slate-200 hover:text-white"
          >
            Return to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
