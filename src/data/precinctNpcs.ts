import { ConductStyle, GameSaveState } from '../types/game';
import { getConductStyle, getRankTierIndex } from '../utils/gameState';

export type PrecinctSupportId =
  | 'street_canvas'
  | 'forensic_rush'
  | 'emergency_warrant'
  | 'ia_clearance';

export interface PoliceNpcBriefing {
  id: string;
  name: string;
  role: string;
  badgeOrUnit: string;
  stanceReaction: string;
  rankRemark: string;
  caseAdvice: string;
}

export interface PrecinctSupportOption {
  id: PrecinctSupportId;
  title: string;
  npcProvider: string;
  effectSummary: string;
  requirementLabel: string;
  unlocked: boolean;
  reputationCost: number;
}

export function getPoliceNpcDialogue(
  saveState: GameSaveState,
  caseNumber: number
): PoliceNpcBriefing[] {
  const style: ConductStyle = getConductStyle(saveState.conduct);
  const rankTier = getRankTierIndex(saveState.xp);
  const rep = saveState.reputation;

  // 1. Captain Arthur Ward (Precinct Commander)
  let wardReaction =
    '“Keep your file clean, Morgan. City Hall wants a conviction on the Phantom cases, not another press circus.”';
  if (rep < 45) {
    wardReaction =
      '“Internal Affairs has three memos on your conduct, Alex. One more sloppy move and I pull Badge #407 off the active desk.”';
  } else if (style === 'Aggressive') {
    wardReaction =
      '“Witnesses are complaining you rattle interrogation tables like it’s 1998. Effective for cracking lies—dangerous if you bruise the wrong donor.”';
  } else if (style === 'Empathetic' && rep >= 65) {
    wardReaction =
      '“Your restraint in the interview room is winning over the District Attorney’s office. People talk to you when they clam up around beat cops.”';
  } else if (rep >= 75) {
    wardReaction =
      '“With your standing in the department right now, whatever warrant you sign gets stamped before the ink dries.”';
  }

  const wardRank =
    rankTier >= 3
      ? `“At ${saveState.detectiveRank}, half the precinct listens to you before they listen to me.”`
      : rankTier >= 1
      ? `“You’ve earned your stripes as ${saveState.detectiveRank}. Don’t waste that leverage.”`
      : '“Prove you deserve the reopened case file before asking Brass for favors.”';

  // 2. Dr. Maya Lin (Chief Forensic Examiner)
  let linReaction =
    '“Bring me uncontaminated samples from the scene and I’ll give you an airtight chain of custody.”';
  if (style === 'Empathetic') {
    linReaction =
      '“Thank you for giving victims’ families space instead of barging through scenes. My lab team fast-tracked your trays in appreciation.”';
  } else if (style === 'Aggressive') {
    linReaction =
      '“Shouting at suspects won’t change blood chemistry, Detective. Bring hard trace evidence to my bench before making threats.”';
  }
  const linRank =
    rankTier >= 2
      ? '“Your forensic literacy has sharpened considerably—check my priority sweep desk anytime.”'
      : '“Analyze every raw clue in the Forensic Lab before confronting a suspect.”';

  // 3. Sgt. Marcus Hale (Street Desk & Patrol Liaison)
  let haleReaction =
    '“Patrol units are holding the perimeter. Tell us where you want extra eyes in Ravenwood.”';
  if (style === 'Aggressive') {
    haleReaction =
      '“Word around roll call is you don’t blink in interrogation. Tough cops like you get street informants talking—even if Brass hates the paperwork.”';
  } else if (style === 'Empathetic') {
    haleReaction =
      '“Local clerks and night-shift staff actually return my calls when they hear Detective Morgan is leading the inquiry.”';
  }
  const haleRank =
    rep < 45
      ? '“Keep your head down—Command flagged your requisition budget until Reputation recovers above 45.”'
      : `“Case 0${caseNumber} patrol logs are prepped whenever you authorize a Street Canvas.”`;

  return [
    {
      id: 'npc_ward',
      name: 'Capt. Arthur Ward',
      role: 'Precinct Commander',
      badgeOrUnit: 'Command · Floor 3',
      stanceReaction: wardReaction,
      rankRemark: wardRank,
      caseAdvice:
        rep >= 75
          ? 'High-Reputation Clearance: Full warrant access without departmental penalty.'
          : style === 'Aggressive'
          ? 'Aggressive Leverage: Can force Emergency Search Warrants despite Brass friction (-4 Rep).'
          : 'Build Reputation via accurate verdicts & disciplined questioning to unlock full Command backing.',
    },
    {
      id: 'npc_lin',
      name: 'Dr. Maya Lin',
      role: 'Chief Forensic Examiner',
      badgeOrUnit: 'Forensics Wing',
      stanceReaction: linReaction,
      rankRemark: linRank,
      caseAdvice:
        style === 'Empathetic'
          ? 'Empathetic Standing: Lab team prioritizes your trace requests (+Focus & Priority Lab Sweep).'
          : 'Requires Reputation 60+ or Senior Detective rank for Priority Forensics Sweep.',
    },
    {
      id: 'npc_hale',
      name: 'Sgt. Marcus Hale',
      role: 'Patrol & Street Desk',
      badgeOrUnit: 'Precinct Dispatch',
      stanceReaction: haleReaction,
      rankRemark: haleRank,
      caseAdvice:
        'Street Patrol Canvas compiles neighborhood sightings directly into your Case Notes & Focus.',
    },
  ];
}

