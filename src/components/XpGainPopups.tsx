import React from 'react';
import { Award, Sparkles, TrendingUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SkillTree } from '../types/game';

export interface XpPopupItem {
  id: string;
  xpAmount: number;
  skill: keyof SkillTree;
  reason: string;
  focusBonus?: number;
  leveledUpSkill?: { skill: keyof SkillTree; level: number };
  unlockedAbility?: string;
  promotedRank?: string;
  isSecretOrDeduction?: boolean;
}

const SKILL_DISPLAY_NAMES: Record<keyof SkillTree, string> = {
  observation: 'Observation',
  interrogation: 'Interrogation',
  forensics: 'Forensic Analysis',
  deduction: 'Logical Reasoning',
  digital: 'Digital Investigation',
};

interface XpGainPopupsProps {
  popups: XpPopupItem[];
  reducedMotion: boolean;
}

export const XpGainPopups: React.FC<XpGainPopupsProps> = ({
  popups,
  reducedMotion,
}) => {
  if (popups.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-28 right-4 z-40 flex w-full max-w-xs flex-col gap-2 sm:right-6"
    >
      <AnimatePresence initial={!reducedMotion}>
        {popups.map((item) => {
          const isMilestone = Boolean(
            item.leveledUpSkill || item.unlockedAbility || item.promotedRank
          );

          return (
            <motion.div
              key={item.id}
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.97 }}
              transition={{ duration: reducedMotion ? 0.05 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md ${
                isMilestone
                  ? 'border-[#C9A24D]/75 bg-[#191611]/95'
                  : item.isSecretOrDeduction
                  ? 'border-[#C9A24D]/50 bg-[#141923]/95'
                  : 'border-white/15 bg-[#121620]/95'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {isMilestone ? (
                    <Award className="h-4 w-4 text-[#C9A24D] shrink-0" />
                  ) : item.isSecretOrDeduction ? (
                    <Sparkles className="h-4 w-4 text-[#C9A24D] shrink-0" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                  <span className="truncate text-xs font-semibold text-white">
                    {item.reason}
                  </span>
                </div>
                <span className="font-mono-tabular text-xs font-bold text-[#C9A24D] whitespace-nowrap shrink-0">
                  +{item.xpAmount} XP
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                <span className="text-slate-300">
                  {SKILL_DISPLAY_NAMES[item.skill]}
                </span>
                {item.focusBonus && item.focusBonus > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular text-emerald-400">
                      +{item.focusBonus} Focus
                    </span>
                  </>
                )}
              </div>

              {isMilestone && (
                <div className="mt-2 border-t border-[#C9A24D]/25 pt-1.5 space-y-0.5 text-[11px]">
                  {item.leveledUpSkill && (
                    <p className="font-semibold text-[#C9A24D]">
                      {SKILL_DISPLAY_NAMES[item.leveledUpSkill.skill]} reached Level{' '}
                      {item.leveledUpSkill.level}
                    </p>
                  )}
                  {item.unlockedAbility && (
                    <p className="text-emerald-300">
                      Ability Unlocked: {item.unlockedAbility}
                    </p>
                  )}
                  {item.promotedRank && (
                    <p className="font-semibold text-white">
                      Rank Promoted: {item.promotedRank}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
