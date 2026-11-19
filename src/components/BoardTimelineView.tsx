import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  GitBranch,
  Link2,
  Trash2,
} from 'lucide-react';
import { noirAudio } from '../audio/noirAudio';
import {
  BoardConnection,
  CaseData,
  CaseProgressState,
  LinkRelationType,
} from '../types/game';

interface BoardTimelineViewProps {
  caseData: CaseData;
  caseState: CaseProgressState;
  hasMasterDeductor: boolean;
  intuitionActive: boolean;
  onUpdateBoardPosition: (nodeId: string, x: number, y: number) => void;
  onAddBoardConnection: (fromId: string, toId: string, relation: LinkRelationType) => void;
  onRemoveBoardConnection: (connId: string) => void;
  onReorderTimeline: (newOrder: string[]) => void;
  onVerifyTimeline: () => boolean;
}

const RELATION_COLORS: Record<LinkRelationType, { stroke: string; label: string }> = {
  motive: { stroke: '#C9A24D', label: 'Motive' },
  contradiction: { stroke: '#DC2626', label: 'Contradiction' },
  alibi: { stroke: '#38BDF8', label: 'Alibi Link' },
  connection: { stroke: '#94A3B8', label: 'Association' },
};

export const BoardTimelineView: React.FC<BoardTimelineViewProps> = ({
  caseData,
  caseState,
  hasMasterDeductor,
  intuitionActive,
  onUpdateBoardPosition,
  onAddBoardConnection,
  onRemoveBoardConnection,
  onReorderTimeline,
  onVerifyTimeline,
}) => {
  const [subTab, setSubTab] = useState<'board' | 'timeline'>('board');
  const [linkMode, setLinkMode] = useState<LinkRelationType | null>(null);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [timelineMsg, setTimelineMsg] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [draggingNode, setDraggingNode] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Build board nodes: Victim + Suspects + Discovered Evidence
  const nodes: {
    id: string;
    title: string;
    subtitle: string;
    kind: 'victim' | 'suspect' | 'evidence';
  }[] = [
    {
      id: `victim_${caseData.id}`,
      title: caseData.victim.name,
      subtitle: `Victim · ${caseData.victim.estimatedTimeOfDeath}`,
      kind: 'victim',
    },
    ...caseData.suspects.map((s) => ({
      id: s.id,
      title: s.name,
      subtitle: s.occupation,
      kind: 'suspect' as const,
    })),
    ...caseData.evidence
      .filter((e) => caseState.discoveredEvidenceIds.includes(e.id))
      .map((e) => ({
        id: e.id,
        title: e.name,
        subtitle: `${e.category} · ${
          caseState.analyzedEvidenceIds.includes(e.id) ? 'Verified' : 'Raw'
        }`,
        kind: 'evidence' as const,
      })),
  ];

  const handlePointerDown = (e: React.PointerEvent, nodeId: string) => {
    if (linkMode) {
      e.stopPropagation();
      if (!linkSourceId) {
        setLinkSourceId(nodeId);
        noirAudio.playSfx('click');
      } else if (linkSourceId !== nodeId) {
        onAddBoardConnection(linkSourceId, nodeId, linkMode);
        setLinkSourceId(null);
        noirAudio.playSfx('discover');
      } else {
        setLinkSourceId(null);
      }
      return;
    }

    const pos = caseState.boardPositions[nodeId] ?? { x: 80, y: 80 };
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDraggingNode({
      id: nodeId,
      offsetX: e.clientX - rect.left - pos.x,
      offsetY: e.clientY - rect.top - pos.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingNode || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = Math.max(12, Math.min(rect.width - 190, e.clientX - rect.left - draggingNode.offsetX));
    const y = Math.max(12, Math.min(rect.height - 80, e.clientY - rect.top - draggingNode.offsetY));
    onUpdateBoardPosition(draggingNode.id, Math.round(x), Math.round(y));
  };

  const handlePointerUp = () => {
    setDraggingNode(null);
  };

  // Evaluate deduction rules satisfied by current board connections
  const ruleMatches = caseData.deductionRules.map((rule) => {
    const connected = caseState.boardConnections.some(
      (c: BoardConnection) =>
        (c.fromId === rule.nodeA && c.toId === rule.nodeB) ||
        (c.fromId === rule.nodeB && c.toId === rule.nodeA)
    );
    return { ...rule, connected };
  });

  const satisfiedCount = ruleMatches.filter((r) => r.connected).length;

  // Timeline reconstruction helpers
  const unlockedEvents = caseState.orderedTimelineIds
    .map((id) => caseData.timelineEvents.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const moveTimelineEvent = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= unlockedEvents.length) return;
    noirAudio.playSfx('click');
    const copy = unlockedEvents.map((e) => e.id);
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    onReorderTimeline(copy);
    setTimelineMsg(null);
  };

  const checkTimeline = () => {
    const ok = onVerifyTimeline();
    if (ok) {
      noirAudio.playSfx('unlock');
      setTimelineMsg('Chronology verified! Contradictions against suspect alibis are now confirmed.');
    } else {
      noirAudio.playSfx('click');
      setTimelineMsg(
        'Sequence is out of chronological order or missing key verified timestamps.'
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 py-5 sm:px-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="font-display text-3xl font-semibold text-white">
            Investigation Board & Timeline
          </h2>
          <p className="text-sm text-slate-400">
            Connect clues to build your case theory, then lock the chronological sequence of events.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-[#141923] p-1 border border-white/10">
          <button
            onClick={() => {
              setSubTab('board');
              noirAudio.playSfx('click');
            }}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              subTab === 'board'
                ? 'bg-[#C9A24D] text-[#0B0D12]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <GitBranch className="h-4 w-4" />
            <span>Corkboard</span>
          </button>
          <button
            onClick={() => {
              setSubTab('timeline');
              noirAudio.playSfx('click');
            }}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              subTab === 'timeline'
                ? 'bg-[#C9A24D] text-[#0B0D12]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Timeline</span>
          </button>
        </div>
      </div>

      {subTab === 'board' ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Board Canvas */}
          <div className="lg:col-span-9 space-y-3">
            {/* Link Tool Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#121620] px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 mr-1">String Mode:</span>
                <button
                  onClick={() => {
                    setLinkMode(null);
                    setLinkSourceId(null);
                  }}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    linkMode === null
                      ? 'bg-[#252D3F] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Drag Cards
                </button>
                {(Object.keys(RELATION_COLORS) as LinkRelationType[]).map((rel) => (
                  <button
                    key={rel}
                    onClick={() => {
                      setLinkMode(rel);
                      setLinkSourceId(null);
                      noirAudio.playSfx('click');
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      linkMode === rel
                        ? 'bg-[#C9A24D] text-[#0B0D12]'
                        : 'bg-[#171C28] text-slate-300 hover:text-white'
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: RELATION_COLORS[rel].stroke }}
                    />
                    <span>{RELATION_COLORS[rel].label}</span>
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400">
                {linkMode
                  ? linkSourceId
                    ? 'Click a second card to complete thread'
                    : 'Click first card to start thread'
                  : 'Drag cards freely to organize'}
              </span>
            </div>

            <div
              ref={boardRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="relative h-[580px] w-full overflow-auto rounded-xl border border-white/10 bg-[#0D1119] select-none"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            >
              {/* SVG Connection Strings */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full min-w-[920px] min-h-[560px]">
                {caseState.boardConnections.map((conn) => {
                  const p1 = caseState.boardPositions[conn.fromId] ?? { x: 80, y: 80 };
                  const p2 = caseState.boardPositions[conn.toId] ?? { x: 240, y: 180 };
                  const color = RELATION_COLORS[conn.relation]?.stroke ?? '#C9A24D';
                  return (
                    <line
                      key={conn.id}
                      x1={p1.x + 88}
                      y1={p1.y + 32}
                      x2={p2.x + 88}
                      y2={p2.y + 32}
                      stroke={color}
                      strokeWidth="2.2"
                      strokeDasharray={conn.relation === 'contradiction' ? '6 4' : undefined}
                      opacity="0.85"
                    />
                  );
                })}
              </svg>

              {/* Draggable Cards */}
              {nodes.map((node) => {
                const pos = caseState.boardPositions[node.id] ?? { x: 60, y: 60 };
                const isSource = linkSourceId === node.id;
                return (
                  <div
                    key={node.id}
                    onPointerDown={(e) => handlePointerDown(e, node.id)}
                    style={{ left: pos.x, top: pos.y }}
                    className={`absolute w-44 cursor-grab active:cursor-grabbing rounded-lg border p-3 shadow-lg transition-shadow ${
                      isSource
                        ? 'border-[#C9A24D] ring-2 ring-[#C9A24D]/50 bg-[#1B2233]'
                        : node.kind === 'victim'
                        ? 'border-[#9E2A3B]/60 bg-[#1D1419]'
                        : node.kind === 'suspect'
                        ? 'border-white/15 bg-[#151B28]'
                        : 'border-[#C9A24D]/35 bg-[#131822]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="uppercase tracking-wider">{node.kind}</span>
                      <span className="h-2 w-2 rounded-full bg-[#C9A24D]" />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-white truncate">
                      {node.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{node.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Deduction Evaluator & String List */}
          <div className="lg:col-span-3 rounded-xl border border-white/10 bg-[#121620] p-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h3 className="font-display text-2xl font-semibold text-white">
                  Case Deductions
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Proven Links: {satisfiedCount}/{ruleMatches.length}
                </p>
              </div>

              <div className="space-y-2.5">
                {ruleMatches.map((r) => {
                  const nA = nodes.find((n) => n.id === r.nodeA)?.title;
                  const nB = nodes.find((n) => n.id === r.nodeB)?.title;
                  return (
                    <div
                      key={r.id}
                      className={`rounded-lg border p-3 text-xs ${
                        r.connected
                          ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                          : 'border-white/10 bg-[#171C28] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{r.label}</span>
                        {r.connected && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                      </div>
                      {(hasMasterDeductor || intuitionActive || r.connected) && nA && nB && (
                        <p className="mt-1 text-[11px] text-slate-400">
                          Link: {nA} ↔ {nB}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {caseState.boardConnections.length > 0 && (
                <div className="border-t border-white/10 pt-3 space-y-2">
                  <p className="text-xs font-medium text-slate-400">Active Threads</p>
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {caseState.boardConnections.map((conn) => {
                      const a = nodes.find((n) => n.id === conn.fromId)?.title ?? conn.fromId;
                      const b = nodes.find((n) => n.id === conn.toId)?.title ?? conn.toId;
                      return (
                        <div
                          key={conn.id}
                          className="flex items-center justify-between gap-2 rounded bg-[#171C28] px-2.5 py-1.5 text-[11px] text-slate-300"
                        >
                          <span className="truncate">
                            <Link2 className="inline h-3 w-3 mr-1 text-[#C9A24D]" />
                            {a} → {b}
                          </span>
                          <button
                            onClick={() => onRemoveBoardConnection(conn.id)}
                            className="text-slate-400 hover:text-rose-400 shrink-0"
                            aria-label="Remove thread"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-[#171C28] p-3 text-xs text-slate-300 border border-white/10">
              {satisfiedCount >= ruleMatches.length
                ? 'All core board deductions linked. Verify the Timeline or proceed to Accusation.'
                : 'Connect suspects to contradicting or linking evidence to strengthen your accusation.'}
            </div>
          </div>
        </div>
      ) : (
        /* TIMELINE RECONSTRUCTION */
        <div className="rounded-xl border border-white/10 bg-[#121620] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="font-display text-2xl font-semibold text-white">
                Chronological Reconstruction
              </h3>
              <p className="text-xs text-slate-400">
                Arrange discovered events from earliest to latest. Uncovering new evidence or catching lies unlocks missing timestamps.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono-tabular text-xs text-[#C9A24D]">
                {unlockedEvents.length}/{caseData.timelineEvents.length} Events Unlocked
              </span>
              <button
                onClick={checkTimeline}
                className="rounded-lg bg-[#C9A24D] px-4 py-2 text-xs font-semibold text-[#0B0D12] hover:bg-[#D8B461] whitespace-nowrap shrink-0"
              >
                Verify Timeline
              </button>
            </div>
          </div>

          {caseState.timelineVerified && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                Timeline Verified: Verified timestamps expose the culprit’s alibi contradiction.
              </span>
            </div>
          )}

          {timelineMsg && !caseState.timelineVerified && (
            <p className="text-xs text-rose-400">{timelineMsg}</p>
          )}

          <div className="space-y-3">
            {unlockedEvents.map((ev, idx) => (
              <div
                key={ev.id}
                className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${
                  ev.isContradiction && caseState.timelineVerified
                    ? 'border-[#9E2A3B]/60 bg-[#211319]'
                    : 'border-white/10 bg-[#171C28]'
                }`}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="rounded-lg bg-[#0B0D12] px-3 py-2 font-mono-tabular text-sm font-semibold text-[#C9A24D] border border-white/10 shrink-0">
                    {ev.timeLabel}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span>{ev.source}</span>
                      {ev.isContradiction && caseState.timelineVerified && (
                        <>
                          <span>·</span>
                          <span className="font-medium text-rose-400">
                            Alibi Contradiction Exposed
                          </span>
                        </>
                      )}
                    </div>
                    <p className="mt-0.5 font-medium text-white">{ev.title}</p>
                    <p className="mt-1 text-xs text-slate-300">{ev.description}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => moveTimelineEvent(idx, -1)}
                    disabled={idx === 0}
                    className="rounded bg-[#121620] p-1.5 text-slate-300 hover:text-white disabled:opacity-30"
                    aria-label="Move event earlier"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveTimelineEvent(idx, 1)}
                    disabled={idx === unlockedEvents.length - 1}
                    className="rounded bg-[#121620] p-1.5 text-slate-300 hover:text-white disabled:opacity-30"
                    aria-label="Move event later"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
