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
import { IPERecord, ShiftType, RECORD_FIELD_LABELS } from '../types';

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

export interface FieldModification {
  item: string;
  previousValue: string;
  currentValue: string;
}

/**
 * Detect differences between the original record and updated fields.
 * Returns only items that actually changed.
 */
export function detectRecordChanges(
  original: IPERecord,
  updated: Partial<IPERecord>
): FieldModification[] {
  const changes: FieldModification[] = [];
  const fieldKeys: (keyof IPERecord)[] = [
    'date',
    'shift',
    'sala1_ipe',
    'sala2_ipe',
    'extrato_agua_s1',
    'extrato_agua_s2',
    'ctf1_perda_pct',
    'ctf3_perda_pct',
    'ctf1_perda_hl',
    'ctf3_perda_hl',
    'ctf1_deslodamentos',
    'ctf3_deslodamentos',
    'centrifuga_brux_hl',
    'f01_perda_pct',
    'f02_perda_pct',
    'f1_perda_hl',
    'f2_perda_hl',
    'f1_extratinho',
    'f2_extratinho',
    'pi_brassagem',
    'pi_adega',
    'pi_filtracao',
    'notes',
  ];

  for (const key of fieldKeys) {
    if (!(key in updated)) continue;
    const oldVal = original[key];
    const newVal = updated[key];

    if (key === 'notes') {
      const oldStr = (oldVal as string || '').trim();
      const newStr = (newVal as string || '').trim();
      if (oldStr !== newStr) {
        changes.push({
          item: RECORD_FIELD_LABELS[key] || String(key),
          previousValue: oldStr || '(Vazio)',
          currentValue: newStr || '(Vazio)',
        });
      }
    } else if (
      typeof oldVal === 'number' ||
      typeof newVal === 'number' ||
      oldVal === null ||
      newVal === null ||
      oldVal === undefined ||
      newVal === undefined
    ) {
      const oldNum = oldVal === null || oldVal === undefined ? null : Number(oldVal);
      const newNum = newVal === null || newVal === undefined ? null : Number(newVal);
      if (oldNum !== newNum) {
        changes.push({
          item: RECORD_FIELD_LABELS[key] || String(key),
          previousValue: oldNum !== null ? String(oldNum) : '(Vazio)',
          currentValue: newNum !== null ? String(newNum) : '(Vazio)',
        });
      }
    } else {
      const oldStr = String(oldVal ?? '').trim();
      const newStr = String(newVal ?? '').trim();
      if (oldStr !== newStr) {
        changes.push({
          item: RECORD_FIELD_LABELS[key] || String(key),
          previousValue: oldStr || '(Vazio)',
          currentValue: newStr || '(Vazio)',
        });
      }
    }
  }

  return changes;
}

/**
 * UPDATE EXISTING RECORD IN FIRESTORE
 * Preserves initial creation metadata and adds full audit trace of the latest alteration.
 * Guarantees no automated or accidental changes.
 */
export async function updateRecord(
  id: string,
  updatedFields: Partial<IPERecord>,
  originalRecord?: IPERecord
): Promise<IPERecord> {
  const list = getLocalRecords();
  const currentRecord = originalRecord || list.find((r) => r.id === id);

  // If we have the original record, verify whether any fields were actually modified
  let changes: FieldModification[] = [];
  if (currentRecord) {
    changes = detectRecordChanges(currentRecord, updatedFields);
    // If the user made no changes, do NOT register any alteration or update timestamps!
    if (changes.length === 0) {
      return currentRecord;
    }
  }

  const now = new Date().toISOString();
  const userEmail = auth.currentUser?.email || 'operador_local';

  // Extract only the items that changed for this latest alteration
  const lastModifiedItem =
    changes.length > 0
      ? changes.map((c) => c.item).join('; ')
      : (updatedFields.lastModifiedItem || 'Modificado manualmente');
  const lastPreviousValue =
    changes.length > 0
      ? changes.map((c) => c.previousValue).join('; ')
      : (updatedFields.lastPreviousValue ?? '');
  const lastCurrentValue =
    changes.length > 0
      ? changes.map((c) => c.currentValue).join('; ')
      : (updatedFields.lastCurrentValue ?? '');

  const fieldsToUpdate: Partial<IPERecord> = {
    ...updatedFields,
    updatedAt: now,
    editedAt: now,
    updatedBy: userEmail,
    lastModifiedItem,
    lastPreviousValue,
    lastCurrentValue,
  };

  const newDate = updatedFields.date || currentRecord?.date;
  const newShift = updatedFields.shift || currentRecord?.shift;
  const targetId = newDate && newShift ? getRecordDocId(newDate, newShift) : id;

  const mergedRecord: IPERecord = {
    ...(currentRecord || ({} as IPERecord)),
    ...fieldsToUpdate,
    id: targetId,
    date: newDate || currentRecord?.date || '',
    shift: newShift || currentRecord?.shift || 'A',
  };

  const cleanData = sanitizeObject(mergedRecord);

  try {
    if (targetId !== id) {
      // Date or shift was modified: create at targetId and remove old document
      const targetDocRef = doc(db, FIRESTORE_COLLECTION, targetId);
      await setDoc(targetDocRef, cleanData);

      const oldDocRef = doc(db, FIRESTORE_COLLECTION, id);
      await deleteDoc(oldDocRef);
    } else {
      const docRef = doc(db, FIRESTORE_COLLECTION, id);
      await updateDoc(docRef, sanitizeObject(fieldsToUpdate));
    }
  } catch (error) {
    console.error('Erro ao atualizar no Firestore:', error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${FIRESTORE_COLLECTION}/${targetId}`);
    } catch (e) {
      console.warn('Fallback local devido a erro:', e);
    }
  }

  // Update local cache
  const updatedList = list.filter((r) => r.id !== id && r.id !== targetId);
  updatedList.unshift(mergedRecord);
  saveLocalRecords(updatedList);

  return mergedRecord;
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
