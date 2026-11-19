import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Bookmark,
  BookPlus,
  CheckCircle2,
  FileSearch,
  MessageSquare,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { noirAudio } from '../audio/noirAudio';
import {
  CaseData,
  CaseProgressState,
  ConductStyle,
  DialogueOption,
  InterrogationStance,
  JournalEntry,
  SuspectProfile,
  TranscriptEntry,
} from '../types/game';
import { getSuspectTranscriptHistory } from '../utils/gameState';
import { SuspectPortrait } from './SuspectPortrait';

interface InterrogationViewProps {
  caseData: CaseData;
  caseState: CaseProgressState;
  decisionFlags: string[];
  hasColdRead: boolean;
  intuitionActive: boolean;
  reputation: number;
  conductStyle: ConductStyle;
  demoFocusSuspectId?: string | null;
  onAskQuestion: (
    suspectId: string,
    option: DialogueOption,
    stance: InterrogationStance
  ) => void;
  onPresentEvidence: (
    suspectId: string,
    evidenceId: string
  ) => {
    matched: boolean;
    alreadyFound?: boolean;
    needsAnalysis?: boolean;
    rebuttal?: string;
    reaction: string;
  };
  onToggleTranscriptFlag: (entryId: string) => void;
  onLogToJournal: (
    entry: Omit<JournalEntry, 'id' | 'createdAt'>
  ) => void;
}

type StageMode = 'live' | 'archive';
type ArchiveScope = 'current' | 'all';
type ArchiveFilter = 'all' | 'qa' | 'contradictions' | 'evidence' | 'flagged';

function renderHighlightedText(text: string, query: string): React.ReactNode {
  const trimmed = query.trim();
  if (!trimmed) return text;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  if (parts.length <= 1) return text;
  const lowerQuery = trimmed.toLowerCase();
  return parts.map((part, idx) =>
    part.toLowerCase() === lowerQuery ? (
      <mark
        key={idx}
        className="rounded bg-[#C9A24D]/30 px-0.5 text-[#F6E3AF]"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    )
  );
}

function getKindLabel(entry: TranscriptEntry): string {
  switch (entry.kind) {
    case 'greeting':
      return 'Opening Statement';
    case 'question':
      return entry.stance === 'empathetic'
        ? 'Question · Empathetic'
        : entry.stance === 'aggressive'
        ? 'Question · Aggressive'
        : 'Question · By-the-Book';
    case 'answer':
      return entry.evidenceName
        ? `Response · Re: ${entry.evidenceName}`
        : 'Suspect Response';
    case 'contradiction':
      return `Contradiction Exposed${entry.evidenceName ? ` · ${entry.evidenceName}` : ''}`;
    case 'evidence_check':
      return `Evidence Check${entry.evidenceName ? ` · ${entry.evidenceName}` : ''}`;
    case 'system':
      return 'Lab Verification Required';
  }
}

