import * as XLSX from 'xlsx';
import { IPERecord } from '../types';

/**
 * Helper to extract formatted local date and time from ISO string
 */
function parseAndFormatDateTime(isoString?: string | null): { date: string; time: string; full: string } {
  if (!isoString) return { date: '', time: '', full: '' };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: '', time: '', full: '' };

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    const date = `${day}/${month}/${year}`;
    const time = `${hours}:${minutes}:${seconds}`;
    const full = `${date} ${time}`;

    return { date, time, full };
  } catch {
    return { date: '', time: '', full: '' };
  }
}

/**
 * Export a list of IPE records to a genuine Excel (.xlsx) spreadsheet
 */
export function exportRecordsToExcel(records: IPERecord[], customFileName?: string): void {
  if (!records || records.length === 0) {
    alert('Nenhum registro disponível para exportar.');
    return;
  }

  // Format records with descriptive and Portuguese headers
  const data = records.map((r) => {
    // Detect whether this record has been edited
    const editTimestamp =
      r.editedAt ||
      (r.lastModifiedItem ? (r.updatedAt || r.createdAt) : null) ||
      (r.updatedAt && r.createdAt && r.updatedAt !== r.createdAt ? r.updatedAt : null);
    const editInfo = parseAndFormatDateTime(editTimestamp);
    const createdInfo = parseAndFormatDateTime(r.createdAt);

    return {
      'ID do Registro': r.id,
      'Data': r.date,
      'Turno': r.shift,
      'Pontuação Total': r.totalScore,
      'IVs Conformes (pts)': r.ivsScore,
      'Investigações PI (pts)': r.piScore,
      'Sala 1 - IPE (< -0.5)': r.sala1_ipe !== null && r.sala1_ipe !== undefined ? r.sala1_ipe : '',
      'Sala 2 - IPE (< -0.5)': r.sala2_ipe !== null && r.sala2_ipe !== undefined ? r.sala2_ipe : '',
      'Extrato em Água Sala 1 (< 1.0%)': r.extrato_agua_s1 !== null && r.extrato_agua_s1 !== undefined ? r.extrato_agua_s1 : '',
      'Extrato em Água Sala 2 (< 1.0%)': r.extrato_agua_s2 !== null && r.extrato_agua_s2 !== undefined ? r.extrato_agua_s2 : '',
      'CTF 1 - Perda % (< 1.0%)': r.ctf1_perda_pct !== null && r.ctf1_perda_pct !== undefined ? r.ctf1_perda_pct : '',
      'CTF 3 - Perda % (< 1.0%)': r.ctf3_perda_pct !== null && r.ctf3_perda_pct !== undefined ? r.ctf3_perda_pct : '',
      'CTF 1 - Perda hL (< 40 hL)': r.ctf1_perda_hl !== null && r.ctf1_perda_hl !== undefined ? r.ctf1_perda_hl : '',
      'CTF 3 - Perda hL (< 40 hL)': r.ctf3_perda_hl !== null && r.ctf3_perda_hl !== undefined ? r.ctf3_perda_hl : '',
      'CTF 1 - Deslodamentos (< 20)': r.ctf1_deslodamentos !== null && r.ctf1_deslodamentos !== undefined ? r.ctf1_deslodamentos : '',
      'CTF 3 - Deslodamentos (< 20)': r.ctf3_deslodamentos !== null && r.ctf3_deslodamentos !== undefined ? r.ctf3_deslodamentos : '',
      'Centrífuga Brux - Perda hL (< 5.0 hL)': r.centrifuga_brux_hl !== null && r.centrifuga_brux_hl !== undefined ? r.centrifuga_brux_hl : '',
      'F01 - Perda % (< -1.0%)': r.f01_perda_pct !== null && r.f01_perda_pct !== undefined ? r.f01_perda_pct : '',
      'F02 - Perda % (< -1.0%)': r.f02_perda_pct !== null && r.f02_perda_pct !== undefined ? r.f02_perda_pct : '',
      'F1 - Perda hL (< 100 hL)': r.f1_perda_hl !== null && r.f1_perda_hl !== undefined ? r.f1_perda_hl : '',
      'F2 - Perda hL (< 100 hL)': r.f2_perda_hl !== null && r.f2_perda_hl !== undefined ? r.f2_perda_hl : '',
      'F1 - Extratinho (< 2.0%)': r.f1_extratinho !== null && r.f1_extratinho !== undefined ? r.f1_extratinho : '',
      'F2 - Extratinho (< 2.0%)': r.f2_extratinho !== null && r.f2_extratinho !== undefined ? r.f2_extratinho : '',
      'PI Brassagem': r.pi_brassagem ?? '',
      'PI Adega': r.pi_adega ?? '',
      'PI Filtração': r.pi_filtracao ?? '',
      'Observações': r.notes || '',
      'Registro Editado?': editTimestamp ? 'Sim' : 'Não',
      'Data da Edição': editInfo.date,
      'Horário da Edição': editInfo.time,
      'Data e Horário da Edição': editInfo.full,
      'Item Modificado': editTimestamp ? (r.lastModifiedItem || 'Modificado manualmente') : '',
      'Último Valor': editTimestamp ? (r.lastPreviousValue ?? '') : '',
      'Valor Atual': editTimestamp ? (r.lastCurrentValue ?? '') : '',
      'Criado Em': createdInfo.full || r.createdAt || '',
      'Criado Por': r.createdBy || '',
      'Editado Por': editTimestamp ? (r.updatedBy || '') : ''
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const columnKeys = Object.keys(data[0] || {});
  worksheet['!cols'] = columnKeys.map((key) => {
    const maxValLen = data.reduce((acc, row) => {
      const valStr = String((row as any)[key] ?? '');
      return Math.max(acc, valStr.length);
    }, key.length);
    return { wch: Math.min(Math.max(maxValLen + 3, 12), 40) };
  });

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lançamentos IPE');

  // File name
  const today = new Date().toISOString().split('T')[0];
  const fileName = customFileName || `relatorio_ipe_${today}.xlsx`;

  // Write and trigger browser download
  XLSX.writeFile(workbook, fileName);
}

