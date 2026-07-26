import { supabase, isSupabaseConfigured } from './supabase';
import { IPERecord, ShiftType } from '../types';

const LOCAL_STORAGE_KEY = 'ipe_records_data_v1';

// Initial seed data used if local fallback or database reset is triggered
export function getInitialSeedData(): IPERecord[] {
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate relative dates for initial seed
  const d1 = new Date();
  d1.setDate(d1.getDate() - 1);
  const yesterday = d1.toISOString().split('T')[0];

  const d2 = new Date();
  d2.setDate(d2.getDate() - 2);
  const prevDay = d2.toISOString().split('T')[0];

  const d3 = new Date();
  d3.setDate(d3.getDate() - 3);
  const prevDay2 = d3.toISOString().split('T')[0];

  return [
    {
      id: 'rec_seed_1',
      date: today,
      shift: 'A',
      createdAt: new Date().toISOString(),
      sala1_ipe: -0.8,
      sala2_ipe: -0.7,
      extrato_agua_s1: 0.8,
      extrato_agua_s2: 0.9,
      ctf1_perda_pct: 0.8,
      ctf3_perda_pct: 0.7,
      ctf1_perda_hl: 32,
      ctf3_perda_hl: 35,
      ctf1_deslodamentos: 14,
      ctf3_deslodamentos: 16,
      centrifuga_brux_hl: 1.5,
      f01_perda_pct: -1.4,
      f02_perda_pct: -1.2,
      f1_perda_hl: 80,
      f2_perda_hl: 85,
      f1_extratinho: 1.8,
      f2_extratinho: 1.7,
      pi_brassagem: 2,
      pi_adega: 1,
      pi_filtracao: 1,
      ivsScore: 17,
      piScore: 4,
      totalScore: 21,
      notes: 'Turno excelente com total conformidade de IVs e resoluções ativas.'
    },
    {
      id: 'rec_seed_2',
      date: today,
      shift: 'B',
      createdAt: new Date().toISOString(),
      sala1_ipe: -0.6,
      sala2_ipe: -0.4,
      extrato_agua_s1: 0.7,
      extrato_agua_s2: 0.9,
      ctf1_perda_pct: 0.9,
      ctf3_perda_pct: 1.1,
      ctf1_perda_hl: 38,
      ctf3_perda_hl: 42,
      ctf1_deslodamentos: 18,
      ctf3_deslodamentos: 19,
      centrifuga_brux_hl: 2.0,
      f01_perda_pct: -1.1,
      f02_perda_pct: -0.8,
      f1_perda_hl: 90,
      f2_perda_hl: 95,
      f1_extratinho: 1.6,
      f2_extratinho: 1.4,
      pi_brassagem: 1,
      pi_adega: 1,
      pi_filtracao: 0,
      ivsScore: 12,
      piScore: 2,
      totalScore: 14
    },
    {
      id: 'rec_seed_3',
      date: yesterday,
      shift: 'D',
      createdAt: new Date().toISOString(),
      sala1_ipe: -0.9,
      sala2_ipe: -0.8,
      extrato_agua_s1: 0.6,
      extrato_agua_s2: 0.7,
      ctf1_perda_pct: 0.7,
      ctf3_perda_pct: 0.8,
      ctf1_perda_hl: 30,
      ctf3_perda_hl: 32,
      ctf1_deslodamentos: 12,
      ctf3_deslodamentos: 15,
      centrifuga_brux_hl: 3.2,
      f01_perda_pct: -1.5,
      f02_perda_pct: -1.3,
      f1_perda_hl: 75,
      f2_perda_hl: 78,
      f1_extratinho: 2.0,
      f2_extratinho: 1.9,
      pi_brassagem: 3,
      pi_adega: 2,
      pi_filtracao: 1,
      ivsScore: 17,
      piScore: 6,
      totalScore: 23
    },
    {
      id: 'rec_seed_4',
      date: yesterday,
      shift: 'C',
      createdAt: new Date().toISOString(),
      sala1_ipe: -0.7,
      sala2_ipe: -0.6,
      extrato_agua_s1: 0.8,
      extrato_agua_s2: 0.8,
      ctf1_perda_pct: 0.8,
      ctf3_perda_pct: 0.9,
      ctf1_perda_hl: 36,
      ctf3_perda_hl: 38,
      ctf1_deslodamentos: 15,
      ctf3_deslodamentos: 17,
      centrifuga_brux_hl: 1.0,
      f01_perda_pct: -1.2,
      f02_perda_pct: -1.1,
      f1_perda_hl: 88,
      f2_perda_hl: 92,
      f1_extratinho: 1.7,
      f2_extratinho: 1.6,
      pi_brassagem: 1,
      pi_adega: 0,
      pi_filtracao: 1,
      ivsScore: 17,
      piScore: 2,
      totalScore: 19
    },
    {
      id: 'rec_seed_5',
      date: prevDay,
      shift: 'A',
      createdAt: new Date().toISOString(),
      sala1_ipe: -0.75,
      sala2_ipe: -0.65,
      extrato_agua_s1: 0.75,
      extrato_agua_s2: 0.85,
      ctf1_perda_pct: 0.85,
      ctf3_perda_pct: 0.88,
      ctf1_perda_hl: 34,
      ctf3_perda_hl: 36,
      ctf1_deslodamentos: 13,
      ctf3_deslodamentos: 16,
      centrifuga_brux_hl: 2.1,
      f01_perda_pct: -1.3,
      f02_perda_pct: -1.25,
      f1_perda_hl: 82,
      f2_perda_hl: 86,
      f1_extratinho: 1.85,
      f2_extratinho: 1.75,
      pi_brassagem: 2,
      pi_adega: 1,
      pi_filtracao: 0,
      ivsScore: 17,
      piScore: 3,
      totalScore: 20
    },
    {
      id: 'rec_seed_6',
      date: prevDay2,
      shift: 'B',
      createdAt: new Date().toISOString(),
      sala1_ipe: -0.65,
      sala2_ipe: -0.55,
      extrato_agua_s1: 0.85,
      extrato_agua_s2: 0.95,
      ctf1_perda_pct: 0.92,
      ctf3_perda_pct: 0.95,
      ctf1_perda_hl: 37,
      ctf3_perda_hl: 39,
      ctf1_deslodamentos: 17,
      ctf3_deslodamentos: 18,
      centrifuga_brux_hl: 1.2,
      f01_perda_pct: -1.15,
      f02_perda_pct: -1.05,
      f1_perda_hl: 92,
      f2_perda_hl: 94,
      f1_extratinho: 1.62,
      f2_extratinho: 1.58,
      pi_brassagem: 0,
      pi_adega: 1,
      pi_filtracao: 1,
      ivsScore: 17,
      piScore: 2,
      totalScore: 19
    }
  ];
}

