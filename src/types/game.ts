export type ScreenMode =
  | 'MAIN_MENU'
  | 'DETECTIVE_OFFICE'
  | 'CRIME_SCENE'
  | 'INTERROGATION'
  | 'FORENSIC_LAB'
  | 'BOARD_AND_TIMELINE'
  | 'CASE_FILE'
  | 'ARCHIVES'
  | 'PROFILE'
  | 'LEADERBOARD'
  | 'SETTINGS'
  | 'CREDITS'
  | 'CASE_OUTCOME'
  | 'FINAL_ENDING';

export type EvidenceCategory = 'Physical' | 'Digital' | 'Documentary' | 'Forensic';

export type ImportanceLevel = 'Critical' | 'Supporting' | 'Secret' | 'Misleading';

export type PuzzleType =
  | 'fingerprint'
  | 'dna'
  | 'password'
  | 'safe'
  | 'cipher'
  | 'cctv'
  | 'audio'
  | 'document'
  | 'photo_uv';

export type SuspectEmotion = 'calm' | 'nervous' | 'defensive' | 'angry' | 'cooperative';

export type LinkRelationType = 'motive' | 'contradiction' | 'alibi' | 'connection';

export type DifficultyLevel = 'Detective' | 'Veteran' | 'Mastermind';

export type EndingType =
  | 'THE_TRUTH_REVEALED'
  | 'THE_WRONG_VERDICT'
  | 'THE_PERFECT_CRIME'
  | 'THE_RED_EYE_COVENANT';

export type InterrogationStance = 'empathetic' | 'balanced' | 'aggressive';

export type ConductStyle = 'Empathetic' | 'Balanced' | 'Aggressive';

export interface ConductMetrics {
  empatheticChoices: number;
  aggressiveChoices: number;
  byTheBookChoices: number;
}

export interface SkillTree {
  observation: number;
  interrogation: number;
  forensics: number;
  deduction: number;
  digital: number;
}

export interface EvidenceItem {
  id: string;
  caseId: string;
  name: string;
  category: EvidenceCategory;
  importance: ImportanceLevel;
  description: string;
  discoveryLocation: string;
  collectionTime?: string;
  relatedSuspectIds: string[];
  requiresAnalysis: boolean;
  analyzed: boolean;
  analysisResult?: string;
  puzzleType?: PuzzleType;
  puzzlePrompt?: string;
  puzzleData?: Record<string, unknown>;
  photographed?: boolean;
  isHidden?: boolean;
}

export interface SceneHotspot {
  id: string;
  label: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  requiresUV?: boolean;
  requiresZoom?: boolean;
  narrativeText: string;
  evidenceId?: string;
  photographicClue?: string;
  isEnvironmentalOnly?: boolean;
}

export interface CrimeSceneLocation {
  id: string;
  name: string;
  subtitle: string;
  imageUrl: string;
  ambientMood: string;
  hotspots: SceneHotspot[];
}

export interface DialogueOption {
  id: string;
  label: string;
  requiredEvidenceId?: string;
  requiresAnalyzed?: boolean;
  requiresDecisionFlag?: string;
  response: string;
  emotionAfter: SuspectEmotion;
  trustDelta: number;
  pressureDelta: number;
  unlocksEvidenceId?: string;
  unlocksTimelineEventId?: string;
  unlocksNote?: string;
  once?: boolean;
}

export interface EvidenceContradiction {
  evidenceId: string;
  mustBeAnalyzed: boolean;
  statementClaim: string;
  rebuttalDialogue: string;
  suspectReaction: string;
  emotionAfter: SuspectEmotion;
  pressureDelta: number;
  trustDelta: number;
  unlocksTimelineEventId?: string;
  unlocksNote?: string;
  xpReward: number;
}

export interface PortraitProfile {
  skinTone: string;
  hairColor: string;
  hairStyle: 'slick' | 'bob' | 'parted' | 'silver' | 'wavy' | 'short';
  coatColor: string;
  accentColor: string;
  glasses?: boolean;
  facialHair?: 'mustache' | 'stubble' | 'none';
  scar?: boolean;
}

export interface SuspectProfile {
  id: string;
  caseId: string;
  name: string;
  age: number;
  occupation: string;
  background: string;
  relationshipToVictim: string;
  possibleMotive: string;
  alibi: string;
  secrets: string;
  personality: string;
  isGuilty: boolean;
  isAccomplice?: boolean;
  initialEmotion: SuspectEmotion;
  greeting: string;
  portrait: PortraitProfile;
  dialogueOptions: DialogueOption[];
  contradictions: EvidenceContradiction[];
  genericRejection: string;
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  timeLabel: string;
  sortMinutes: number;
  title: string;
  description: string;
  source: 'Victim' | 'Suspect' | 'CCTV' | 'Phone' | 'Forensics' | 'Witness';
  relatedSuspectId?: string;
  isContradiction?: boolean;
  contradictsSuspectId?: string;
  unlockedByDefault?: boolean;
  requiredEvidenceId?: string;
}

export interface BoardConnection {
  id: string;
  fromId: string;
  toId: string;
  relation: LinkRelationType;
}