export const InterrogationView: React.FC<InterrogationViewProps> = ({
  caseData,
  caseState,
  decisionFlags,
  hasColdRead,
  intuitionActive,
  reputation,
  conductStyle,
  demoFocusSuspectId,
  onAskQuestion,
  onPresentEvidence,
  onToggleTranscriptFlag,
  onLogToJournal,
}) => {
  const [selectedSuspectId, setSelectedSuspectId] = useState<string>(
    caseData.suspects[0]?.id ?? ''
  );
  const [stageMode, setStageMode] = useState<StageMode>('live');
  const [archiveScope, setArchiveScope] = useState<ArchiveScope>('current');
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [loggedEntryIds, setLoggedEntryIds] = useState<Record<string, boolean>>({});
  const [stance, setStance] = useState<InterrogationStance>('balanced');
  const [showEvidenceDrawer, setShowEvidenceDrawer] = useState(false);
  const [contradictionBanner, setContradictionBanner] = useState<string | null>(null);
  const liveScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!caseData.suspects.some((s) => s.id === selectedSuspectId)) {
      setSelectedSuspectId(caseData.suspects[0]?.id ?? '');
    }
  }, [caseData, selectedSuspectId]);

  useEffect(() => {
    if (!demoFocusSuspectId) return;
    if (caseData.suspects.some((s) => s.id === demoFocusSuspectId)) {
      setSelectedSuspectId(demoFocusSuspectId);
      setStageMode('live');
      setShowEvidenceDrawer(false);
    }
  }, [demoFocusSuspectId, caseData.suspects]);

  const suspect: SuspectProfile | undefined = caseData.suspects.find(
    (s) => s.id === selectedSuspectId
  );

  const currentTranscript = useMemo(() => {
    if (!suspect) return [];
    return getSuspectTranscriptHistory(caseData, caseState, suspect);
  }, [caseData, caseState, suspect]);

  const allCaseTranscripts = useMemo(() => {
    return caseData.suspects.flatMap((s) =>
      getSuspectTranscriptHistory(caseData, caseState, s)
    );
  }, [caseData, caseState]);

  const flaggedIds = caseState.flaggedTranscriptIds ?? [];

  useEffect(() => {
    if (stageMode === 'live' && liveScrollRef.current) {
      liveScrollRef.current.scrollTop = liveScrollRef.current.scrollHeight;
    }
  }, [currentTranscript.length, stageMode, selectedSuspectId]);

  const archiveEntries = useMemo(() => {
    const baseList =
      archiveScope === 'all' ? allCaseTranscripts : currentTranscript;

    return baseList.filter((entry) => {
      if (archiveFilter === 'qa') {
        if (entry.kind !== 'question' && entry.kind !== 'answer' && entry.kind !== 'greeting') {
          return false;
        }
      } else if (archiveFilter === 'contradictions') {
        const isContraReply =
          entry.kind === 'contradiction' ||
          (entry.kind === 'answer' && Boolean(entry.evidenceId));
        if (!isContraReply) return false;
      } else if (archiveFilter === 'evidence') {
        if (
          entry.kind !== 'evidence_check' &&
          entry.kind !== 'contradiction' &&
          entry.kind !== 'system'
        ) {
          return false;
        }
      } else if (archiveFilter === 'flagged') {
        if (!flaggedIds.includes(entry.id)) return false;
      }

      const q = archiveSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        entry.text.toLowerCase().includes(q) ||
        entry.speaker.toLowerCase().includes(q) ||
        entry.suspectName.toLowerCase().includes(q) ||
        (entry.evidenceName?.toLowerCase().includes(q) ?? false) ||
        (entry.questionLabel?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [
    archiveScope,
    allCaseTranscripts,
    currentTranscript,
    archiveFilter,
    flaggedIds,
    archiveSearch,
  ]);

  if (!suspect) return null;

  const emotion = caseState.suspectEmotions[suspect.id] ?? suspect.initialEmotion;
  const trust = caseState.suspectTrust[suspect.id] ?? 50;
  const pressure = caseState.suspectPressure[suspect.id] ?? 10;
  const askedIds = caseState.askedDialogueIds[suspect.id] ?? [];
  const foundContraIds = caseState.foundContradictions[suspect.id] ?? [];

  const availableQuestions = suspect.dialogueOptions.filter((opt) => {
    if (opt.once && askedIds.includes(opt.id)) return false;
    if (
      opt.requiredEvidenceId &&
      !caseState.discoveredEvidenceIds.includes(opt.requiredEvidenceId)
    ) {
      return false;
    }
    if (
      opt.requiredEvidenceId &&
      opt.requiresAnalyzed &&
      !caseState.analyzedEvidenceIds.includes(opt.requiredEvidenceId)
    ) {
      return false;
    }
    if (opt.requiresDecisionFlag && !decisionFlags.includes(opt.requiresDecisionFlag)) {
      return false;
    }
    return true;
  });

  const collectedEvidence = caseData.evidence.filter((e) =>
    caseState.discoveredEvidenceIds.includes(e.id)
  );

  const handleQuestion = (opt: DialogueOption) => {
    noirAudio.playSfx('click');
    onAskQuestion(suspect.id, opt, stance);
    setContradictionBanner(null);
  };

  const handlePresent = (evidenceId: string) => {
    const ev = caseData.evidence.find((e) => e.id === evidenceId);
    const res = onPresentEvidence(suspect.id, evidenceId);
    setShowEvidenceDrawer(false);

    if (res.matched) {
      noirAudio.playSfx('contradiction');
      setContradictionBanner(
        `Contradiction Detected · ${ev?.name ?? 'Evidence'} shattered ${suspect.name}’s claim`
      );
    } else {
      noirAudio.playSfx('click');
      setContradictionBanner(null);
    }
  };

  const handleSendLineToJournal = (entry: TranscriptEntry) => {
    noirAudio.playSfx('discover');
    onLogToJournal({
      category: entry.kind === 'contradiction' ? 'theory' : 'suspect_quirk',
      suspectId: entry.suspectId,
      title: `Transcript · ${entry.suspectName}`,
      content: `"${entry.text}" (${getKindLabel(entry)})`,
      pinned: entry.kind === 'contradiction',
    });
    setLoggedEntryIds((prev) => ({ ...prev, [entry.id]: true }));
  };

  const remainingContras = suspect.contradictions.filter(
    (c) => !foundContraIds.includes(c.evidenceId)
  );

  const activeScopeEntries =
    archiveScope === 'all' ? allCaseTranscripts : currentTranscript;
  const activeScopeFlagCount = activeScopeEntries.filter((e) =>
    flaggedIds.includes(e.id)
  ).length;

  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 py-5 sm:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Suspect Roster */}
        <div className="lg:col-span-3 space-y-2.5">
          <div className="border-b border-white/10 pb-2">
            <h2 className="font-display text-2xl font-semibold text-white">
              Interrogation Room
            </h2>
            <p className="text-xs text-slate-400">
              Question suspects, review transcripts & present evidence to break false alibis.
            </p>
          </div>

          {caseData.suspects.map((s) => {
            const active = s.id === suspect.id;
            const sEmotion = caseState.suspectEmotions[s.id] ?? s.initialEmotion;
            const sContra = caseState.foundContradictions[s.id]?.length ?? 0;
            const sTotalContra = s.contradictions.length;
            const sTranscriptCount = getSuspectTranscriptHistory(
              caseData,
              caseState,
              s
            ).length;

            return (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedSuspectId(s.id);
                  setContradictionBanner(null);
                  setShowEvidenceDrawer(false);
                  noirAudio.playSfx('click');
                }}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  active
                    ? 'border-[#C9A24D] bg-[#181E2C]'
                    : 'border-white/10 bg-[#121620] hover:bg-[#171C28]'
                }`}
              >
                <SuspectPortrait
                  name={s.name}
                  portrait={s.portrait}
                  emotion={sEmotion}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-white truncate">{s.name}</p>
                  <p className="text-xs text-slate-400 truncate">{s.occupation}</p>
                  <p className="mt-0.5 text-[11px] font-mono-tabular text-[#C9A24D]">
                    {sEmotion.charAt(0).toUpperCase() + sEmotion.slice(1)}
                    {sTotalContra > 0 ? ` · ${sContra}/${sTotalContra} Lies Exposed` : ''}
                    {` · ${sTranscriptCount} logs`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Center/Right Active Interrogation Stage */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          {/* Suspect Header Card */}
          <div className="rounded-xl border border-white/10 bg-[#121620] p-5">
            <div className="flex flex-col md:flex-row gap-5 items-start">
              <SuspectPortrait
                name={suspect.name}
                portrait={suspect.portrait}
                emotion={emotion}
                size="lg"
              />
              <div className="flex-1 space-y-3 w-full">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#C9A24D]">
                      {suspect.occupation} · Age {suspect.age} · Demeanor:{' '}
                      <span className="font-semibold capitalize">{emotion}</span>
                    </p>
                    <h3 className="mt-1 font-display text-3xl font-semibold text-white">
                      {suspect.name}
                    </h3>
                  </div>

                  {/* Trust & Pressure Gauges (No hue-only signaling) */}
                  <div className="flex gap-4">
                    <div className="w-32">
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>Trust</span>
                        <span className="font-mono-tabular">{trust}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#1B2230] overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${trust}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-32">
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>Pressure</span>
                        <span className="font-mono-tabular">{pressure}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#1B2230] overflow-hidden">
                        <div
                          className="h-full bg-[#9E2A3B] transition-all duration-300"
                          style={{ width: `${pressure}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300 border-t border-white/10 pt-3">
                  <p>
                    <span className="text-slate-400">Claimed Alibi: </span>
                    {suspect.alibi}
                  </p>
                  <p>
                    <span className="text-slate-400">Relation to Victim: </span>
                    {suspect.relationshipToVictim}
                  </p>
                  <p className="md:col-span-2 text-slate-400">
                    <span>Background: </span>
                    {suspect.background}
                  </p>
                </div>

                {(hasColdRead || intuitionActive) && remainingContras.length > 0 && (
                  <div
                    className={`rounded-lg px-3 py-2 text-xs border ${
                      intuitionActive
                        ? 'bg-[#22141B] text-[#F2D58B] border-[#9E2A3B]/60'
                        : 'bg-[#1A2030] text-[#C9A24D] border-[#C9A24D]/30'
                    }`}
                  >
                    {intuitionActive ? 'Detective’s Intuition Tell: ' : 'Cold Read Instinct: '}
                    {suspect.name}’s claim (“{remainingContras[0].statementClaim}”) looks vulnerable
                    {intuitionActive
                      ? ' — check the highlighted item in Present Evidence to break their alibi.'
                      : ' to physical or digital contradiction.'}
                  </div>
                )}
                {intuitionActive && remainingContras.length === 0 && (
                  <div className="rounded-lg bg-[#1A202D] px-3 py-2 text-xs text-slate-300 border border-[#C9A24D]/35">
                    Detective’s Intuition Tell: {suspect.name}’s heartbeat stays steady—no remaining unexposed contradictions in their current testimony.
                  </div>
                )}
              </div>
            </div>
          </div>

          {contradictionBanner && (
            <div className="flex items-center gap-3 rounded-xl border border-[#9E2A3B] bg-[#9E2A3B]/20 px-4 py-3 text-sm font-medium text-rose-100">
              <ShieldAlert className="h-5 w-5 text-rose-300 shrink-0" />
              <span>{contradictionBanner}</span>
            </div>
          )}

          {/* Dialogue & Transcript Archive Card */}
          <div className="flex flex-col rounded-xl border border-white/10 bg-[#121620] p-5 space-y-4">
            {/* Stage Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="inline-flex items-center gap-1 rounded-lg bg-[#0D1017] p-1 border border-white/10">
                <button
                  onClick={() => {
                    noirAudio.playSfx('click');
                    setStageMode('live');
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    stageMode === 'live'
                      ? 'bg-[#C9A24D] text-[#0B0D12]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Live Interrogation</span>
                </button>
                <button
                  onClick={() => {
                    noirAudio.playSfx('click');
                    setStageMode('archive');
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    stageMode === 'archive'
                      ? 'bg-[#C9A24D] text-[#0B0D12]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span>Transcript Archive</span>
                  <span className="font-mono-tabular opacity-85">
                    ({currentTranscript.length})
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Recorded Statements</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular text-slate-200">
                  {allCaseTranscripts.length} Case Logs
                </span>
                {flaggedIds.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular text-[#C9A24D]">
                      {flaggedIds.length} Flagged
                    </span>
                  </>
                )}
              </div>
            </div>

            {stageMode === 'archive' ? (
              <div className="space-y-4">
                {/* Archive Controls: Scope, Category Filter & Search */}
                <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0D1017] p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1 rounded-lg bg-[#141923] p-1 border border-white/10">
                      <button
                        onClick={() => {
                          noirAudio.playSfx('click');
                          setArchiveScope('current');
                        }}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                          archiveScope === 'current'
                            ? 'bg-[#202738] text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {suspect.name} ({currentTranscript.length})
                      </button>
                      <button
                        onClick={() => {
                          noirAudio.playSfx('click');
                          setArchiveScope('all');
                        }}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                          archiveScope === 'all'
                            ? 'bg-[#202738] text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        All Suspects ({allCaseTranscripts.length})
                      </button>
                    </div>

                    <div className="relative flex-1 min-w-[210px] max-w-sm">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={archiveSearch}
                        onChange={(e) => setArchiveSearch(e.target.value)}
                        placeholder="Search testimony, times, objects..."
                        className="w-full rounded-lg border border-white/10 bg-[#141923] py-1.5 pl-8 pr-8 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#C9A24D] focus:outline-none"
                      />
                      {archiveSearch && (
                        <button
                          onClick={() => setArchiveSearch('')}
                          aria-label="Clear transcript search"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {(
                        [
                          ['all', 'All Exchanges'],
                          ['qa', 'Q & A'],
                          ['contradictions', 'Contradictions'],
                          ['evidence', 'Evidence Checks'],
                          ['flagged', `Flagged (${activeScopeFlagCount})`],
                        ] as [ArchiveFilter, string][]
                      ).map(([filterKey, label]) => (
                        <button
                          key={filterKey}
                          onClick={() => {
                            noirAudio.playSfx('click');
                            setArchiveFilter(filterKey);
                          }}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                            archiveFilter === filterKey
                              ? 'bg-[#C9A24D] text-[#0B0D12]'
                              : 'bg-[#141923] text-slate-300 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <span className="text-[11px] font-mono-tabular text-slate-400">
                      Showing {archiveEntries.length} of {activeScopeEntries.length}
                    </span>
                  </div>
                </div>

                {/* Alibi & Contradiction Cross-Reference Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#161B27] px-3.5 py-2.5 text-xs">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-slate-300">
                      <span className="font-semibold text-[#C9A24D]">
                        {suspect.name}’s Claimed Alibi:{' '}
                      </span>
                      {suspect.alibi}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono-tabular">
                      {foundContraIds.length}/{suspect.contradictions.length} Contradictions Exposed
                      {remainingContras.length > 0
                        ? ' · Compare specific times, items, and motives below against your Case File'
                        : ' · All recorded alibi contradictions exposed'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      noirAudio.playSfx('click');
                      setStageMode('live');
                      setShowEvidenceDrawer(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#C9A24D] px-3 py-1.5 text-xs font-semibold text-[#0B0D12] hover:bg-[#D8B461] transition-colors whitespace-nowrap shrink-0"
                  >
                    <FileSearch className="h-3.5 w-3.5" />
                    <span>Confront with Evidence</span>
                  </button>
                </div>

                {/* Scrollable Transcript History List */}
                <div className="max-h-[420px] overflow-y-auto space-y-2.5 pr-1.5">
                  {archiveEntries.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-[#0D1017] p-6 text-center text-xs text-slate-400">
                      No recorded transcript lines match the current filter. Question suspects or clear your search to inspect full testimony.
                    </div>
                  ) : (
                    archiveEntries.map((entry, idx) => {
                      const isFlagged = flaggedIds.includes(entry.id);
                      const isLogged = Boolean(loggedEntryIds[entry.id]);

                      return (
                        <div
                          key={entry.id}
                          className={`rounded-lg border p-3.5 transition-colors ${
                            entry.tone === 'contradiction'
                              ? 'border-[#9E2A3B]/60 bg-[#23141A]'
                              : isFlagged
                              ? 'border-[#C9A24D]/60 bg-[#1B1914]'
                              : entry.tone === 'detective'
                              ? 'border-white/10 bg-[#171E2C]'
                              : entry.tone === 'system'
                              ? 'border-[#C9A24D]/30 bg-[#161A25]'
                              : 'border-white/10 bg-[#0D1017]'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                              <span className="font-mono-tabular text-slate-500">
                                #{String(idx + 1).padStart(2, '0')}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-[#C9A24D]">
                                {renderHighlightedText(entry.speaker, archiveSearch)}
                              </span>
                              {archiveScope === 'all' && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-slate-300">
                                    File: {entry.suspectName}
                                  </span>
                                </>
                              )}
                              <span aria-hidden="true">·</span>
                              <span>{getKindLabel(entry)}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono-tabular">{entry.timestamp}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {archiveScope === 'all' && entry.suspectId !== suspect.id && (
                                <button
                                  onClick={() => {
                                    noirAudio.playSfx('click');
                                    setSelectedSuspectId(entry.suspectId);
                                    setArchiveScope('current');
                                  }}
                                  className="rounded border border-white/10 px-2 py-1 text-[11px] text-slate-300 hover:border-[#C9A24D] hover:text-white transition-colors whitespace-nowrap"
                                >
                                  Inspect Suspect
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  noirAudio.playSfx('click');
                                  onToggleTranscriptFlag(entry.id);
                                }}
                                title={
                                  isFlagged
                                    ? 'Remove suspect statement flag'
                                    : 'Flag statement for contradiction review'
                                }
                                className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] transition-colors whitespace-nowrap ${
                                  isFlagged
                                    ? 'border-[#C9A24D] bg-[#C9A24D]/15 text-[#F2D58B]'
                                    : 'border-white/10 text-slate-300 hover:border-[#C9A24D] hover:text-white'
                                }`}
                              >
                                <Bookmark className="h-3 w-3" />
                                <span>{isFlagged ? 'Flagged' : 'Flag'}</span>
                              </button>

                              {(entry.tone === 'suspect' || entry.tone === 'contradiction') && (
                                <button
                                  onClick={() => handleSendLineToJournal(entry)}
                                  disabled={isLogged}
                                  title="Save this testimony quote directly to your Detective Journal"
                                  className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] transition-colors whitespace-nowrap ${
                                    isLogged
                                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                      : 'border-white/10 text-slate-300 hover:border-[#C9A24D] hover:text-white'
                                  }`}
                                >
                                  <BookPlus className="h-3 w-3" />
                                  <span>{isLogged ? 'Logged' : 'Journal'}</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-sm leading-relaxed text-slate-100">
                            {renderHighlightedText(entry.text, archiveSearch)}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <>
                <div
                  ref={liveScrollRef}
                  className="max-h-72 overflow-y-auto space-y-3 pr-2"
                >
                  {currentTranscript.map((line) => (
                    <div
                      key={line.id}
                      className={`rounded-lg p-3.5 text-sm leading-relaxed ${
                        line.tone === 'contradiction'
                          ? 'bg-[#9E2A3B]/20 border border-[#9E2A3B]/50 text-rose-100'
                          : line.tone === 'detective'
                          ? 'bg-[#1A2130] text-slate-200'
                          : line.tone === 'system'
                          ? 'bg-[#171C28] text-[#C9A24D]'
                          : 'bg-[#0D1017] text-slate-100 border border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-semibold text-[#C9A24D]">
                          {line.speaker}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono-tabular text-slate-500">
                            {line.timestamp}
                          </span>
                          <button
                            onClick={() => {
                              noirAudio.playSfx('click');
                              onToggleTranscriptFlag(line.id);
                            }}
                            title={
                              flaggedIds.includes(line.id)
                                ? 'Unflag statement'
                                : 'Flag statement in Transcript Archive'
                            }
                            className={`transition-colors ${
                              flaggedIds.includes(line.id)
                                ? 'text-[#C9A24D]'
                                : 'text-slate-500 hover:text-slate-200'
                            }`}
                          >
                            <Bookmark className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p>{line.text}</p>
                    </div>
                  ))}
                </div>

                {/* Action Controls: Stance, Questions & Present Evidence */}
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-slate-400">
                      <span>Inquiry Approach</span>
                      <span aria-hidden="true"> · </span>
                      <span className="text-slate-300">
                        Conduct: {conductStyle} · Rep {reputation}/100
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowEvidenceDrawer(!showEvidenceDrawer);
                        noirAudio.playSfx('click');
                      }}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                        showEvidenceDrawer
                          ? 'bg-[#9E2A3B] text-white'
                          : 'bg-[#C9A24D] text-[#0B0D12] hover:bg-[#D8B461]'
                      }`}
                    >
                      <FileSearch className="h-4 w-4" />
                      <span>
                        {showEvidenceDrawer
                          ? 'Close Evidence Drawer'
                          : `Present Evidence (${collectedEvidence.length})`}
                      </span>
                    </button>
                  </div>

                  {!showEvidenceDrawer && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#0D1017] px-3 py-2">
                      <div className="flex gap-1">
                        {(
                          [
                            ['empathetic', 'Empathetic'],
                            ['balanced', 'By-the-Book'],
                            ['aggressive', 'Aggressive'],
                          ] as [InterrogationStance, string][]
                        ).map(([mode, label]) => (
                          <button
                            key={mode}
                            onClick={() => {
                              noirAudio.playSfx('click');
                              setStance(mode);
                            }}
                            className={`rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                              stance === mode
                                ? mode === 'aggressive'
                                  ? 'bg-[#9E2A3B] text-white'
                                  : 'bg-[#C9A24D] text-[#0B0D12]'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {stance === 'empathetic'
                          ? '+Trust · -Pressure · +1 Rep (Wins Lab & Witness favor)'
                          : stance === 'aggressive'
                          ? '+12 Pressure · -8 Trust · -2 Rep (Unlocks Hardball Warrants)'
                          : 'Balanced Inquiry · +1 Rep'}
                      </span>
                    </div>
                  )}

                  {showEvidenceDrawer ? (
                    <div className="rounded-xl border border-white/10 bg-[#0D1017] p-4 space-y-2">
                      <p className="text-xs text-slate-300 mb-2">
                        Select collected evidence to confront {suspect.name}’s alibi or testimony:
                      </p>
                      {collectedEvidence.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No evidence collected yet. Visit the Crime Scene first.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {collectedEvidence.map((ev) => {
                            const analyzed = caseState.analyzedEvidenceIds.includes(ev.id);
                            const alreadyUsed = foundContraIds.includes(ev.id);
                            const isPotentialContra =
                              intuitionActive &&
                              !alreadyUsed &&
                              suspect.contradictions.some((c) => c.evidenceId === ev.id);
                            return (
                              <button
                                key={ev.id}
                                onClick={() => handlePresent(ev.id)}
                                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition-colors ${
                                  isPotentialContra
                                    ? 'border-[#C9A24D] bg-[#241A1E] shadow-[0_0_16px_rgba(201,162,77,0.35)]'
                                    : 'border-white/10 bg-[#171C28] hover:border-[#C9A24D]'
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className="font-medium text-white truncate">{ev.name}</p>
                                  <p className="text-[11px] text-slate-400">
                                    {ev.category} · {analyzed ? 'Verified' : 'Unanalyzed'}
                                    {isPotentialContra ? ' · Contradiction Signal' : ''}
                                  </p>
                                </div>
                                {alreadyUsed ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                ) : !analyzed ? (
                                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {availableQuestions.length === 0 ? (
                        <p className="text-xs text-slate-400 sm:col-span-2">
                          All current lines of questioning explored. Collect or analyze new evidence to unlock deeper questions, or open the Transcript Archive to review past testimony for contradictions.
                        </p>
                      ) : (
                        availableQuestions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => handleQuestion(opt)}
                            className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-[#171C28] px-3.5 py-2.5 text-left text-xs font-medium text-slate-200 hover:border-[#C9A24D] hover:bg-[#1E2536] transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-[#C9A24D] shrink-0" />
                            <span>{opt.label}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
