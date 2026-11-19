import { AppLanguage } from '../types/game';

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
};

type TranslationKeys = {
  navOffice: string;
  navScene: string;
  navInterrogate: string;
  navLab: string;
  navBoard: string;
  accuseSuspect: string;
  caseFile: string;
  hint: string;
  save: string;
  saved: string;
  settings: string;
  menu: string;
  continueInvestigation: string;
  newInvestigation: string;
  caseArchives: string;
  detectiveProfile: string;
  credits: string;
  settingsTitle: string;
  back: string;
  travelToScene: string;
  activeBriefing: string;
  objectiveLabel: string;
  intuitionLabel: string;
  journal: string;
  leaderboard: string;
  computerDemo: string;
};

const TRANSLATIONS: Record<AppLanguage, TranslationKeys> = {
  en: {
    navOffice: 'Office',
    navScene: 'Crime Scene',
    navInterrogate: 'Interrogate',
    navLab: 'Forensic Lab',
    navBoard: 'Board & Timeline',
    accuseSuspect: 'Accuse Suspect',
    caseFile: 'Case File',
    hint: 'Hint',
    save: 'Save',
    saved: 'Saved',
    settings: 'Settings',
    menu: 'Menu',
    continueInvestigation: 'Continue Investigation',
    newInvestigation: 'New Investigation',
    caseArchives: 'Case Archives',
    detectiveProfile: 'Detective Profile',
    credits: 'Credits',
    settingsTitle: 'Settings & Console',
    back: 'Back',
    travelToScene: 'Travel to Crime Scene',
    activeBriefing: 'Active Briefing',
    objectiveLabel: 'Objective',
    intuitionLabel: 'Intuition',
    journal: 'Journal',
    leaderboard: 'Leaderboard',
    computerDemo: 'Computer Mode (Demo)',
  },
  es: {
    navOffice: 'Oficina',
    navScene: 'Escena del Crimen',
    navInterrogate: 'Interrogar',
    navLab: 'Laboratorio',
    navBoard: 'Tablero y Línea',
    accuseSuspect: 'Acusar Sospechoso',
    caseFile: 'Expediente',
    hint: 'Pista',
    save: 'Guardar',
    saved: 'Guardado',
    settings: 'Ajustes',
    menu: 'Menú',
    continueInvestigation: 'Continuar Investigación',
    newInvestigation: 'Nueva Investigación',
    caseArchives: 'Archivo de Casos',
    detectiveProfile: 'Perfil del Detective',
    credits: 'Créditos',
    settingsTitle: 'Ajustes y Consola',
    back: 'Volver',
    travelToScene: 'Ir a la Escena',
    activeBriefing: 'Informe Activo',
    objectiveLabel: 'Objetivo',
    intuitionLabel: 'Intuición',
    journal: 'Diario',
    leaderboard: 'Clasificación',
    computerDemo: 'Modo Computadora (Demo)',
  },
  fr: {
    navOffice: 'Bureau',
    navScene: 'Scène de Crime',
    navInterrogate: 'Interroger',
    navLab: 'Laboratoire',
    navBoard: 'Tableau & Chrono',
    accuseSuspect: 'Accuser',
    caseFile: 'Dossier',
    hint: 'Indice',
    save: 'Sauver',
    saved: 'Sauvé',
    settings: 'Paramètres',
    menu: 'Menu',
    continueInvestigation: 'Continuer l’Enquête',
    newInvestigation: 'Nouvelle Enquête',
    caseArchives: 'Archives',
    detectiveProfile: 'Profil du Détective',
    credits: 'Crédits',
    settingsTitle: 'Paramètres et Console',
    back: 'Retour',
    travelToScene: 'Aller sur les Lieux',
    activeBriefing: 'Briefing Actif',
    objectiveLabel: 'Objectif',
    intuitionLabel: 'Intuition',
    journal: 'Journal',
    leaderboard: 'Classement',
    computerDemo: 'Mode Ordinateur (Démo)',
  },
  de: {
    navOffice: 'Büro',
    navScene: 'Tatort',
    navInterrogate: 'Verhör',
    navLab: 'Forensik-Labor',
    navBoard: 'Tafel & Zeitachse',
    accuseSuspect: 'Anklagen',
    caseFile: 'Akte',
    hint: 'Hinweis',
    save: 'Speichern',
    saved: 'Gespeichert',
    settings: 'Einstellungen',
    menu: 'Menü',
    continueInvestigation: 'Ermittlung fortsetzen',
    newInvestigation: 'Neue Ermittlung',
    caseArchives: 'Fallarchiv',
    detectiveProfile: 'Detektivprofil',
    credits: 'Mitwirkende',
    settingsTitle: 'Einstellungen & Konsole',
    back: 'Zurück',
    travelToScene: 'Zum Tatort',
    activeBriefing: 'Aktives Briefing',
    objectiveLabel: 'Ziel',
    intuitionLabel: 'Intuition',
    journal: 'Tagebuch',
    leaderboard: 'Bestenliste',
    computerDemo: 'Computer-Modus (Demo)',
  },
};

export function t(lang: AppLanguage, key: keyof TranslationKeys): string {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key];
}
