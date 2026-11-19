import React from 'react';
import { MonitorPlay, Pause, Play, RotateCcw, SkipForward, UserCheck, X } from 'lucide-react';
import { ComputerDemoStep } from '../data/computerDemo';

interface ComputerDemoBarProps {
  currentStep: ComputerDemoStep;
  stepIndex: number;
  totalSteps: number;
  paused: boolean;
  speed: 1 | 2;
  completed: boolean;
  hasPreviousSave: boolean;
  onTogglePause: () => void;
  onNextStep: () => void;
  onToggleSpeed: () => void;
  onReplayDemo: () => void;
  onPlayFresh: () => void;
  onTakeOver: () => void;
  onExitDemo: () => void;
}

export const ComputerDemoBar: React.FC<ComputerDemoBarProps> = ({
  currentStep,
  stepIndex,
  totalSteps,
  paused,
  speed,
  completed,
  hasPreviousSave,
  onTogglePause,
  onNextStep,
  onToggleSpeed,
  onReplayDemo,
  onPlayFresh,
  onTakeOver,
  onExitDemo,
}) => {
  return (
    <div className="mx-auto mt-3 w-full max-w-[1380px] px-4 sm:px-6">
      <div className="rounded-xl border border-[#C9A24D]/45 bg-[#131823] px-4 py-3 shadow-lg">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#C9A24D]">
                <MonitorPlay className="h-4 w-4 shrink-0" />
                <span>Computer Mode (Demo)</span>
              </span>
              <span aria-hidden="true" className="text-slate-500">
                ·
              </span>
              <span className="font-mono-tabular text-slate-300">
                Step {String(stepIndex + 1).padStart(2, '0')} /{' '}
                {String(totalSteps).padStart(2, '0')}
              </span>
              <span aria-hidden="true" className="text-slate-500">
                ·
              </span>
              <span className="font-medium text-white">{currentStep.title}</span>
              {paused && !completed && (
                <>
                  <span aria-hidden="true" className="text-slate-500">
                    ·
                  </span>
                  <span className="text-amber-300 font-medium">Paused</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentStep.commentary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!completed ? (
              <>
                <button
                  onClick={onTogglePause}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#181F2D] px-3 py-1.5 text-xs font-medium text-white hover:border-[#C9A24D] transition-colors whitespace-nowrap shrink-0"
                >
                  {paused ? (
                    <>
                      <Play className="h-3.5 w-3.5 text-[#C9A24D]" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="h-3.5 w-3.5 text-[#C9A24D]" />
                      <span>Pause</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onNextStep}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#181F2D] px-3 py-1.5 text-xs font-medium text-white hover:border-[#C9A24D] transition-colors whitespace-nowrap shrink-0"
                >
                  <SkipForward className="h-3.5 w-3.5 text-[#C9A24D]" />
                  <span>Next Step</span>
                </button>

                <button
                  onClick={onToggleSpeed}
                  title="Toggle demo playback speed"
                  className="rounded-lg border border-white/15 bg-[#181F2D] px-2.5 py-1.5 font-mono-tabular text-xs font-semibold text-[#C9A24D] hover:border-[#C9A24D] transition-colors whitespace-nowrap shrink-0"
                >
                  {speed}x
                </button>
              </>
            ) : (
              <button
                onClick={onReplayDemo}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#181F2D] px-3 py-1.5 text-xs font-medium text-white hover:border-[#C9A24D] transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5 text-[#C9A24D]" />
                <span>Replay Demo</span>
              </button>
            )}

            <button
              onClick={onTakeOver}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9A24D]/50 bg-[#1B2232] px-3 py-1.5 text-xs font-semibold text-[#F2D58B] hover:border-[#C9A24D] transition-colors whitespace-nowrap shrink-0"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Take Over Here</span>
            </button>

            <button
              onClick={onPlayFresh}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#C9A24D] px-3.5 py-1.5 text-xs font-semibold text-[#0B0D12] hover:bg-[#D8B461] transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Play Myself (New Case)</span>
            </button>

            <button
              onClick={onExitDemo}
              title={
                hasPreviousSave
                  ? 'Exit demo and restore your previous campaign save'
                  : 'Exit demo and return to Main Menu'
              }
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-300 hover:border-[#9E2A3B] hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              <span>{hasPreviousSave ? 'Restore Save' : 'Exit'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
