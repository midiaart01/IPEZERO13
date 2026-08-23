import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from './firebase';
import { IPERecord, ShiftType } from '../types';

const LOCAL_STORAGE_KEY = 'ipe_records_data_v2';
const FIRESTORE_COLLECTION = 'ipe_records';

/**
 * Remove undefined values to prevent Firestore setDoc/updateDoc errors
 */
function sanitizeObject<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

// Helper for local caching (strictly caches real user data, NEVER generates mock data)
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
 * SUBSCRIBE TO REALTIME FIRESTORE UPDATES
 * Strictly reads user-created data. Never injects seeds or fictitious records.
 */
export function subscribeToRecords(onUpdate: (records: IPERecord[]) => void): () => void {
  const colRef = collection(db, FIRESTORE_COLLECTION);

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        saveLocalRecords([]);
        onUpdate([]);
        return;
      }

      const records: IPERecord[] = snapshot.docs.map((d) => ({
        ...(d.data() as IPERecord),
        id: d.id,
      }));

      // Sort by date descending, then by shift
      records.sort((a, b) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.shift.localeCompare(b.shift);
      });

      saveLocalRecords(records);
      onUpdate(records);
    },
    (error) => {
      console.warn('Erro na sincronização Firestore em tempo real, usando cache local:', error);
      const localData = getLocalRecords();
      onUpdate(localData);
    }
  );

  return unsubscribe;
}

/**
 * FETCH ALL RECORDS FROM FIRESTORE ONCE
 * Strictly returns user data. Never generates mock or example records.
 */
export async function fetchRecords(): Promise<IPERecord[]> {
  try {
    const colRef = collection(db, FIRESTORE_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      saveLocalRecords([]);
      return [];
    }

    const records: IPERecord[] = snapshot.docs.map((d) => ({
      ...(d.data() as IPERecord),
      id: d.id,
    }));

    records.sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.shift.localeCompare(b.shift);
    });

    saveLocalRecords(records);
    return records;
  } catch (error) {
    console.warn('Erro ao buscar dados do Firestore, usando fallback local:', error);
    return getLocalRecords();
  }
}

/**
 * Generates a deterministic document ID for a given date and shift to guarantee uniqueness
 * Format: date_shift (e.g. 2026-08-22_A)
 */
export function getRecordDocId(date: string, shift: ShiftType): string {
  return `${date.trim()}_${shift.trim().toUpperCase()}`;
}

/**
 * CHECK IF A RECORD EXISTS FOR A GIVEN DATE + SHIFT
 */
export async function checkRecordExists(
  date: string,
  shift: ShiftType,
  excludeId?: string
): Promise<boolean> {
  const targetId = getRecordDocId(date, shift);
  if (excludeId && excludeId === targetId) {
    return false;
  }

  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, targetId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.id !== excludeId;
    }
  } catch (e) {
    console.warn('Verificação via getDoc falhou, verificando cache local:', e);
  }

  const records = await fetchRecords();
  return records.some(
    (r) => r.date === date && r.shift === shift && r.id !== excludeId
  );
}

/**
 * SAVE A NEW RECORD TO FIRESTORE
 * Uses deterministic ID (${date}_${shift}) to eliminate accidental duplicates.
 * Includes complete audit tracking (createdAt, updatedAt, user email).
 */
export async function saveRecord(recordData: Omit<IPERecord, 'id' | 'createdAt'>): Promise<IPERecord> {
  const docId = getRecordDocId(recordData.date, recordData.shift);
  const now = new Date().toISOString();
  const userEmail = auth.currentUser?.email || 'operador_local';

  const newRecord: IPERecord = {
    ...recordData,
    id: docId,
    createdAt: now,
    updatedAt: now,
    createdBy: userEmail,
  };

  const cleanData = sanitizeObject(newRecord);

  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, docId);
    await setDoc(docRef, cleanData);
  } catch (error) {
    console.error('Erro ao salvar no Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `${FIRESTORE_COLLECTION}/${docId}`);
    } catch (e) {
      console.warn('Fallback local devido a erro:', e);
    }
  }

  // Update local cache
  const localList = getLocalRecords();
  const updatedList = [newRecord, ...localList.filter((r) => r.id !== docId)];
  saveLocalRecords(updatedList);

  return newRecord;
}

export const createRecord = saveRecord;

/**
 * UPDATE EXISTING RECORD IN FIRESTORE
 * Preserves initial creation metadata and adds audit trace.
 */
export async function updateRecord(id: string, updatedFields: Partial<IPERecord>): Promise<IPERecord> {
  const now = new Date().toISOString();
  const userEmail = auth.currentUser?.email || 'operador_local';

  const fieldsToUpdate = {
    ...updatedFields,
    updatedAt: now,
    updatedBy: userEmail,
  };

  const cleanFields = sanitizeObject(fieldsToUpdate);

  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, id);
    await updateDoc(docRef, cleanFields);
  } catch (error) {
    console.error('Erro ao atualizar no Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${FIRESTORE_COLLECTION}/${id}`);
    } catch (e) {
      console.warn('Fallback local devido a erro:', e);
    }
  }

  // Update local cache
  const list = getLocalRecords();
  const index = list.findIndex((r) => r.id === id);
  let updatedRecord: IPERecord;

  if (index !== -1) {
    list[index] = {
      ...list[index],
      ...fieldsToUpdate,
      id,
    };
    updatedRecord = list[index];
    saveLocalRecords(list);
  } else {
    // If not in local cache, re-fetch actual record
    const records = await fetchRecords();
    const found = records.find(r => r.id === id);
    updatedRecord = found || ({ id, ...fieldsToUpdate } as IPERecord);
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
    console.error('Erro ao deletar no Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, `${FIRESTORE_COLLECTION}/${id}`);
    } catch (e) {
      console.warn('Fallback local devido a erro:', e);
    }
  }

  // Update local cache
  const list = getLocalRecords().filter((r) => r.id !== id);
  saveLocalRecords(list);
}

/**
 * PURGE ALL RECORDS IN FIRESTORE (Clear database completely without inserting mock data)
 */
export async function clearAllRecords(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTION));
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, FIRESTORE_COLLECTION, d.id));
    }
  } catch (error) {
    console.error('Erro ao limpar dados no Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, FIRESTORE_COLLECTION);
    } catch (e) {
      console.warn('Fallback local para limpeza:', e);
    }
  }

  saveLocalRecords([]);
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  localStorage.removeItem('ipe_records_data_v1');
}
