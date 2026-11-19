import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  FlaskConical,
  KeyRound,
  Lock,
  Microscope,
  Radio,
  RotateCw,
  ShieldCheck,
} from 'lucide-react';
import { noirAudio } from '../audio/noirAudio';
import {
  CaseData,
  CaseProgressState,
  DifficultyLevel,
  EvidenceCategory,
  EvidenceItem,
} from '../types/game';

interface ForensicLabViewProps {
  caseData: CaseData;
  caseState: CaseProgressState;
  difficulty: DifficultyLevel;
  hasLabProdigy: boolean;
  hasShadowAccess: boolean;
  intuitionActive: boolean;
  onCompleteAnalysis: (evidenceId: string) => void;
}

export const ForensicLabView: React.FC<ForensicLabViewProps> = ({
  caseData,
  caseState,
  difficulty,
  hasLabProdigy,
  hasShadowAccess,
  intuitionActive,
  onCompleteAnalysis,
}) => {
  const [filter, setFilter] = useState<'All' | EvidenceCategory>('All');
  const discoveredList = caseData.evidence.filter((e) =>
    caseState.discoveredEvidenceIds.includes(e.id)
  );
  const filtered =
    filter === 'All'
      ? discoveredList
      : discoveredList.filter((e) => e.category === filter);

  const [selectedId, setSelectedId] = useState<string>(
    discoveredList[0]?.id ?? ''
  );

  useEffect(() => {
    if (!discoveredList.some((e) => e.id === selectedId)) {
      setSelectedId(discoveredList[0]?.id ?? '');
    }
  }, [discoveredList, selectedId]);

  const activeItem = discoveredList.find((e) => e.id === selectedId);
  const isAnalyzed = activeItem
    ? caseState.analyzedEvidenceIds.includes(activeItem.id)
    : false;

  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 py-5 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="font-display text-3xl font-semibold text-white">
            Forensic Lab & Evidence Vault
          </h2>
          <p className="text-sm text-slate-400">
            Examine collected items and run laboratory puzzles to unlock hidden deductions.
          </p>
        </div>

        {/* Interactive Category Filter */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#141923] p-1 border border-white/10">
          {(['All', 'Physical', 'Digital', 'Documentary', 'Forensic'] as const).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => {
                  setFilter(cat);
                  noirAudio.playSfx('click');
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  filter === cat
                    ? 'bg-[#C9A24D] text-[#0B0D12]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </div>

      {discoveredList.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#121620] p-12 text-center">
          <Microscope className="mx-auto mb-3 h-10 w-10 text-[#C9A24D]/70" />
          <p className="font-display text-2xl text-white">No Evidence Collected Yet</p>
          <p className="mt-2 text-sm text-slate-400">
            Investigate the crime scene first and collect physical, digital, or documentary clues.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Evidence List */}
          <div className="lg:col-span-4 space-y-2.5">
            {filtered.map((item) => {
              const analyzed = caseState.analyzedEvidenceIds.includes(item.id);
              const selected = item.id === activeItem?.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    noirAudio.playSfx('click');
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    selected
                      ? 'border-[#C9A24D] bg-[#181E2C]'
                      : 'border-white/10 bg-[#121620] hover:bg-[#171C28]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {item.category} · {item.importance}
                    </span>
                    <span
                      className={`font-medium ${
                        analyzed ? 'text-emerald-400' : 'text-[#C9A24D]'
                      }`}
                    >
                      {analyzed ? 'Verified' : 'Needs Analysis'}
                    </span>
                  </div>
                  <p className="mt-1.5 font-medium text-white">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-400 truncate">
                    {item.discoveryLocation}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Analysis & Puzzle Workbench */}
          <div className="lg:col-span-8 rounded-xl border border-white/10 bg-[#121620] p-6">
            {activeItem ? (
              <div className="space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <span className="font-mono-tabular">
                      ID: {activeItem.id.toUpperCase()} · {activeItem.category} ·{' '}
                      {activeItem.discoveryLocation}
                    </span>
                    <span className="font-medium text-[#C9A24D]">
                      {activeItem.importance} Priority
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-3xl font-semibold text-white">
                    {activeItem.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    {activeItem.description}
                  </p>
                </div>

                {isAnalyzed ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5">
                    <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Forensic Analysis Complete</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-200">
                      {activeItem.analysisResult}
                    </p>
                  </div>
                ) : activeItem.puzzleType ? (
                  <PuzzleWorkbench
                    key={activeItem.id}
                    item={activeItem}
                    difficulty={difficulty}
                    hasLabProdigy={hasLabProdigy || intuitionActive}
                    hasShadowAccess={hasShadowAccess || intuitionActive}
                    onSolve={() => {
                      noirAudio.playSfx('unlock');
                      onCompleteAnalysis(activeItem.id);
                    }}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 9 INTERACTIVE INVESTIGATION PUZZLES
 * ============================================================================ */

interface PuzzleProps {
  item: EvidenceItem;
  difficulty: DifficultyLevel;
  hasLabProdigy: boolean;
  hasShadowAccess: boolean;
  onSolve: () => void;
}

const PuzzleWorkbench: React.FC<PuzzleProps> = ({
  item,
  difficulty,
  hasLabProdigy,
  hasShadowAccess,
  onSolve,
}) => {
  const data = (item.puzzleData ?? {}) as Record<string, unknown>;
  const [feedback, setFeedback] = useState<string | null>(null);

  // 1. FINGERPRINT MATCHING
  const [fpOffset, setFpOffset] = useState(0);
  const [fpRot, setFpRot] = useState(0);

  // 2. PASSWORD CRACKING
  const [pinInput, setPinInput] = useState('');

  // 3. SAFE UNLOCKING
  const [dials, setDials] = useState<[number, number, number]>([0, 0, 0]);

  // 4. CAESAR CIPHER
  const [shiftVal, setShiftVal] = useState(0);

  // 5. CCTV SCRUBBER
  const [cctvIdx, setCctvIdx] = useState(0);

  // 6. AUDIO EQUALIZER
  const [eqLow, setEqLow] = useState(65);
  const [eqMid, setEqMid] = useState(40);
  const [eqHigh, setEqHigh] = useState(70);

  // 7. DOCUMENT RECONSTRUCTION
  const initialStrips = (data.strips as string[] | undefined) ?? [];
  const [docOrder, setDocOrder] = useState<string[]>(() =>
    initialStrips.length >= 4
      ? [initialStrips[2], initialStrips[0], initialStrips[3], initialStrips[1]]
      : initialStrips
  );

  // 8. PHOTO UV & CONTRAST SCANNER
  const [uvPower, setUvPower] = useState(20);
  const [contrastVal, setContrastVal] = useState(100);

  const tolerance = difficulty === 'Detective' || hasLabProdigy ? 1 : 0;

  if (item.puzzleType === 'fingerprint') {
    const targetOffset = Number(data.targetOffset ?? 2);
    const targetRot = Number(data.targetRotation ?? 15);
    const matchName = String(data.matchName ?? 'Verified Match');

    const checkPrint = () => {
      if (
        Math.abs(fpOffset - targetOffset) <= tolerance &&
        Math.abs(fpRot - targetRot) <= (difficulty === 'Detective' || hasLabProdigy ? 5 : 0)
      ) {
        onSolve();
      } else {
        noirAudio.playSfx('click');
        setFeedback('Ridge bifurcation mismatch. Adjust offset and rotation angle.');
      }
    };

    return (
      <div className="space-y-4 rounded-xl border border-white/10 bg-[#171C28] p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#C9A24D]">
            Biometric Ridge Alignment
          </span>
          <span className="font-mono-tabular text-xs text-slate-400">
            Target: {matchName}
          </span>
        </div>
        <p className="text-xs text-slate-300">{item.puzzlePrompt}</p>

        <div className="flex flex-col sm:flex-row items-center gap-6 py-3">
          {/* Latent Print Visualizer */}
          <div className="relative flex h-44 w-44 items-center justify-center rounded-xl border border-white/15 bg-[#0B0D12] overflow-hidden">
            {/* Reference Print */}
            <svg viewBox="0 0 100 100" className="absolute h-32 w-32 text-emerald-400/35">
              {[12, 18, 24, 30, 36].map((r) => (
                <ellipse
                  key={r}
                  cx="50"
                  cy="50"
                  rx={r * 0.72}
                  ry={r}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeDasharray="6 3"
                />
              ))}
            </svg>
            {/* Movable Latent Print */}
            <svg
              viewBox="0 0 100 100"
              className="relative h-32 w-32 text-[#C9A24D] transition-transform duration-150"
              style={{
                transform: `translateX(${(fpOffset - targetOffset) * 9}px) rotate(${
                  fpRot - targetRot
                }deg)`,
              }}
            >
              {[12, 18, 24, 30, 36].map((r) => (
                <ellipse
                  key={r}
                  cx="50"
                  cy="50"
                  rx={r * 0.72}
                  ry={r}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                />
              ))}
            </svg>
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Horizontal Ridge Offset</span>
                <span className="font-mono-tabular">{fpOffset} mm</span>
              </label>
              <input
                type="range"
                min={-4}
                max={4}
                step={1}
                value={fpOffset}
                onChange={(e) => setFpOffset(Number(e.target.value))}
                className="w-full accent-[#C9A24D]"
              />
            </div>
            <div>
              <label className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Angular Rotation</span>
                <span className="font-mono-tabular">{fpRot}°</span>
              </label>
              <input
                type="range"
                min={-30}
                max={30}
                step={5}
                value={fpRot}
                onChange={(e) => setFpRot(Number(e.target.value))}
                className="w-full accent-[#C9A24D]"
              />
            </div>
            {(hasLabProdigy || difficulty === 'Detective') && (
              <p className="text-[11px] text-slate-400">
                Lab Calibration Hint: Target lies near Offset {targetOffset}mm, Rotation {targetRot}°.
              </p>
            )}
            <button
              onClick={checkPrint}
              className="rounded-lg bg-[#C9A24D] px-4 py-2 text-sm font-semibold text-[#0B0D12] hover:bg-[#D8B461]"
            >
              Confirm Biometric Match
            </button>
          </div>
        </div>
        {feedback && <p className="text-xs text-rose-400">{feedback}</p>}
      </div>
    );
  }

  if (item.puzzleType === 'dna') {
    const targetPattern = (data.targetPattern as number[]) ?? [1, 3, 4];
    const candidates =
      (data.candidates as { name: string; bands: number[] }[]) ?? [];

    return (
      <div className="space-y-4 rounded-xl border border-white/10 bg-[#171C28] p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-[#C9A24D]">
          <FlaskConical className="h-4 w-4" />
          <span>Electrophoresis & Chemical Band Match</span>
        </div>
        <p className="text-xs text-slate-300">{item.puzzlePrompt}</p>

        {/* Reference Sample */}
        <div className="rounded-lg bg-[#0B0D12] p-3 border border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>{String(data.sampleLabel ?? 'Crime Scene Sample')}</span>
            <span className="font-mono-tabular">
              Active Markers: {targetPattern.join('-')}
            </span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((slot) => (
              <div
                key={slot}
                className={`h-4 rounded ${
                  targetPattern.includes(slot)
                    ? 'bg-[#C9A24D]'
                    : 'bg-slate-800/60'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Candidate Profiles */}
        <div className="space-y-2.5">
          {candidates.map((cand) => {
            const isMatch =
              cand.bands.length === targetPattern.length &&
              cand.bands.every((b, idx) => b === targetPattern[idx]);
            return (
              <button
                key={cand.name}
                onClick={() => {
                  if (isMatch) onSolve();
                  else {
                    noirAudio.playSfx('click');
                    setFeedback(
                      `${cand.name} does not match the crime scene marker bands.`
                    );
                  }
                }}
                className="w-full rounded-lg border border-white/10 bg-[#121620] p-3 text-left transition-colors hover:border-[#C9A24D]"
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-medium text-white">{cand.name}</span>
                  <span className="font-mono-tabular text-slate-400">
                    Markers: {cand.bands.join('-')}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((slot) => (
                    <div
                      key={slot}
                      className={`h-3 rounded ${
                        cand.bands.includes(slot)
                          ? 'bg-sky-400/80'
                          : 'bg-slate-800/60'
                      }`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        {feedback && <p className="text-xs text-rose-400">{feedback}</p>}
      </div>
    );
  }

  if (item.puzzleType === 'password') {
    const solution = String(data.solution ?? '1999');
    const hint = String(data.hint ?? '');

    const pressKey = (k: string) => {
      noirAudio.playSfx('click');
      if (k === 'CLR') {
        setPinInput('');
        setFeedback(null);
      } else if (pinInput.length < 4) {
        const next = pinInput + k;
        setPinInput(next);
        if (next.length === 4) {
          if (next === solution) onSolve();
          else setFeedback('Access Denied. Re-check the numerical clue.');
        }
      }
    };

    return (
      <div className="space-y-4 rounded-xl border border-white/10 bg-[#171C28] p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-[#C9A24D]">
          <KeyRound className="h-4 w-4" />
          <span>Terminal Access Decryption</span>
        </div>
        <p className="text-xs text-slate-300">{item.puzzlePrompt}</p>
        <p className="text-xs text-slate-400">Clue: {hint}</p>

        <div className="mx-auto max-w-xs space-y-3 rounded-xl bg-[#0B0D12] p-4 border border-white/10">
          <div className="rounded-lg bg-[#141923] py-3 text-center font-mono-tabular text-2xl tracking-[0.4em] text-[#C9A24D]">
            {pinInput.padEnd(4, '•')}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'OK'].map(
              (k) => (
                <button
                  key={k}
                  onClick={() => {
                    if (k === 'OK') {
                      if (pinInput === solution) onSolve();
                      else setFeedback('Incorrect PIN.');
                    } else {
                      pressKey(k);
                    }
                  }}
                  className="rounded-lg bg-[#1C2232] py-2.5 font-mono-tabular text-sm font-medium text-white hover:bg-[#273046]"
                >
                  {k}
                </button>
              )
            )}
          </div>
        </div>
        {feedback && <p className="text-xs text-rose-400 text-center">{feedback}</p>}
      </div>
    );
  }

  if (item.puzzleType === 'safe') {
    const combo = (data.combination as [number, number, number]) ?? [9, 15, 27];
    const hint = String(data.hint ?? '');

    const stepDial = (idx: 0 | 1 | 2, delta: number) => {
      noirAudio.playSfx('click');
      setDials((prev) => {
        const next: [number, number, number] = [...prev] as [number, number, number];
        next[idx] = (next[idx] + delta + 60) % 60;
        return next;
      });
    };

    const tryOpen = () => {
      if (dials[0] === combo[0] && dials[1] === combo[1] && dials[2] === combo[2]) {
        onSolve();
      } else {
        noirAudio.playSfx('click');
        setFeedback('Tumblers did not catch. Verify all three numbers.');
      }
    };

    return (
      <div className="space-y-4 rounded-xl border border-white/10 bg-[#171C28] p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-[#C9A24D]">
          <Lock className="h-4 w-4" />
          <span>Combination Safe Mechanism</span>
        </div>
        <p className="text-xs text-slate-300">{item.puzzlePrompt}</p>
        <p className="text-xs text-slate-400">Reference: {hint}</p>

        <div className="grid grid-cols-3 gap-3 py-2">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="flex flex-col items-center gap-2 rounded-xl bg-[#0B0D12] p-4 border border-white/10"
            >
              <span className="text-[11px] text-slate-400">Dial {idx + 1}</span>
              <div className="font-mono-tabular text-2xl font-semibold text-[#C9A24D]">
                {String(dials[idx]).padStart(2, '0')}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => stepDial(idx as 0 | 1 | 2, -1)}
                  className="rounded bg-[#1D2333] px-2.5 py-1 text-xs text-white hover:bg-[#2A334A]"
                >
                  -1
                </button>
                <button
                  onClick={() => stepDial(idx as 0 | 1 | 2, 1)}
                  className="rounded bg-[#1D2333] px-2.5 py-1 text-xs text-white hover:bg-[#2A334A]"
                >
                  +1
                </button>
                <button
                  onClick={() => stepDial(idx as 0 | 1 | 2, 5)}
                  className="rounded bg-[#1D2333] px-2.5 py-1 text-xs text-white hover:bg-[#2A334A]"
                >
                  +5
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={tryOpen}
          className="rounded-lg bg-[#C9A24D] px-5 py-2.5 text-sm font-semibold text-[#0B0D12] hover:bg-[#D8B461]"
        >
          Turn Safe Handle
        </button>
        {feedback && <p className="text-xs text-rose-400">{feedback}</p>}
      </div>
    );
  }

  if (item.puzzleType === 'cipher') {
    const cipherText = String(data.cipherText ?? '');
    const targetShift = Number(data.shift ?? 3);

    const decode = (text: string, shift: number) =>
      text
        .split('')
        .map((ch) => {
          const code = ch.charCodeAt(0);
          if (code >= 65 && code <= 90) {
            return String.fromCharCode(((code - 65 - shift + 26) % 26) + 65);
          }
          return ch;
        })
        .join('');

    const decoded = decode(cipherText, shiftVal);

    return (
      <div className="space-y-4 rounded-xl border border-white/10 bg-[#171C28] p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-[#C9A24D]">
          <RotateCw className="h-4 w-4" />
          <span>Cipher Wheel Decoder</span>
        </div>
        <p className="text-xs text-slate-300">{item.puzzlePrompt}</p>

        <div className="rounded-lg bg-[#0B0D12] p-4 border border-white/10 space-y-2">
          <p className="text-[11px] text-slate-400">Encrypted String</p>
          <p className="font-mono-tabular text-sm text-slate-400">{cipherText}</p>
          <p className="pt-2 text-[11px] text-[#C9A24D]">Live Decoded Output</p>
          <p className="font-mono-tabular text-base font-medium text-white">
            {decoded}
          </p>
        </div>

        <div>
          <label className="flex justify-between text-xs text-slate-300 mb-1">
            <span>Alphabet Back-Shift</span>
            <span className="font-mono-tabular">-{shiftVal}</span>
          </label>
          <input
            type="range"
            min={0}
            max={12}
            step={1}
            value={shiftVal}
            onChange={(e) => setShiftVal(Number(e.target.value))}
            className="w-full accent-[#C9A24D]"
          />
          {hasShadowAccess && (
            <p className="mt-1 text-[11px] text-slate-400">
              Shadow Access Hint: Shift back {targetShift} places.
            </p>
          )}
        </div>

        <button
          onClick={() => {
            if (shiftVal === targetShift) onSolve();
            else setFeedback('Decoded words are still scrambled. Adjust the shift.');
          }}
          className="rounded-lg bg-[#C9A24D] px-5 py-2.5 text-sm font-semibold text-[#0B0D12] hover:bg-[#D8B461]"
        >
          Lock Decrypted Transcript
        </button>
        {feedback && <p className="text-xs text-rose-400">{feedback}</p>}
      </div>
    );
  }

  if (item.puzzleType === 'cctv') {
    const frames =
      (data.frames as { time: string; caption: string }[]) ?? [];
    const targetTime = String(data.targetTime ?? '23:35');
    const current = frames[cctvIdx] ?? frames[0];

    return (
      <div className="space-y-4 rounded-xl border border-white/10 bg-[#171C28] p-5">
        <div className="text-sm font-medium text-[#C9A24D]">
          Surveillance Reel Scrubber
        </div>
        <p className="text-xs text-slate-300">{item.puzzlePrompt}</p>

        {current && (
          <div className="rounded-xl bg-[#0B0D12] p-5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between font-mono-tabular text-xs text-slate-400">
              <span>CAM-04 · NORTH GATE</span>
              <span className="text-[#C9A24D]">{current.time}</span>
            </div>
            <p className="text-sm leading-relaxed text-white">{current.caption}</p>
            {hasShadowAccess && current.time === targetTime && (
              <p className="text-xs text-emerald-400">
                Shadow Access flagged anomalous headlights-off entry on this frame.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {frames.map((fr, i) => (
            <button
              key={fr.time}
              onClick={() => {
                setCctvIdx(i);
                noirAudio.playSfx('click');
              }}
              className={`rounded-lg px-3 py-1.5 font-mono-tabular text-xs transition-colors ${
                i === cctvIdx
                  ? 'bg-[#C9A24D] text-[#0B0D12] font-semibold'
                  : 'bg-[#121620] text-slate-300 hover:bg-[#1E2536]'
              }`}
            >
              {fr.time}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            if (current?.time === targetTime) onSolve();
            else setFeedback('No suspect vehicle enters the gate in this frame.');
          }}
          className="rounded-lg bg-[#C9A24D] px-5 py-2.5 text-sm font-semibold text-[#0B0D12] hover:bg-[#D8B461]"
        >
          Flag Frame as Evidence
        </button>
        {feedback && <p className="text-xs text-rose-400">{feedback}</p>}
      </div>
    );
  }

  if (item.puzzleType === 'audio') {
    const tLow = Number(data.targetLow ?? 20);
    const tMid = Number(data.targetMid ?? 85);
    const tHigh = Number(data.targetHigh ?? 30);
    const transcript = String(data.revealedTranscript ?? '');

    const errorSum =
      Math.abs(eqLow - tLow) + Math.abs(eqMid - tMid) + Math.abs(eqHigh - tHigh);
    const clarity = Math.max(0, Math.min(100, Math.round(100 - errorSum * 0.6)));
    const passThreshold = difficulty === 'Mastermind' ? 92 : 82;

    return (
      <div className="space-y-4 rounded-xl border border-white/10 bg-[#171C28] p-5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-[#C9A24D]">
            <Radio className="h-4 w-4" />
            <span>3-Band Forensic Audio Enhancer</span>
          </span>
          <span className="font-mono-tabular text-xs text-white">
            Voice Clarity: {clarity}%
          </span>
        </div>
        <p className="text-xs text-slate-300">{item.puzzlePrompt}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-lg bg-[#0B0D12] p-4 border border-white/10">
          <div>
            <label className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Low Rumble (Cut)</span>
              <span className="font-mono-tabular">{eqLow}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={eqLow}
              onChange={(e) => setEqLow(Number(e.target.value))}
              className="w-full accent-[#C9A24D]"
            />
          </div>
          <div>
            <label className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Mid Voice (Boost)</span>
              <span className="font-mono-tabular">{eqMid}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={eqMid}
              onChange={(e) => setEqMid(Number(e.target.value))}
              className="w-full accent-[#C9A24D]"
            />
          </div>
          <div>
            <label className="flex justify-between text-xs text-slate-300 mb-1">
              <span>High Hiss (Trim)</span>
              <span className="font-mono-tabular">{eqHigh}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={eqHigh}
              onChange={(e) => setEqHigh(Number(e.target.value))}
              className="w-full accent-[#C9A24D]"
            />
          </div>
        </div>

        <div className="rounded-lg bg-[#0B0D12] p-4 border border-white/10">
          <p className="text-[11px] text-slate-400 mb-1">Recovered Audio Feed</p>
          <p className="font-mono-tabular text-xs leading-relaxed text-slate-200">
            {clarity >= passThreshold
              ? transcript
              : '[STATIC & STAGE BASS OBSCURING SPEECH — CUT LOWS BELOW 25%, BOOST MIDS ABOVE 80%, TRIM HIGHS BELOW 35%]'}
          </p>
        </div>

        <button
          onClick={() => {
            if (clarity >= passThreshold) onSolve();
            else setFeedback(`Clarity must reach at least ${passThreshold}% to isolate the voice.`);
          }}
          className="rounded-lg bg-[#C9A24D] px-5 py-2.5 text-sm font-semibold text-[#0B0D12] hover:bg-[#D8B461]"
        >
          Log Enhanced Audio Transcript
        </button>
        {feedback && <p className="text-xs text-rose-400">{feedback}</p>}
      </div>
    );
  }

  if (item.puzzleType === 'document') {
    const targetStrips = (data.strips as string[]) ?? [];

    const moveStrip = (index: number, dir: -1 | 1) => {
      const target = index + dir;
      if (target < 0 || target >= docOrder.length) return;
      noirAudio.playSfx('click');
      const copy = [...docOrder];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      setDocOrder(copy);
    };

    return (
      <div className="space-y-4 rounded-xl border border-white/10 bg-[#171C28] p-5">
        <div className="text-sm font-medium text-[#C9A24D]">
          Shredded Document Reconstruction
        </div>
        <p className="text-xs text-slate-300">{item.puzzlePrompt}</p>

        <div className="space-y-2">
          {docOrder.map((line, i) => (
            <div
              key={line}
              className="flex items-center justify-between gap-3 rounded-lg bg-[#0B0D12] px-4 py-3 border border-white/10"
            >
              <span className="font-mono-tabular text-xs text-slate-200">{line}</span>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => moveStrip(i, -1)}
                  disabled={i === 0}
                  className="rounded bg-[#1D2333] p-1.5 text-slate-300 hover:text-white disabled:opacity-30"
                  aria-label="Move strip up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => moveStrip(i, 1)}
                  disabled={i === docOrder.length - 1}
                  className="rounded bg-[#1D2333] p-1.5 text-slate-300 hover:text-white disabled:opacity-30"
                  aria-label="Move strip down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            const solved = docOrder.every((l, i) => l === targetStrips[i]);
            if (solved) onSolve();
            else setFeedback('Header, debit amount, warning note, and CC line are not yet aligned.');
          }}
          className="rounded-lg bg-[#C9A24D] px-5 py-2.5 text-sm font-semibold text-[#0B0D12] hover:bg-[#D8B461]"
        >
          Verify Ledger Sequence
        </button>
        {feedback && <p className="text-xs text-rose-400">{feedback}</p>}
      </div>
    );
  }

  // 9. PHOTO UV / CONTRAST SCANNER
  const hiddenMessage = String(data.hiddenMessage ?? '');
  const revealed = uvPower >= 75 && contrastVal >= 150;

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-[#171C28] p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-[#C9A24D]">
        <ShieldCheck className="h-4 w-4" />
        <span>Archival Photo UV & Contrast Scanner</span>
      </div>
      <p className="text-xs text-slate-300">{item.puzzlePrompt}</p>

      <div
        className="rounded-xl border border-white/15 bg-[#0B0D12] p-6 text-center transition-all"
        style={{
          filter: `contrast(${contrastVal}%)`,
          boxShadow: `inset 0 0 60px rgba(139, 92, 246, ${uvPower / 220})`,
        }}
      >
        <p className="font-mono-tabular text-xs text-slate-400 mb-2">
          ARCHIVAL PLATE · UV {uvPower}% · CONTRAST {contrastVal}%
        </p>
        <p
          className={`font-mono-tabular text-sm leading-relaxed transition-opacity ${
            revealed ? 'text-violet-200 opacity-100' : 'text-slate-600 opacity-30 blur-[2px]'
          }`}
        >
          {hiddenMessage}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex justify-between text-xs text-slate-300 mb-1">
            <span>UV Spectrum Intensity (Target 75%+)</span>
            <span className="font-mono-tabular">{uvPower}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={uvPower}
            onChange={(e) => setUvPower(Number(e.target.value))}
            className="w-full accent-violet-500"
          />
        </div>
        <div>
          <label className="flex justify-between text-xs text-slate-300 mb-1">
            <span>Micro-Contrast (Target 150%+)</span>
            <span className="font-mono-tabular">{contrastVal}%</span>
          </label>
          <input
            type="range"
            min={80}
            max={200}
            step={10}
            value={contrastVal}
            onChange={(e) => setContrastVal(Number(e.target.value))}
            className="w-full accent-[#C9A24D]"
          />
        </div>
      </div>

      <button
        onClick={() => {
          if (revealed) onSolve();
          else setFeedback('Increase both UV intensity and contrast to isolate the invisible ink.');
        }}
        className="rounded-lg bg-[#C9A24D] px-5 py-2.5 text-sm font-semibold text-[#0B0D12] hover:bg-[#D8B461]"
      >
        Record Hidden Photographic Inscription
      </button>
      {feedback && <p className="text-xs text-rose-400">{feedback}</p>}
    </div>
  );
};
