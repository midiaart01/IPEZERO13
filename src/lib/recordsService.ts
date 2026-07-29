import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { IPERecord, ShiftType } from '../types';

const LOCAL_STORAGE_KEY = 'ipe_records_data_v1';
const FIRESTORE_COLLECTION = 'ipe_records';

// Initial seed data used if local fallback or database reset is triggered
export function getInitialSeedData(): IPERecord[] {
  const today = new Date().toISOString().split('T')[0];
  
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
      f1_extratinho: 2.1,
      f2_extratinho: 1.9,
      pi_brassagem: 2,
      pi_adega: 2,
      pi_filtracao: 2,
      ivsScore: 17,
      piScore: 6,
      totalScore: 23,
      notes: 'Desempenho máximo no Turno D, destaque na filtração.'
    },
    {
      id: 'rec_seed_4',
      date: prevDay,
      shift: 'C',
      createdAt: new Date().toISOString(),
      sala1_ipe: -0.5,
      sala2_ipe: -0.5,
      extrato_agua_s1: 1.0,
      extrato_agua_s2: 1.0,
      ctf1_perda_pct: 1.0,
      ctf3_perda_pct: 1.0,
      ctf1_perda_hl: 40,
      ctf3_perda_hl: 40,
      ctf1_deslodamentos: 20,
      ctf3_deslodamentos: 20,
      centrifuga_brux_hl: 0.5,
      f01_perda_pct: -1.0,
      f02_perda_pct: -1.0,
      f1_perda_hl: 100,
      f2_perda_hl: 100,
      f1_extratinho: 1.5,
      f2_extratinho: 1.5,
      pi_brassagem: 0,
      pi_adega: 0,
      pi_filtracao: 0,
      ivsScore: 17,
      piScore: 0,
      totalScore: 17,
      notes: 'Todas as metas atingidas exatamente no limite.'
    },
    {
      id: 'rec_seed_5',
      date: prevDay2,
      shift: 'A',
      createdAt: new Date().toISOString(),
      sala1_ipe: -0.7,
      sala2_ipe: -0.6,
      extrato_agua_s1: 0.8,
      extrato_agua_s2: 0.8,
      ctf1_perda_pct: 0.8,
      ctf3_perda_pct: 0.9,
      ctf1_perda_hl: 35,
      ctf3_perda_hl: 36,
      ctf1_deslodamentos: 15,
      ctf3_deslodamentos: 17,
      centrifuga_brux_hl: 1.8,
      f01_perda_pct: -1.2,
      f02_perda_pct: -1.1,
      f1_perda_hl: 82,
      f2_perda_hl: 88,
      f1_extratinho: 1.7,
      f2_extratinho: 1.6,
      pi_brassagem: 1,
      pi_adega: 2,
      pi_filtracao: 1,
      ivsScore: 17,
      piScore: 4,
      totalScore: 21
    }
  ];
}

// Helper for local caching
function getLocalRecords(): IPERecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler localStorage:', err);
    return [];
  }
}

function saveLocalRecords(data: IPERecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
  }
}

/**
 * FETCH ALL RECORDS FROM FIRESTORE
 */
export async function fetchRecords(): Promise<IPERecord[]> {
  try {
    const colRef = collection(db, FIRESTORE_COLLECTION);
    const q = query(colRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // If Firestore is empty, seed it with initial records so everyone gets started with data
      const seeds = getInitialSeedData();
      for (const seed of seeds) {
        await setDoc(doc(db, FIRESTORE_COLLECTION, seed.id), seed);
      }
      saveLocalRecords(seeds);
      return seeds;
    }

    const records: IPERecord[] = snapshot.docs.map((d) => ({
      ...(d.data() as IPERecord),
      id: d.id,
    }));

    // Sort by date descending, then created_at / shift
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    saveLocalRecords(records);
    return records;
  } catch (error) {
    console.warn('Erro ao buscar dados do Firestore, usando fallback local:', error);
    // Wrap error logger if permission issue
    try {
      handleFirestoreError(error, OperationType.GET, FIRESTORE_COLLECTION);
    } catch {
      // continue to fallback
    }

    const localData = getLocalRecords();
    if (localData.length === 0) {
      const seeds = getInitialSeedData();
      saveLocalRecords(seeds);
      return seeds;
    }
    return localData;
  }
}

/**
 * CHECK IF A RECORD EXISTS FOR A GIVEN DATE + SHIFT
 */
export async function checkRecordExists(
  date: string,
  shift: ShiftType,
  excludeId?: string
): Promise<boolean> {
  const records = await fetchRecords();
  return records.some(
    (r) => r.date === date && r.shift === shift && r.id !== excludeId
  );
}

/**
 * SAVE A NEW RECORD TO FIRESTORE
 */
export async function saveRecord(recordData: Omit<IPERecord, 'id' | 'createdAt'>): Promise<IPERecord> {
  const newId = 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newRecord: IPERecord = {
    ...recordData,
    id: newId,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, newId);
    await setDoc(docRef, newRecord);
  } catch (error) {
    console.warn('Erro ao salvar no Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `${FIRESTORE_COLLECTION}/${newId}`);
    } catch {
      // continue to fallback
    }
  }

  // Update local cache
  const localList = getLocalRecords();
  const updatedList = [newRecord, ...localList];
  saveLocalRecords(updatedList);

  return newRecord;
}

export const createRecord = saveRecord;

/**
 * UPDATE EXISTING RECORD IN FIRESTORE
 */
export async function updateRecord(id: string, updatedFields: Partial<IPERecord>): Promise<IPERecord> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, id);
    await updateDoc(docRef, updatedFields);
  } catch (error) {
    console.warn('Erro ao atualizar no Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${FIRESTORE_COLLECTION}/${id}`);
    } catch {
      // continue to fallback
    }
  }

  // Update local cache
  const list = getLocalRecords();
  const index = list.findIndex((r) => r.id === id);
  let updatedRecord: IPERecord;

  if (index !== -1) {
    list[index] = {
      ...list[index],
      ...updatedFields,
      id,
    };
    updatedRecord = list[index];
    saveLocalRecords(list);
  } else {
    updatedRecord = {
      id,
      date: new Date().toISOString().split('T')[0],
      shift: 'A',
      ivsScore: 0,
      piScore: 0,
      totalScore: 0,
      ...updatedFields,
    } as IPERecord;
  }

  return updatedRecord;
}

/**
 * DELETE A RECORD FROM FIRESTORE
 */
export async function deleteRecord(id: string): Promise<void> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Erro ao deletar no Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, `${FIRESTORE_COLLECTION}/${id}`);
    } catch {
      // continue to fallback
    }
  }

  // Update local cache
  const list = getLocalRecords().filter((r) => r.id !== id);
  saveLocalRecords(list);
}

/**
 * RESET DATA IN FIRESTORE
 */
export async function resetRecords(): Promise<void> {
  const seedData = getInitialSeedData();

  try {
    // Delete existing documents in Firestore
    const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTION));
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, FIRESTORE_COLLECTION, d.id));
    }

    // Insert seeds
    for (const seed of seedData) {
      await setDoc(doc(db, FIRESTORE_COLLECTION, seed.id), seed);
    }
  } catch (error) {
    console.warn('Erro ao resetar dados no Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, FIRESTORE_COLLECTION);
    } catch {
      // continue to fallback
    }
  }

  saveLocalRecords(seedData);
}