// LocalStorage Helper for offline / non-configured environment
function getLocalRecords(): IPERecord[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading localStorage:', e);
  }
  const initial = getInitialSeedData();
  saveLocalRecords(initial);
  return initial;
}

function saveLocalRecords(records: IPERecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Error writing to localStorage:', e);
  }
}

// Normalize record row from Supabase to IPERecord
function normalizeRecord(row: any): IPERecord {
  return {
    id: row.id,
    date: row.date,
    shift: row.shift as ShiftType,
    createdAt: row.createdAt || row.created_at || new Date().toISOString(),
    sala1_ipe: row.sala1_ipe ?? null,
    sala2_ipe: row.sala2_ipe ?? null,
    extrato_agua_s1: row.extrato_agua_s1 ?? null,
    extrato_agua_s2: row.extrato_agua_s2 ?? null,
    ctf1_perda_pct: row.ctf1_perda_pct ?? null,
    ctf3_perda_pct: row.ctf3_perda_pct ?? null,
    ctf1_perda_hl: row.ctf1_perda_hl ?? null,
    ctf3_perda_hl: row.ctf3_perda_hl ?? null,
    ctf1_deslodamentos: row.ctf1_deslodamentos ?? null,
    ctf3_deslodamentos: row.ctf3_deslodamentos ?? null,
    centrifuga_brux_hl: row.centrifuga_brux_hl ?? null,
    f01_perda_pct: row.f01_perda_pct ?? null,
    f02_perda_pct: row.f02_perda_pct ?? null,
    f1_perda_hl: row.f1_perda_hl ?? null,
    f2_perda_hl: row.f2_perda_hl ?? null,
    f1_extratinho: row.f1_extratinho ?? null,
    f2_extratinho: row.f2_extratinho ?? null,
    pi_brassagem: Number(row.pi_brassagem ?? 0),
    pi_adega: Number(row.pi_adega ?? 0),
    pi_filtracao: Number(row.pi_filtracao ?? 0),
    ivsScore: Number(row.ivsScore ?? row.ivs_score ?? 0),
    piScore: Number(row.piScore ?? row.pi_score ?? 0),
    totalScore: Number(row.totalScore ?? row.total_score ?? 0),
    notes: row.notes || undefined,
  };
}

// Map IPERecord to Supabase insert/update payload
function toSupabasePayload(record: Partial<IPERecord>): any {
  const payload: any = { ...record };
  // Ensure fields are explicitly set
  if (record.ivsScore !== undefined) payload.ivsScore = record.ivsScore;
  if (record.piScore !== undefined) payload.piScore = record.piScore;
  if (record.totalScore !== undefined) payload.totalScore = record.totalScore;
  if (record.createdAt !== undefined) payload.createdAt = record.createdAt;
  return payload;
}