export interface DeductionRule {
  id: string;
  label: string;
  nodeA: string;
  nodeB: string;
  requiredEvidenceId?: string;
}

export interface CaseDecision {
  id: string;
  prompt: string;
  context: string;
  options: {
    id: string;
    label: string;
    consequenceSummary: string;
    flag: string;
    reputationDelta: number;
    unlocksSecretHint?: boolean;
  }[];
}

export interface CaseData {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  locationName: string;
  dateTime: string;
  briefing: string;
  victim: {
    name: string;
    age: number;
    occupation: string;
    causeOfDeath: string;
    estimatedTimeOfDeath: string;
    notes: string;
  };
  locations: CrimeSceneLocation[];
  evidence: EvidenceItem[];
  suspects: SuspectProfile[];
  timelineEvents: TimelineEvent[];
  deductionRules: DeductionRule[];
  requiredTimelineIds: string[];
  correctCulpritId: string;
  keyContradictionEvidenceIds: string[];
  postCaseDecision: CaseDecision;
  phoneCallTip: {
    caller: string;
    transcript: string;
    hintText: string;
  };
  newspaperSolvedHeadline: string;
  newspaperSolvedBody: string;
  newspaperWrongHeadline: string;
  newspaperWrongBody: string;
}

export type JournalCategory = 'observation' | 'suspect_quirk' | 'theory';

export interface JournalEntry {
  id: string;
  category: JournalCategory;
  suspectId?: string;
  title: string;
  content: string;
  createdAt: string;
  pinned?: boolean;
}

export interface TranscriptEntry {
  id: string;
  suspectId: string;
  suspectName: string;
  speaker: string;
  text: string;
  tone: 'suspect' | 'detective' | 'contradiction' | 'system';
  kind: 'greeting' | 'question' | 'answer' | 'evidence_check' | 'contradiction' | 'system';
  stance?: InterrogationStance;
  questionLabel?: string;
  evidenceId?: string;
  evidenceName?: string;
  timestamp: string;
}

export interface CaseProgressState {
  caseId: string;
  status: 'locked' | 'active' | 'solved_truth' | 'solved_wrong';
  discoveredEvidenceIds: string[];
  analyzedEvidenceIds: string[];
  photographedHotspotIds: string[];
  inspectedHotspotIds: string[];
  askedDialogueIds: Record<string, string[]>;
  foundContradictions: Record<string, string[]>;
  suspectTrust: Record<string, number>;
  suspectPressure: Record<string, number>;
  suspectEmotions: Record<string, SuspectEmotion>;
  unlockedTimelineIds: string[];
  orderedTimelineIds: string[];
  timelineVerified: boolean;
  boardConnections: BoardConnection[];
  boardPositions: Record<string, { x: number; y: number }>;
  playerNotes: string;
  journalEntries: JournalEntry[];
  interrogationTranscripts?: Record<string, TranscriptEntry[]>;
  flaggedTranscriptIds?: string[];
  decisionFlagChosen?: string;
  accusedSuspectId?: string;
  phoneCallHeard?: boolean;
  elapsedSeconds?: number;
  speedBonusXp?: number;
  speedTier?: 'Lightning' | 'Swift' | 'On Time' | 'Overtime';
}

export interface AiMusicScore {
  title: string;
  bpm: number;
  keySignature: string;
  instrumentStyle: 'rhodes_noir' | 'muted_brass' | 'vibraphone_mist' | 'cello_pulse' | string;
  bassLine: number[];
  chords: number[][];
  melody: number[];
}

export type AppLanguage = 'en' | 'es' | 'fr' | 'de';

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  musicMuted: boolean;
  sfxMuted: boolean;
  aiMusicEnabled: boolean;
  notificationsEnabled: boolean;
  browserNotifications: boolean;
  notificationSound: boolean;
  language: AppLanguage;
  textSize: 'Standard' | 'Large';
  reducedMotion: boolean;
  autoSaveEnabled: boolean;
  pressureTimerEnabled: boolean;
  graphicsQuality: 'High' | 'Balanced';
  difficulty: DifficultyLevel;
  subtitles: boolean;
  keyboardHints: boolean;
}

export interface GameSaveState {
  version: number;
  started: boolean;
  activeCaseId: string;
  currentScreen: ScreenMode;
  detectiveRank: string;
  xp: number;
  reputation: number;
  focus: number;
  conduct: ConductMetrics;
  usedSupportActions: Record<string, string[]>;
  skills: SkillTree;
  unlockedAbilities: string[];
  decisionFlags: string[];
  caseStates: Record<string, CaseProgressState>;
  settings: GameSettings;
  finalEnding?: EndingType;
  lastSavedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  caseId: string;
  caseNumber: number;
  caseTitle: string;
  detectiveRank: string;
  difficulty: DifficultyLevel;
  solvedTruth: boolean;
  score: number;
  speedSeconds: number;
  speedRating: string;
  accuracyPercent: number;
  reputationAtClose: number;
  conductStyle: ConductStyle;
  recordedAt: string;
}
