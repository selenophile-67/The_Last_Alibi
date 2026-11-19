import React, { useState } from 'react';
import {
  CheckCircle2,
  FileText,
  FlaskConical,
  GitBranch,
  Lock,
  MapPin,
  Newspaper,
  PhoneCall,
  Shield,
  Terminal,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { noirAudio } from '../audio/noirAudio';
import { ASSETS, CASES } from '../data/cases';
import {
  getPoliceNpcDialogue,
  getPrecinctSupportOptions,
  PrecinctSupportId,
} from '../data/precinctNpcs';
import { CaseData, CaseProgressState, GameSaveState, ScreenMode } from '../types/game';
import { getConductStyle, getReputationTier } from '../utils/gameState';

interface DetectiveOfficeViewProps {
  saveState: GameSaveState;
  activeCase: CaseData;
  activeProgress: CaseProgressState;
  onNavigate: (screen: ScreenMode) => void;
  onHearPhoneTip: () => void;
  onSelectCase: (caseId: string) => void;
  onActivateSupport: (supportId: PrecinctSupportId) => void;
}

export const DetectiveOfficeView: React.FC<DetectiveOfficeViewProps> = ({
  saveState,
  activeCase,
  activeProgress,
  onNavigate,
  onHearPhoneTip,
  onSelectCase,
  onActivateSupport,
}) => {
  const [modal, setModal] = useState<
    'phone' | 'terminal' | 'newspaper' | 'missions' | 'precinct' | null
  >(null);
  const [bgError, setBgError] = useState(false);

  const solvedNewspapers = CASES.filter((c) => {
    const st = saveState.caseStates[c.id]?.status;
    return st === 'solved_truth' || st === 'solved_wrong';
  });

  const conductStyle = getConductStyle(saveState.conduct);
  const repTier = getReputationTier(saveState.reputation);
  const npcBriefings = getPoliceNpcDialogue(saveState, activeCase.number);
  const supportOptions = getPrecinctSupportOptions(saveState);
  const usedSupports = saveState.usedSupportActions[activeCase.id] ?? [];

  const openStation = (
    station: 'phone' | 'terminal' | 'newspaper' | 'missions' | 'precinct'
  ) => {
    if (station === 'phone') {
      noirAudio.playSfx('phone');
      onHearPhoneTip();
    } else {
      noirAudio.playSfx('click');
    }
    setModal(station);
  };

  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 py-5 sm:px-6 space-y-6">
      {/* Interactive Office Scene Banner */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-8 relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#0F131C]">
          {!bgError ? (
            <img
              src={ASSETS.officeHub}
              alt="Detective Alex Morgan's Office in Ravenwood"
              referrerPolicy="no-referrer"
              onError={() => setBgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#161B26] to-[#0B0D12]" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0D12]/85 via-transparent to-[#0B0D12]/30" />

          {/* Interactive Hotspots inside Detective Office */}
          <button
            onClick={() => openStation('phone')}
            style={{ left: '19%', top: '65%', transform: 'translate(-50%, -50%)' }}
            className="absolute inline-flex items-center gap-1.5 rounded-lg border border-[#C9A24D]/70 bg-[#0B0D12]/85 px-3 py-1.5 text-xs font-medium text-white hover:bg-[#C9A24D] hover:text-[#0B0D12] transition-colors whitespace-nowrap"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span>Telephone{!activeProgress.phoneCallHeard ? ' (Ringing)' : ''}</span>
          </button>

          <button
            onClick={() => onNavigate('BOARD_AND_TIMELINE')}
            style={{ left: '74%', top: '34%', transform: 'translate(-50%, -50%)' }}
            className="absolute inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-[#0B0D12]/85 px-3 py-1.5 text-xs font-medium text-white hover:border-[#C9A24D] hover:text-[#C9A24D] transition-colors whitespace-nowrap"
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>Investigation Board</span>
          </button>

          <button
            onClick={() => onNavigate('CASE_FILE')}
            style={{ left: '26%', top: '79%', transform: 'translate(-50%, -50%)' }}
            className="absolute inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-[#0B0D12]/85 px-3 py-1.5 text-xs font-medium text-white hover:border-[#C9A24D] hover:text-[#C9A24D] transition-colors whitespace-nowrap"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Case Files</span>
          </button>

          <button
            onClick={() => openStation('terminal')}
            style={{ left: '49%', top: '63%', transform: 'translate(-50%, -50%)' }}
            className="absolute inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-[#0B0D12]/85 px-3 py-1.5 text-xs font-medium text-white hover:border-[#C9A24D] hover:text-[#C9A24D] transition-colors whitespace-nowrap"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Precinct Terminal</span>
          </button>

          <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs text-[#C9A24D]">
                Ravenwood Precinct Annex · Desk of Alex Morgan
              </p>
              <h1 className="font-display text-3xl font-semibold text-white">
                Case 0{activeCase.number}: {activeCase.title}
              </h1>
            </div>
            <button
              onClick={() => {
                noirAudio.playSfx('footstep');
                onNavigate('CRIME_SCENE');
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#C9A24D] px-4 py-2.5 text-sm font-semibold text-[#0B0D12] hover:bg-[#D8B461] whitespace-nowrap shrink-0"
            >
              <MapPin className="h-4 w-4" />
              <span>Travel to Crime Scene</span>
            </button>
          </div>
        </div>

        {/* Right Side Office Brief & Desk Stations */}
        <div className="lg:col-span-4 flex flex-col justify-between rounded-xl border border-white/10 bg-[#121620] p-5 space-y-5">
          <div className="space-y-4">
            <div className="border-b border-white/10 pb-3">
              <p className="text-xs text-slate-400">
                {activeCase.locationName} · {activeCase.dateTime}
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-white">
                Active Briefing
              </h2>
            </div>

            <p className="text-sm leading-relaxed text-slate-300">
              {activeCase.briefing}
            </p>

            <div className="rounded-lg bg-[#171C28] p-3.5 border border-white/10 text-xs space-y-1.5">
              <p className="font-medium text-[#C9A24D]">
                Victim: {activeCase.victim.name} ({activeCase.victim.age})
              </p>
              <p className="text-slate-300">{activeCase.victim.occupation}</p>
              <p className="text-slate-400">
                Est. Time of Death: {activeCase.victim.estimatedTimeOfDeath}
              </p>
            </div>
          </div>

          {/* Office Desk Actions */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={() => openStation('missions')}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#171C28] px-3 py-2.5 text-xs font-medium text-white hover:border-[#C9A24D] transition-colors"
            >
              <MapPin className="h-4 w-4 text-[#C9A24D] shrink-0" />
              <span className="truncate">Select Case</span>
            </button>
            <button
              onClick={() => onNavigate('FORENSIC_LAB')}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#171C28] px-3 py-2.5 text-xs font-medium text-white hover:border-[#C9A24D] transition-colors"
            >
              <FlaskConical className="h-4 w-4 text-[#C9A24D] shrink-0" />
              <span className="truncate">Lab & Evidence</span>
            </button>
            <button
              onClick={() => openStation('newspaper')}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#171C28] px-3 py-2.5 text-xs font-medium text-white hover:border-[#C9A24D] transition-colors"
            >
              <Newspaper className="h-4 w-4 text-[#C9A24D] shrink-0" />
              <span className="truncate">Chronicle Archive</span>
            </button>
            <button
              onClick={() => openStation('phone')}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#171C28] px-3 py-2.5 text-xs font-medium text-white hover:border-[#C9A24D] transition-colors"
            >
              <PhoneCall className="h-4 w-4 text-[#C9A24D] shrink-0" />
              <span className="truncate">Tip Line</span>
            </button>
            <button
              onClick={() => openStation('precinct')}
              className="flex items-center justify-between gap-2 rounded-lg border border-[#C9A24D]/40 bg-[#171C28] px-3 py-2.5 text-xs font-medium text-white hover:border-[#C9A24D] transition-colors"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <Users className="h-4 w-4 text-[#C9A24D] shrink-0" />
                <span className="truncate">Precinct Liaison</span>
              </span>
              <span className="font-mono-tabular text-[11px] text-[#C9A24D] shrink-0 hidden xl:inline">
                {conductStyle}
              </span>
            </button>
            <button
              onClick={() => {
                noirAudio.playSfx('click');
                onNavigate('LEADERBOARD');
              }}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#171C28] px-3 py-2.5 text-xs font-medium text-white hover:border-[#C9A24D] transition-colors"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <Trophy className="h-4 w-4 text-[#C9A24D] shrink-0" />
                <span className="truncate">Leaderboard</span>
              </span>
              <span className="font-mono-tabular text-[11px] text-slate-400 shrink-0 hidden xl:inline">
                {repTier.label.split(' ')[0]}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Office Station Modals */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-white/15 bg-[#121620] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-2xl font-semibold text-white">
                {modal === 'phone'
                  ? 'Desk Telephone · Incoming Tip'
                  : modal === 'terminal'
                  ? 'Ravenwood Precinct Terminal'
                  : modal === 'newspaper'
                  ? 'The Ravenwood Chronicle Archive'
                  : modal === 'precinct'
                  ? 'Precinct Liaison & Command Support'
                  : 'Case Assignments'}
              </h3>
              <button
                onClick={() => setModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modal === 'phone' && (
              <div className="space-y-4">
                <p className="text-xs font-mono-tabular text-[#C9A24D]">
                  CALLER: {activeCase.phoneCallTip.caller}
                </p>
                <blockquote className="rounded-lg bg-[#0B0D12] p-4 border border-white/10 text-sm italic leading-relaxed text-slate-200">
                  {activeCase.phoneCallTip.transcript}
                </blockquote>
                <div className="rounded-lg bg-[#171C28] p-3 text-xs text-slate-300">
                  <span className="font-medium text-[#C9A24D]">Investigation Lead: </span>
                  {activeCase.phoneCallTip.hintText}
                </div>
              </div>
            )}

            {modal === 'terminal' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-[#0B0D12] p-4 border border-white/10 font-mono-tabular text-xs text-slate-300 space-y-2">
                  <p className="text-[#C9A24D]">
                    OPERATOR: DETECTIVE ALEX MORGAN · BADGE #407
                  </p>
                  <p>
                    RANK: {saveState.detectiveRank} · XP: {saveState.xp} · REPUTATION:{' '}
                    {saveState.reputation}
                  </p>
                  <p>
                    COLLECTED EVIDENCE (CURRENT CASE):{' '}
                    {activeProgress.discoveredEvidenceIds.length}/
                    {activeCase.evidence.length}
                  </p>
                  <p>
                    SECRET FLAGS LOGGED:{' '}
                    {saveState.decisionFlags.length > 0
                      ? saveState.decisionFlags.join(' · ')
                      : 'None recorded yet'}
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  Use the Forensic Lab to analyze raw physical, digital, and documentary samples before confronting suspects.
                </p>
              </div>
            )}

            {modal === 'newspaper' && (
              <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
                {solvedNewspapers.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">
                    No closed case headlines printed yet. Solve Case 1 to see Ravenwood’s press reaction.
                  </p>
                ) : (
                  solvedNewspapers.map((c) => {
                    const st = saveState.caseStates[c.id];
                    const truth = st?.status === 'solved_truth';
                    return (
                      <article
                        key={c.id}
                        className="rounded-lg border border-white/10 bg-[#0D1017] p-4 space-y-1.5"
                      >
                        <p className="font-mono-tabular text-[11px] text-slate-400">
                          RAVENWOOD CHRONICLE · CASE 0{c.number} EDITION
                        </p>
                        <h4 className="font-display text-xl font-bold text-white">
                          {truth ? c.newspaperSolvedHeadline : c.newspaperWrongHeadline}
                        </h4>
                        <p className="text-xs leading-relaxed text-slate-300">
                          {truth ? c.newspaperSolvedBody : c.newspaperWrongBody}
                        </p>
                      </article>
                    );
                  })
                )}
              </div>
            )}

            {modal === 'missions' && (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {CASES.map((c) => {
                  const cs = saveState.caseStates[c.id];
                  const locked = cs?.status === 'locked';
                  const isActive = c.id === activeCase.id;
                  return (
                    <button
                      key={c.id}
                      disabled={locked}
                      onClick={() => {
                        onSelectCase(c.id);
                        setModal(null);
                        noirAudio.playSfx('click');
                      }}
                      className={`w-full flex items-center justify-between gap-4 rounded-lg border p-3.5 text-left transition-colors ${
                        locked
                          ? 'border-white/5 bg-[#0D1017] opacity-45 cursor-not-allowed'
                          : isActive
                          ? 'border-[#C9A24D] bg-[#181E2C]'
                          : 'border-white/10 bg-[#171C28] hover:border-[#C9A24D]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs text-[#C9A24D]">
                          Case 0{c.number} · {c.locationName}
                        </p>
                        <p className="font-medium text-white truncate">{c.title}</p>
                      </div>
                      <span className="font-mono-tabular text-xs text-slate-300 shrink-0">
                        {cs?.status === 'solved_truth'
                          ? 'Solved'
                          : cs?.status === 'solved_wrong'
                          ? 'Closed (Disputed)'
                          : cs?.status === 'active'
                          ? 'Active'
                          : 'Locked'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {modal === 'precinct' && (
              <div className="space-y-5">
                <div className="rounded-lg border border-white/10 bg-[#0D1017] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-white">
                      {saveState.detectiveRank} · {repTier.label}
                    </p>
                    <p className="text-slate-400 mt-0.5">{repTier.summary}</p>
                  </div>
                  <div className="text-right font-mono-tabular">
                    <p className="text-[#C9A24D]">Reputation {saveState.reputation}/100</p>
                    <p className="text-slate-400">
                      Conduct: {conductStyle} ({saveState.conduct.empatheticChoices}E /{' '}
                      {saveState.conduct.byTheBookChoices}B /{' '}
                      {saveState.conduct.aggressiveChoices}A)
                    </p>
                  </div>
                </div>

                {/* Police NPC Dynamic Dialogue Responses */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Departmental Officers on Duty
                  </h4>
                  <div className="space-y-2.5">
                    {npcBriefings.map((npc) => (
                      <div
                        key={npc.id}
                        className="rounded-lg border border-white/10 bg-[#171C28] p-3.5 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-semibold text-white text-sm">
                            {npc.name}
                          </span>
                          <span>
                            {npc.role} · {npc.badgeOrUnit}
                          </span>
                        </div>
                        <p className="text-slate-200 leading-relaxed italic">
                          {npc.stanceReaction}
                        </p>
                        <p className="text-[#C9A24D] leading-relaxed">
                          {npc.rankRemark}
                        </p>
                        <p className="text-[11px] text-slate-400 border-t border-white/5 pt-1.5">
                          {npc.caseAdvice}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Precinct Support Requisitions */}
                <div className="space-y-2.5 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Precinct Support Requisitions (Case 0{activeCase.number})
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Once per case
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {supportOptions.map((opt) => {
                      const alreadyUsed = usedSupports.includes(opt.id);
                      const disabled = alreadyUsed || !opt.unlocked;
                      return (
                        <div
                          key={opt.id}
                          className={`flex flex-col justify-between rounded-lg border p-3.5 text-xs space-y-2.5 ${
                            alreadyUsed
                              ? 'border-emerald-500/35 bg-[#111B18]'
                              : opt.unlocked
                              ? 'border-white/15 bg-[#171C28]'
                              : 'border-white/5 bg-[#0D1017] opacity-65'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-white">
                                {opt.title}
                              </span>
                              {alreadyUsed ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                              ) : !opt.unlocked ? (
                                <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              ) : (
                                <Shield className="h-3.5 w-3.5 text-[#C9A24D] shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-[#C9A24D]">
                              Via {opt.npcProvider}
                            </p>
                            <p className="text-slate-300 leading-relaxed">
                              {opt.effectSummary}
                            </p>
                          </div>

                          <div className="space-y-2 border-t border-white/5 pt-2">
                            <p className="text-[11px] text-slate-400">
                              {opt.requirementLabel}
                            </p>
                            <button
                              disabled={disabled}
                              onClick={() => {
                                noirAudio.playSfx('unlock');
                                onActivateSupport(opt.id);
                              }}
                              className="w-full rounded-lg bg-[#C9A24D] px-3 py-1.5 text-xs font-semibold text-[#0B0D12] hover:bg-[#D8B461] disabled:bg-white/10 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                            >
                              {alreadyUsed
                                ? 'Authorized This Case'
                                : opt.unlocked
                                ? opt.reputationCost > 0
                                  ? `Authorize (-${opt.reputationCost} Rep)`
                                  : 'Authorize Support'
                                : 'Clearance Locked'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