/**
 * FETCH ALL RECORDS
 */
export async function fetchRecords(month?: string, shift?: string): Promise<IPERecord[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('records').select('*');

      if (month) {
        // Filter dates starting with YYYY-MM
        query = query.gte('date', `${month}-01`).lte('date', `${month}-31`);
      }

      if (shift && shift !== 'ALL') {
        query = query.eq('shift', shift);
      }

      query = query.order('date', { ascending: false }).order('createdAt', { ascending: false });

      const { data, error } = await query;

      if (!error && data) {
        return data.map(normalizeRecord);
      } else {
        console.warn('Supabase fetch error or table empty, using fallback:', error);
      }
    } catch (err) {
      console.error('Failed to query Supabase:', err);
    }
  }

  // Local fallback
  let list = getLocalRecords();
  if (month) {
    list = list.filter((r) => r.date.startsWith(month));
  }
  if (shift && shift !== 'ALL') {
    list = list.filter((r) => r.shift === shift);
  }
  return list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

/**
 * CHECK IF A RECORD ALREADY EXISTS FOR DATE + SHIFT
 */
export async function checkRecordExists(
  date: string,
  shift: string,
  excludeId?: string
): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('records').select('id').eq('date', date).eq('shift', shift);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data.length > 0;
      }
    } catch (err) {
      console.error('Supabase check error:', err);
    }
  }

  // Local check
  const list = getLocalRecords();
  return list.some((r) => r.date === date && r.shift === shift && r.id !== excludeId);
}

/**
 * CREATE NEW RECORD
 */
export async function createRecord(
  newRecordData: Omit<IPERecord, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): Promise<IPERecord> {
  const fullRecord: IPERecord = {
    ...newRecordData,
    id: newRecordData.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: newRecordData.createdAt || new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const payload = toSupabasePayload(fullRecord);
      const { data, error } = await supabase.from('records').insert([payload]).select();

      if (!error && data && data.length > 0) {
        return normalizeRecord(data[0]);
      } else {
        console.warn('Supabase insert error, falling back:', error);
      }
    } catch (err) {
      console.error('Supabase insert exception:', err);
    }
  }

  // Local save
  const list = getLocalRecords();
  const existingIdx = list.findIndex(r => r.date === fullRecord.date && r.shift === fullRecord.shift);
  if (existingIdx >= 0) {
    throw new Error('Já existe um lançamento para este turno nesta data.');
  }
  list.push(fullRecord);
  saveLocalRecords(list);
  return fullRecord;
}

/**
 * UPDATE EXISTING RECORD
 */
export async function updateRecord(id: string, updatedFields: Partial<IPERecord>): Promise<IPERecord> {
  if (isSupabaseConfigured) {
    try {
      const payload = toSupabasePayload(updatedFields);
      const { data, error } = await supabase
        .from('records')
        .update(payload)
        .eq('id', id)
        .select();

      if (!error && data && data.length > 0) {
        return normalizeRecord(data[0]);
      } else {
        console.warn('Supabase update error:', error);
      }
    } catch (err) {
      console.error('Supabase update exception:', err);
    }
  }

  // Local update
  const list = getLocalRecords();
  const index = list.findIndex((r) => r.id === id);
  if (index === -1) {
    throw new Error('Lançamento não encontrado.');
  }

  list[index] = {
    ...list[index],
    ...updatedFields,
    id,
  };
  saveLocalRecords(list);
  return list[index];
}

/**
 * DELETE A RECORD
 */
export async function deleteRecord(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('records').delete().eq('id', id);
      if (error) {
        console.warn('Supabase delete error:', error);
      }
    } catch (err) {
      console.error('Supabase delete exception:', err);
    }
  }

  // Always keep local state in sync
  const list = getLocalRecords().filter((r) => r.id !== id);
  saveLocalRecords(list);
}

/**
 * RESET DATA TO SEED
 */
export async function resetRecords(): Promise<void> {
  const seedData = getInitialSeedData();

  if (isSupabaseConfigured) {
    try {
      // Clear existing records
      await supabase.from('records').delete().neq('id', 'non_existent_id');

      // Insert seed records
      const payloads = seedData.map(toSupabasePayload);
      const { error } = await supabase.from('records').insert(payloads);

      if (error) {
        console.warn('Supabase seed reset error:', error);
      }
    } catch (err) {
      console.error('Supabase reset exception:', err);
    }
  }

  saveLocalRecords(seedData);
}
