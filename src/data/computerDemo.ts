import { InterrogationStance, ScreenMode } from '../types/game';

export type DemoActionType =
  | 'NAVIGATE'
  | 'SCENE_COLLECT'
  | 'LAB_ANALYZE'
  | 'INTERROGATE_ASK'
  | 'INTERROGATE_PRESENT'
  | 'BOARD_SOLVE'
  | 'COMPLETE';

export interface ComputerDemoStep {
  id: string;
  stepNumber: number;
  title: string;
  commentary: string;
  screen: ScreenMode;
  durationMs: number;
  actionType: DemoActionType;
  hotspotId?: string;
  evidenceId?: string;
  suspectId?: string;
  dialogueId?: string;
  stance?: InterrogationStance;
  useIntuition?: boolean;
}

export const COMPUTER_DEMO_STEPS: ComputerDemoStep[] = [
  {
    id: 'demo_1_briefing',
    stepNumber: 1,
    title: 'Case Briefing in Detective Office',
    commentary:
      'The Computer Detective reviews Case 01: Arthur Vance was poisoned inside locked Suite 408 with a Red-Eye Card left behind.',
    screen: 'DETECTIVE_OFFICE',
    durationMs: 3600,
    actionType: 'NAVIGATE',
  },
  {
    id: 'demo_2_desk_card',
    stepNumber: 2,
    title: 'Inspecting Suite 408 · Red-Eye Card',
    commentary:
      'At the crime scene, the Computer inspects the Mahogany Desk, photographs the clue, and logs The Phantom’s calling card.',
    screen: 'CRIME_SCENE',
    durationMs: 3800,
    actionType: 'SCENE_COLLECT',
    hotspotId: 'hs_c1_desk',
    evidenceId: 'ev_c1_card',
  },
  {
    id: 'demo_3_glass',
    stepNumber: 3,
    title: 'Collecting Shattered Crystal Glass',
    commentary:
      'Next, it examines the shattered whiskey tumbler beside Vance’s armchair to check for fast-acting toxins.',
    screen: 'CRIME_SCENE',
    durationMs: 3600,
    actionType: 'SCENE_COLLECT',
    hotspotId: 'hs_c1_glass',
    evidenceId: 'ev_c1_glass',
  },
  {
    id: 'demo_4_uv_thread',
    stepNumber: 4,
    title: 'Detective’s Intuition & UV Transom Sweep',
    commentary:
      'Activating Detective’s Intuition and UV light reveals brass filings and a cobalt uniform thread snagged above the door.',
    screen: 'CRIME_SCENE',
    durationMs: 4200,
    actionType: 'SCENE_COLLECT',
    hotspotId: 'hs_c1_vent',
    evidenceId: 'ev_c1_thread',
    useIntuition: true,
  },
  {
    id: 'demo_5_keylog',
    stepNumber: 5,
    title: 'Retrieving Hotel Security Audit Log',
    commentary:
      'Downstairs at the security terminal, the Computer collects the encrypted Master Keycard Audit Log.',
    screen: 'CRIME_SCENE',
    durationMs: 3600,
    actionType: 'SCENE_COLLECT',
    hotspotId: 'hs_c1_terminal',
    evidenceId: 'ev_c1_keylog',
  },
  {
    id: 'demo_6_lab_keylog',
    stepNumber: 6,
    title: 'Forensic Lab · Decrypting Keycard Log',
    commentary:
      'In the Forensic Lab, decoding the terminal reveals Master Override Badge #02 entered Suite 408 at 22:08.',
    screen: 'FORENSIC_LAB',
    durationMs: 3800,
    actionType: 'LAB_ANALYZE',
    evidenceId: 'ev_c1_keylog',
  },
  {
    id: 'demo_7_lab_card',
    stepNumber: 7,
    title: 'Forensic Lab · Lifting Biometric Print',
    commentary:
      'Fingerprint alignment on the Black Card matches Night Security Guard Julian Mercer’s torn right index print.',
    screen: 'FORENSIC_LAB',
    durationMs: 3800,
    actionType: 'LAB_ANALYZE',
    evidenceId: 'ev_c1_card',
  },
  {
    id: 'demo_8_ask_elena',
    stepNumber: 8,
    title: 'Interrogation · Empathetic Inquiry with Witness',
    commentary:
      'Using an Empathetic stance with assistant Elena Rostova earns trust—she reveals Mercer carried ice upstairs at 22:05.',
    screen: 'INTERROGATION',
    durationMs: 4200,
    actionType: 'INTERROGATE_ASK',
    suspectId: 'sus_c1_elena',
    dialogueId: 'dlg_elena_1',
    stance: 'empathetic',
  },
  {
    id: 'demo_9_ask_mercer',
    stepNumber: 9,
    title: 'Interrogation · Pinning Down Mercer’s Alibi',
    commentary:
      'Questioning Julian Mercer gets his firm alibi on record: he claims he never went near Floor 4 after 21:00.',
    screen: 'INTERROGATION',
    durationMs: 4000,
    actionType: 'INTERROGATE_ASK',
    suspectId: 'sus_c1_mercer',
    dialogueId: 'dlg_mercer_1',
    stance: 'balanced',
  },
  {
    id: 'demo_10_contra_keylog',
    stepNumber: 10,
    title: 'Contradiction #1 · Shattering the Garage Alibi',
    commentary:
      'Presenting the verified Keycard Audit Log exposes Mercer’s lie—Override #02 opened Suite 408 while cameras looped.',
    screen: 'INTERROGATION',
    durationMs: 4400,
    actionType: 'INTERROGATE_PRESENT',
    suspectId: 'sus_c1_mercer',
    evidenceId: 'ev_c1_keylog',
  },
  {
    id: 'demo_11_contra_thread',
    stepNumber: 11,
    title: 'Contradiction #2 · Exposing the Locked-Room Trick',
    commentary:
      'Confronting Mercer with the Cobalt Uniform Thread proves he slid the interior chain shut through the transom vent.',
    screen: 'INTERROGATION',
    durationMs: 4400,
    actionType: 'INTERROGATE_PRESENT',
    suspectId: 'sus_c1_mercer',
    evidenceId: 'ev_c1_thread',
  },
  {
    id: 'demo_12_board',
    stepNumber: 12,
    title: 'Investigation Board & Chronological Timeline',
    commentary:
      'The Computer links key deduction threads on the corkboard and verifies the 21:15–22:18 crime timeline.',
    screen: 'BOARD_AND_TIMELINE',
    durationMs: 4200,
    actionType: 'BOARD_SOLVE',
  },
  {
    id: 'demo_13_ready',
    stepNumber: 13,
    title: 'Demo Complete · Ready to Play',
    commentary:
      'The full Case 01 evidence chain is assembled! Start a fresh investigation to solve Ravenwood yourself, or take over and file the arrest warrant.',
    screen: 'CASE_FILE',
    durationMs: 0,
    actionType: 'COMPLETE',
  },
];
