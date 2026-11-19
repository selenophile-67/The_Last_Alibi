import React, { useEffect, useState } from 'react';
import {
  Camera,
  Check,
  Eye,
  Flashlight,
  MapPin,
  Search,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { noirAudio } from '../audio/noirAudio';
import { CaseData, CaseProgressState, SceneHotspot } from '../types/game';

interface CrimeSceneViewProps {
  caseData: CaseData;
  caseState: CaseProgressState;
  hasKeenEye: boolean;
  intuitionActive: boolean;
  demoFocusHotspotId?: string | null;
  onInspectHotspot: (hotspot: SceneHotspot) => void;
  onPhotographHotspot: (hotspot: SceneHotspot) => void;
  onCollectEvidence: (evidenceId: string) => void;
  onTravelToLab: () => void;
}

type SceneTool = 'inspect' | 'uv' | 'zoom' | 'camera';

export const CrimeSceneView: React.FC<CrimeSceneViewProps> = ({
  caseData,
  caseState,
  hasKeenEye,
  intuitionActive,
  demoFocusHotspotId,
  onInspectHotspot,
  onPhotographHotspot,
  onCollectEvidence,
  onTravelToLab,
}) => {
  const [locationIndex, setLocationIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<SceneTool>('inspect');
  const [zoomScale, setZoomScale] = useState(1);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [selectedHotspot, setSelectedHotspot] = useState<SceneHotspot | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!demoFocusHotspotId) return;
    caseData.locations.forEach((loc, idx) => {
      const match = loc.hotspots.find((h) => h.id === demoFocusHotspotId);
      if (match) {
        setLocationIndex(idx);
        setImageError(false);
        setActiveTool(match.requiresUV ? 'uv' : match.requiresZoom ? 'zoom' : 'inspect');
        setZoomScale(match.requiresZoom ? 1.45 : 1);
        setSelectedHotspot(match);
      }
    });
  }, [demoFocusHotspotId, caseData.locations]);

  const location = caseData.locations[locationIndex] ?? caseData.locations[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursorPos({ x, y });
  };

  const handleHotspotClick = (hs: SceneHotspot) => {
    if (hs.requiresUV && activeTool !== 'uv' && !hasKeenEye && !intuitionActive) {
      noirAudio.playSfx('click');
      setSelectedHotspot({
        ...hs,
        narrativeText:
          'Something faint glints here, but normal lighting hides the detail. Switch to the UV Light tool or activate Detective’s Intuition to examine it.',
      });
      return;
    }

    if (hs.requiresZoom && activeTool !== 'zoom' && zoomScale === 1 && !hasKeenEye && !intuitionActive) {
      noirAudio.playSfx('click');
      setSelectedHotspot({
        ...hs,
        narrativeText:
          'Fine detail is too distant at standard view. Use Magnifier Zoom or Detective’s Intuition to inspect closely.',
      });
      return;
    }

    if (activeTool === 'camera') {
      noirAudio.playSfx('shutter');
      onPhotographHotspot(hs);
      setSelectedHotspot(hs);
      return;
    }

    noirAudio.playSfx('footstep');
    onInspectHotspot(hs);
    setSelectedHotspot(hs);
  };

  const toggleZoom = () => {
    const next = zoomScale === 1 ? 1.45 : 1;
    setZoomScale(next);
    setActiveTool(next > 1 ? 'zoom' : 'inspect');
    noirAudio.playSfx('click');
  };

  const selectedEvidence = selectedHotspot?.evidenceId
    ? caseData.evidence.find((e) => e.id === selectedHotspot.evidenceId)
    : undefined;

  const isSelectedCollected = selectedEvidence
    ? caseState.discoveredEvidenceIds.includes(selectedEvidence.id)
    : false;

  const isSelectedPhotographed = selectedHotspot
    ? caseState.photographedHotspotIds.includes(selectedHotspot.id)
    : false;

  return (
    <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-5 px-4 py-5 sm:px-6">
      {/* Top Location & Tool Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {caseData.locations.map((loc, idx) => {
            const active = idx === locationIndex;
            return (
              <button
                key={loc.id}
                onClick={() => {
                  setLocationIndex(idx);
                  setSelectedHotspot(null);
                  setImageError(false);
                  noirAudio.playSfx('footstep');
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#C9A24D] text-[#0B0D12]'
                    : 'bg-[#171C28] text-slate-300 hover:bg-[#1E2536] hover:text-white'
                }`}
              >
                <MapPin className="h-4 w-4" />
                <span>{loc.name}</span>
              </button>
            );
          })}
        </div>

        {/* Investigation Tools */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[#141923] p-1 border border-white/10">
          <button
            onClick={() => {
              setActiveTool('inspect');
              setZoomScale(1);
              noirAudio.playSfx('click');
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              activeTool === 'inspect'
                ? 'bg-[#252D3F] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Inspect</span>
          </button>

          <button
            onClick={() => {
              setActiveTool(activeTool === 'uv' ? 'inspect' : 'uv');
              noirAudio.playSfx('click');
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              activeTool === 'uv'
                ? 'bg-[#6D28D9] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flashlight className="h-3.5 w-3.5" />
            <span>UV Light</span>
          </button>

          <button
            onClick={toggleZoom}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              zoomScale > 1
                ? 'bg-[#C9A24D] text-[#0B0D12]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {zoomScale > 1 ? (
              <ZoomOut className="h-3.5 w-3.5" />
            ) : (
              <ZoomIn className="h-3.5 w-3.5" />
            )}
            <span>{zoomScale > 1 ? 'Reset Zoom' : 'Magnify'}</span>
          </button>

          <button
            onClick={() => {
              setActiveTool(activeTool === 'camera' ? 'inspect' : 'camera');
              noirAudio.playSfx('click');
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              activeTool === 'camera'
                ? 'bg-[#9E2A3B] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Photograph</span>
          </button>
        </div>
      </div>

      {/* Main Split: Interactive Crime Scene Canvas + Observation Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        {/* Scene Viewport */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {location.name} · {location.subtitle}
            </span>
            <span className="font-mono-tabular text-[#C9A24D]">
              {
                location.hotspots.filter((h) =>
                  caseState.inspectedHotspotIds.includes(h.id)
                ).length
              }
              /{location.hotspots.length} Spots Examined
            </span>
          </div>

          <div
            onMouseMove={handleMouseMove}
            className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-[#0F131C] select-none"
          >
            <div
              className="relative h-full w-full transition-transform duration-300 ease-out"
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: `${cursorPos.x}% ${cursorPos.y}%`,
              }}
            >
              {!imageError ? (
                <img
                  src={location.imageUrl}
                  alt={location.name}
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className={`h-full w-full object-cover transition-all duration-300 ${
                    activeTool === 'uv' ? 'brightness-75 contrast-125 saturate-50' : ''
                  }`}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#131824] via-[#0B0D12] to-[#1C1419] p-8 text-center">
                  <Search className="mb-3 h-10 w-10 text-[#C9A24D]/70" />
                  <p className="font-display text-2xl text-white">{location.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{location.ambientMood}</p>
                </div>
              )}

              {/* UV Flashlight radial cone */}
              {activeTool === 'uv' && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `radial-gradient(circle 140px at ${cursorPos.x}% ${cursorPos.y}%, rgba(139, 92, 246, 0.34), rgba(11, 13, 18, 0.72) 70%)`,
                  }}
                />
              )}

              {/* Camera viewfinder frame */}
              {activeTool === 'camera' && (
                <div className="pointer-events-none absolute inset-6 border border-[#9E2A3B]/60">
                  <div className="absolute top-2 left-3 font-mono-tabular text-[11px] text-rose-300">
                    REC · EVIDENCE PHOTO MODE
                  </div>
                </div>
              )}

              {/* Psychological Intuition Atmospheric Filter */}
              {intuitionActive && (
                <div
                  className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 50%, rgba(201,162,77,0.08), rgba(158,42,59,0.28) 90%)',
                    boxShadow: 'inset 0 0 90px rgba(158,42,59,0.55)',
                  }}
                />
              )}

              {/* Interactive Hotspots */}
              {location.hotspots.map((hs) => {
                const isInspected = caseState.inspectedHotspotIds.includes(hs.id);
                const isCollected =
                  hs.evidenceId &&
                  caseState.discoveredEvidenceIds.includes(hs.evidenceId);
                const isSelected = selectedHotspot?.id === hs.id;

                const isHiddenByUV =
                  hs.requiresUV && activeTool !== 'uv' && !hasKeenEye && !intuitionActive;
                const distToUV = Math.hypot(
                  cursorPos.x - hs.xPercent,
                  cursorPos.y - hs.yPercent
                );
                const uvLit = activeTool === 'uv' && distToUV < 22;
                const intuitionHighlight = intuitionActive && !isCollected;

                return (
                  <button
                    key={hs.id}
                    type="button"
                    onClick={() => handleHotspotClick(hs)}
                    aria-label={hs.label}
                    style={{
                      left: `${hs.xPercent}%`,
                      top: `${hs.yPercent}%`,
                      width: `${hs.widthPercent}%`,
                      height: `${hs.heightPercent}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`group absolute flex items-center justify-center rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-[#C9A24D] ${
                      isHiddenByUV
                        ? 'opacity-15 hover:opacity-50'
                        : intuitionHighlight
                        ? 'border-2 border-[#C9A24D] bg-[#C9A24D]/25 shadow-[0_0_28px_rgba(201,162,77,0.65)]'
                        : uvLit && hs.requiresUV
                        ? 'border border-violet-400 bg-violet-500/25 shadow-[0_0_24px_rgba(139,92,246,0.45)]'
                        : isSelected
                        ? 'border-2 border-[#C9A24D] bg-[#C9A24D]/15'
                        : 'border border-white/25 bg-black/25 hover:border-[#C9A24D] hover:bg-[#C9A24D]/15'
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium shadow-md transition-transform group-hover:scale-110 ${
                        isCollected
                          ? 'bg-emerald-700/90 text-white'
                          : hs.requiresUV
                          ? 'bg-violet-700/90 text-white'
                          : isInspected
                          ? 'bg-[#1D2333] text-[#C9A24D] border border-[#C9A24D]/60'
                          : 'bg-[#C9A24D] text-[#0B0D12]'
                      }`}
                    >
                      {isCollected ? <Check className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
                    </span>

                    <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#0B0D12]/90 px-2 py-0.5 text-[11px] text-slate-200 opacity-0 transition-opacity group-hover:opacity-100 border border-white/10">
                      {hs.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-slate-400">{location.ambientMood}</p>
        </div>

        {/* Right Panel: Selected Observation & Evidence Action */}
        <div className="lg:col-span-4 flex flex-col justify-between rounded-xl border border-white/10 bg-[#121620] p-5">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="font-display text-2xl font-semibold text-white">
                Scene Observation
              </h2>
              <span className="font-mono-tabular text-xs text-slate-400">
                {activeTool.toUpperCase()}
              </span>
            </div>

            {!selectedHotspot ? (
              <div className="mt-6 space-y-4">
                <p className="text-sm leading-relaxed text-slate-300">
                  Examine the environment carefully. Click highlighted markers to inspect objects, toggle{' '}
                  <strong className="text-violet-300">UV Light</strong> to uncover hidden forensic traces, use{' '}
                  <strong className="text-[#C9A24D]">Magnify</strong> for distant details, and capture{' '}
                  <strong className="text-rose-300">Photographs</strong> for extra observations.
                </p>

                <div className="border-t border-white/10 pt-4">
                  <p className="text-xs font-medium text-slate-400 mb-2">
                    Hotspots in {location.name}
                  </p>
                  <div className="space-y-1.5">
                    {location.hotspots.map((hs) => {
                      const done = caseState.inspectedHotspotIds.includes(hs.id);
                      const collected =
                        hs.evidenceId &&
                        caseState.discoveredEvidenceIds.includes(hs.evidenceId);
                      return (
                        <button
                          key={hs.id}
                          onClick={() => handleHotspotClick(hs)}
                          className="flex w-full items-center justify-between rounded-lg bg-[#171C28] px-3 py-2 text-left text-xs transition-colors hover:bg-[#1E2536]"
                        >
                          <span className="text-slate-200 truncate">{hs.label}</span>
                          <span className="font-mono-tabular text-[11px] text-slate-400 shrink-0 ml-2">
                            {collected ? 'Collected' : done ? 'Examined' : hs.requiresUV ? 'UV Trace' : 'Unchecked'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs text-[#C9A24D]">
                    {location.name} ·{' '}
                    {selectedHotspot.requiresUV
                      ? 'UV Trace'
                      : selectedHotspot.requiresZoom
                      ? 'Macro Detail'
                      : 'Physical Inspection'}
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-white">
                    {selectedHotspot.label}
                  </h3>
                </div>

                <p className="text-sm leading-relaxed text-slate-200">
                  {selectedHotspot.narrativeText}
                </p>

                {intuitionActive && selectedEvidence && (
                  <div className="rounded-lg border border-[#C9A24D]/50 bg-[#1B171D] p-3 text-xs text-[#F2D58B]">
                    <span className="font-semibold">Intuition Impression: </span>
                    {selectedEvidence.importance === 'Misleading'
                      ? 'Something feels staged here—this trace may be a deliberate distraction or red herring.'
                      : selectedEvidence.importance === 'Secret'
                      ? 'An unusual secret lingers beneath this object; it ties directly to the deeper Ravenwood conspiracy.'
                      : 'Strong forensic weight—analyzing or presenting this item will challenge a suspect’s core alibi.'}
                  </div>
                )}

                {selectedHotspot.photographicClue && (
                  <div className="rounded-lg bg-[#171C28] p-3 text-xs text-slate-300 border border-white/10">
                    <span className="font-medium text-rose-300">Camera Note: </span>
                    {isSelectedPhotographed
                      ? selectedHotspot.photographicClue
                      : 'Switch to Photograph mode and click this spot to log forensic framing.'}
                  </div>
                )}

                {selectedEvidence && (
                  <div className="rounded-lg bg-[#171C28] p-4 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{selectedEvidence.category} Evidence</span>
                      <span>{selectedEvidence.importance}</span>
                    </div>
                    <p className="text-sm font-medium text-white">
                      {selectedEvidence.name}
                    </p>
                    <p className="text-xs text-slate-300">
                      {selectedEvidence.description}
                    </p>

                    {!isSelectedCollected ? (
                      <button
                        onClick={() => {
                          noirAudio.playSfx('discover');
                          onCollectEvidence(selectedEvidence.id);
                        }}
                        className="w-full rounded-lg bg-[#C9A24D] px-4 py-2.5 text-sm font-semibold text-[#0B0D12] transition-colors hover:bg-[#D8B461]"
                      >
                        Collect Evidence
                      </button>
                    ) : (
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-xs font-medium text-emerald-400">
                          Logged in Evidence Vault
                        </span>
                        {selectedEvidence.requiresAnalysis &&
                          !caseState.analyzedEvidenceIds.includes(
                            selectedEvidence.id
                          ) && (
                            <button
                              onClick={onTravelToLab}
                              className="rounded-md bg-[#252D3F] px-3 py-1.5 text-xs font-medium text-[#C9A24D] hover:bg-[#2E384F] whitespace-nowrap shrink-0"
                            >
                              Analyze in Lab
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400">
            <span>
              Collected: {caseState.discoveredEvidenceIds.length}/
              {caseData.evidence.length}
            </span>
            <button
              onClick={onTravelToLab}
              className="font-medium text-[#C9A24D] hover:underline whitespace-nowrap shrink-0"
            >
              Open Forensic Lab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
