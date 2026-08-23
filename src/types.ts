export type ShiftType = 'A' | 'B' | 'C' | 'D';

export interface IPERecord {
  id: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;

  // Brassagem
  sala1_ipe: number | null; // Meta: < -0.5
  sala2_ipe: number | null; // Meta: < -0.5
  extrato_agua_s1: number | null; // Meta: < 1
  extrato_agua_s2: number | null; // Meta: < 1

  // Adega
  ctf1_perda_pct: number | null; // Meta: < 1
  ctf3_perda_pct: number | null; // Meta: < 1
  ctf1_perda_hl: number | null; // Meta: < 40
  ctf3_perda_hl: number | null; // Meta: < 40
  ctf1_deslodamentos: number | null; // Meta: < 20
  ctf3_deslodamentos: number | null; // Meta: < 20

  // Adega Plus
  centrifuga_brux_hl: number | null; // Meta: > 0

  // Filtração
  f01_perda_pct: number | null; // Meta: < -1
  f02_perda_pct: number | null; // Meta: < -1
  f1_perda_hl: number | null; // Meta: < 100
  f2_perda_hl: number | null; // Meta: < 100
  f1_extratinho: number | null; // Meta: > 1.5
  f2_extratinho: number | null; // Meta: > 1.5

  // Problem Solving
  pi_brassagem: number;
  pi_adega: number;
  pi_filtracao: number;

  // Totais Calculados
  ivsScore: number; // Max 17
  piScore: number;
  totalScore: number;
  notes?: string;
}

export interface IVMetaInfo {
  key: keyof IPERecord;
  label: string;
  section: 'BRASSAGEM' | 'ADEGA' | 'ADEGA PLUS' | 'FILTRAÇÃO';
  metaLabel: string;
  unit: string;
  check: (val: number | null) => boolean;
}

export const IV_METAS: IVMetaInfo[] = [
  // BRASSAGEM
  {
    key: 'sala1_ipe',
    label: 'Sala 01 IPE (%)',
    section: 'BRASSAGEM',
    metaLabel: '<= -0,5%',
    unit: '%',
    check: (val) => val !== null && val <= -0.5,
  },
  {
    key: 'sala2_ipe',
    label: 'Sala 02 IPE (%)',
    section: 'BRASSAGEM',
    metaLabel: '<= -0,5%',
    unit: '%',
    check: (val) => val !== null && val <= -0.5,
  },
  {
    key: 'extrato_agua_s1',
    label: 'Extrato Última Água S1 (°P)',
    section: 'BRASSAGEM',
    metaLabel: '<= 1°P',
    unit: '°P',
    check: (val) => val !== null && val <= 1,
  },
  {
    key: 'extrato_agua_s2',
    label: 'Extrato Última Água S2 (°P)',
    section: 'BRASSAGEM',
    metaLabel: '<= 1°P',
    unit: '°P',
    check: (val) => val !== null && val <= 1,
  },

  // ADEGA
  {
    key: 'ctf1_perda_pct',
    label: 'CTF 01 Perda (%)',
    section: 'ADEGA',
    metaLabel: '<= 1%',
    unit: '%',
    check: (val) => val !== null && val <= 1,
  },
  {
    key: 'ctf3_perda_pct',
    label: 'CTF 03 Perda (%)',
    section: 'ADEGA',
    metaLabel: '<= 1%',
    unit: '%',
    check: (val) => val !== null && val <= 1,
  },
  {
    key: 'ctf1_perda_hl',
    label: 'CTF 01 Perda (hL)',
    section: 'ADEGA',
    metaLabel: '<= 40 hL',
    unit: 'hL',
    check: (val) => val !== null && val <= 40,
  },
  {
    key: 'ctf3_perda_hl',
    label: 'CTF 03 Perda (hL)',
    section: 'ADEGA',
    metaLabel: '<= 40 hL',
    unit: 'hL',
    check: (val) => val !== null && val <= 40,
  },
  {
    key: 'ctf1_deslodamentos',
    label: 'CTF 01 Nº Deslodamentos',
    section: 'ADEGA',
    metaLabel: '<= 20',
    unit: '',
    check: (val) => val !== null && val <= 20,
  },
  {
    key: 'ctf3_deslodamentos',
    label: 'CTF 03 Nº Deslodamentos',
    section: 'ADEGA',
    metaLabel: '<= 20',
    unit: '',
    check: (val) => val !== null && val <= 20,
  },

  // ADEGA PLUS
  {
    key: 'centrifuga_brux_hl',
    label: 'Centrífuga Brux - Volume Recuperado (hL)',
    section: 'ADEGA PLUS',
    metaLabel: '> 0 hL',
    unit: 'hL',
    check: (val) => val !== null && val > 0,
  },

  // FILTRAÇÃO
  {
    key: 'f01_perda_pct',
    label: 'F01 Perda (%)',
    section: 'FILTRAÇÃO',
    metaLabel: '<= -1%',
    unit: '%',
    check: (val) => val !== null && val <= -1,
  },
  {
    key: 'f02_perda_pct',
    label: 'F02 Perda (%)',
    section: 'FILTRAÇÃO',
    metaLabel: '<= -1%',
    unit: '%',
    check: (val) => val !== null && val <= -1,
  },
  {
    key: 'f1_perda_hl',
    label: 'F1 Perda (hL)',
    section: 'FILTRAÇÃO',
    metaLabel: '<= 100 hL',
    unit: 'hL',
    check: (val) => val !== null && val <= 100,
  },
  {
    key: 'f2_perda_hl',
    label: 'F2 Perda (hL)',
    section: 'FILTRAÇÃO',
    metaLabel: '<= 100 hL',
    unit: 'hL',
    check: (val) => val !== null && val <= 100,
  },
  {
    key: 'f1_extratinho',
    label: 'F1 Extratinho',
    section: 'FILTRAÇÃO',
    metaLabel: '>= 1,5%',
    unit: '%',
    check: (val) => val !== null && val >= 1.5,
  },
  {
    key: 'f2_extratinho',
    label: 'F2 Extratinho',
    section: 'FILTRAÇÃO',
    metaLabel: '>= 1,5%',
    unit: '%',
    check: (val) => val !== null && val >= 1.5,
  },
];

export interface RankingShiftItem {
  shift: ShiftType;
  totalScore: number;
  totalEntries: number;
  averageScore: number;
  totalIVs: number;
  totalPIs: number;
  position: number;
}

export interface DashboardStats {
  leaderShift: ShiftType | '-';
  leaderScore: number;
  totalEntriesMonth: number;
  avgScoreMonth: number;
  maxDailyScoreMonth: number;
}