export function getPrecinctSupportOptions(
  saveState: GameSaveState
): PrecinctSupportOption[] {
  const style = getConductStyle(saveState.conduct);
  const rankTier = getRankTierIndex(saveState.xp);
  const rep = saveState.reputation;

  const canCanvas = rep >= 35 || style === 'Empathetic';
  const canForensicRush =
    rep >= 60 || rankTier >= 1 || (style === 'Empathetic' && rep >= 50);
  const canWarrant = rep >= 75 || saveState.conduct.aggressiveChoices >= 3;
  const canIaClearance = rep >= 75 || rankTier >= 2;

  const aggressiveWarrantCost = rep >= 75 ? 0 : 4;

  return [
    {
      id: 'street_canvas',
      title: 'Street Patrol Canvas',
      npcProvider: 'Sgt. Marcus Hale',
      effectSummary:
        'Logs a verified patrol sighting lead into your Case Notes and restores +15 Focus (Empathetic style grants +25 Focus).',
      requirementLabel:
        rep >= 35 || style === 'Empathetic'
          ? 'Available (Active Standing or Empathetic Conduct)'
          : 'Requires Reputation 35+',
      unlocked: canCanvas,
      reputationCost: 0,
    },
    {
      id: 'forensic_rush',
      title: 'Priority Forensics Sweep',
      npcProvider: 'Dr. Maya Lin',
      effectSummary:
        'Auto-verifies one collected raw evidence item in the Lab (+20 Forensics XP & +20 Focus).',
      requirementLabel:
        'Requires Reputation 60+, Senior Detective+, or Empathetic (Rep 50+)',
      unlocked: canForensicRush,
      reputationCost: 0,
    },
    {
      id: 'emergency_warrant',
      title: 'Emergency Search & Wiretap Warrant',
      npcProvider: 'Capt. Arthur Ward',
      effectSummary:
        'Rattles all case suspects (+15 Interrogation Pressure) and grants +20 Focus.',
      requirementLabel:
        rep >= 75
          ? 'Clean Command Authorization (0 Rep Cost)'
          : 'Requires Rep 75+ OR 3+ Aggressive Inquiries (-4 Rep Cost)',
      unlocked: canWarrant,
      reputationCost: aggressiveWarrantCost,
    },
    {
      id: 'ia_clearance',
      title: 'Precinct Goodwill & Moral Backing',
      npcProvider: 'Command Liaison',
      effectSummary:
        'Boosts all case suspects’ Trust (+12) via official integrity backing and restores +25 Focus.',
      requirementLabel: 'Requires Lead Inspector+ Rank OR Reputation 75+',
      unlocked: canIaClearance,
      reputationCost: 0,
    },
  ];
}
