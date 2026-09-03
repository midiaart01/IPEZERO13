import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';
import { Download, Save, RefreshCw, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { IPERecord, ShiftType, IV_METAS } from '../types';
import IPEBadge from './IPEBadge';
import { createRecord, checkRecordExists } from '../lib/recordsService';

interface LaunchFormProps {
  onSaveSuccess: () => void;
  existingRecords: IPERecord[];
}

export default function LaunchForm({ onSaveSuccess, existingRecords }: LaunchFormProps) {
  const formRef = useRef<HTMLDivElement>(null);

  // Today's date default
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(todayStr);
  const [shift, setShift] = useState<ShiftType>('A');

  // Form Field States (Strings for controlled inputs)
  const [sala1_ipe, setSala1Ipe] = useState<string>('');
  const [sala2_ipe, setSala2Ipe] = useState<string>('');
  const [extrato_agua_s1, setExtratoAguaS1] = useState<string>('');
  const [extrato_agua_s2, setExtratoAguaS2] = useState<string>('');

  const [ctf1_perda_pct, setCtf1PerdaPct] = useState<string>('');
  const [ctf3_perda_pct, setCtf3PerdaPct] = useState<string>('');
  const [ctf1_perda_hl, setCtf1PerdaHl] = useState<string>('');
  const [ctf3_perda_hl, setCtf3PerdaHl] = useState<string>('');
  const [ctf1_deslodamentos, setCtf1Deslodamentos] = useState<string>('');
  const [ctf3_deslodamentos, setCtf3Deslodamentos] = useState<string>('');

  const [centrifuga_brux_hl, setCentrifugaBruxHl] = useState<string>('');

  const [f01_perda_pct, setF01PerdaPct] = useState<string>('');
  const [f02_perda_pct, setF02PerdaPct] = useState<string>('');
  const [f1_perda_hl, setF1PerdaHl] = useState<string>('');
  const [f2_perda_hl, setF2PerdaHl] = useState<string>('');
  const [f1_extratinho, setF1Extratinho] = useState<string>('');
  const [f2_extratinho, setF2Extratinho] = useState<string>('');

  const [pi_brassagem, setPiBrassagem] = useState<string>('0');
  const [pi_adega, setPiAdega] = useState<string>('0');
  const [pi_filtracao, setPiFiltracao] = useState<string>('0');

  const [notes, setNotes] = useState<string>('');

  // UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportedImage, setExportedImage] = useState<{ url: string; filename: string } | null>(null);

  // Check duplicate date + shift dynamically
  const isDuplicate = existingRecords.some(r => r.date === date && r.shift === shift);

  useEffect(() => {
    if (isDuplicate) {
      setErrorMessage('Já existe um lançamento para este turno nesta data.');
    } else {
      setErrorMessage(null);
    }
  }, [date, shift, existingRecords, isDuplicate]);

  // Helper to parse float safely
  const parseVal = (str: string): number | null => {
    if (!str || str.trim() === '') return null;
    const cleanStr = str.replace(',', '.');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? null : num;
  };

  // Evaluate Meta status for each IV
  const evaluateIV = (key: string, rawVal: string): boolean | null => {
    if (rawVal.trim() === '') return null; // null means not entered
    const val = parseVal(rawVal);
    const metaObj = IV_METAS.find(m => m.key === key);
    if (!metaObj) return null;
    return metaObj.check(val);
  };

  // Calculations
  const currentIVsState = {
    sala1_ipe: evaluateIV('sala1_ipe', sala1_ipe),
    sala2_ipe: evaluateIV('sala2_ipe', sala2_ipe),
    extrato_agua_s1: evaluateIV('extrato_agua_s1', extrato_agua_s1),
    extrato_agua_s2: evaluateIV('extrato_agua_s2', extrato_agua_s2),
    ctf1_perda_pct: evaluateIV('ctf1_perda_pct', ctf1_perda_pct),
    ctf3_perda_pct: evaluateIV('ctf3_perda_pct', ctf3_perda_pct),
    ctf1_perda_hl: evaluateIV('ctf1_perda_hl', ctf1_perda_hl),
    ctf3_perda_hl: evaluateIV('ctf3_perda_hl', ctf3_perda_hl),
    ctf1_deslodamentos: evaluateIV('ctf1_deslodamentos', ctf1_deslodamentos),
    ctf3_deslodamentos: evaluateIV('ctf3_deslodamentos', ctf3_deslodamentos),
    centrifuga_brux_hl: evaluateIV('centrifuga_brux_hl', centrifuga_brux_hl),
    f01_perda_pct: evaluateIV('f01_perda_pct', f01_perda_pct),
    f02_perda_pct: evaluateIV('f02_perda_pct', f02_perda_pct),
    f1_perda_hl: evaluateIV('f1_perda_hl', f1_perda_hl),
    f2_perda_hl: evaluateIV('f2_perda_hl', f2_perda_hl),
    f1_extratinho: evaluateIV('f1_extratinho', f1_extratinho),
    f2_extratinho: evaluateIV('f2_extratinho', f2_extratinho),
  };

  // Total IVs met count
  const ivsMetCount = Object.values(currentIVsState).filter(val => val === true).length;

  // PI Total
  const piB = parseVal(pi_brassagem) || 0;
  const piA = parseVal(pi_adega) || 0;
  const piF = parseVal(pi_filtracao) || 0;
  const totalPIs = Math.max(0, piB) + Math.max(0, piA) + Math.max(0, piF);

  // Total Score
  const totalScore = ivsMetCount + totalPIs;

  const handleReset = () => {
    setSala1Ipe('');
    setSala2Ipe('');
    setExtratoAguaS1('');
    setExtratoAguaS2('');
    setCtf1PerdaPct('');
    setCtf3PerdaPct('');
    setCtf1PerdaHl('');
    setCtf3PerdaHl('');
    setCtf1Deslodamentos('');
    setCtf3Deslodamentos('');
    setCentrifugaBruxHl('');
    setF01PerdaPct('');
    setF02PerdaPct('');
    setF1PerdaHl('');
    setF2PerdaHl('');
    setF1Extratinho('');
    setF2Extratinho('');
    setPiBrassagem('0');
    setPiAdega('0');
    setPiFiltracao('0');
    setNotes('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (isDuplicate) {
      setErrorMessage('Já existe um lançamento para este turno nesta data.');
      return;
    }

    setIsSaving(true);

    const recordData: Omit<IPERecord, 'id' | 'createdAt'> = {
      date,
      shift,
      sala1_ipe: parseVal(sala1_ipe),
      sala2_ipe: parseVal(sala2_ipe),
      extrato_agua_s1: parseVal(extrato_agua_s1),
      extrato_agua_s2: parseVal(extrato_agua_s2),
      ctf1_perda_pct: parseVal(ctf1_perda_pct),
      ctf3_perda_pct: parseVal(ctf3_perda_pct),
      ctf1_perda_hl: parseVal(ctf1_perda_hl),
      ctf3_perda_hl: parseVal(ctf3_perda_hl),
      ctf1_deslodamentos: parseVal(ctf1_deslodamentos),
      ctf3_deslodamentos: parseVal(ctf3_deslodamentos),
      centrifuga_brux_hl: parseVal(centrifuga_brux_hl),
      f01_perda_pct: parseVal(f01_perda_pct),
      f02_perda_pct: parseVal(f02_perda_pct),
      f1_perda_hl: parseVal(f1_perda_hl),
      f2_perda_hl: parseVal(f2_perda_hl),
      f1_extratinho: parseVal(f1_extratinho),
      f2_extratinho: parseVal(f2_extratinho),
      pi_brassagem: parseVal(pi_brassagem) || 0,
      pi_adega: parseVal(pi_adega) || 0,
      pi_filtracao: parseVal(pi_filtracao) || 0,
      ivsScore: ivsMetCount,
      piScore: totalPIs,
      totalScore: totalScore,
      notes: notes.trim() || undefined,
    };

    try {
      const exists = await checkRecordExists(date, shift);
      if (exists) {
        setErrorMessage('Já existe um lançamento cadastrado para esta data e turno.');
        setIsSaving(false);
        return;
      }

      await createRecord(recordData);
      setSuccessMessage('Lançamento salvo com sucesso no Supabase.');
      setErrorMessage(null);
      onSaveSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar o lançamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!formRef.current) return;
    setIsExporting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 150));

      const targetEl = formRef.current;

      // Synchronize input and select values into HTML attributes for clean SVG/Canvas rendering
      const originalInputs = targetEl.querySelectorAll<HTMLInputElement>('input');
      originalInputs.forEach((orig) => {
        orig.setAttribute('value', orig.value);
      });

      const originalSelects = targetEl.querySelectorAll<HTMLSelectElement>('select');
      originalSelects.forEach((orig) => {
        const selectedOption = orig.options[orig.selectedIndex];
        if (selectedOption) {
          Array.from(orig.options).forEach((opt) => opt.removeAttribute('selected'));
          selectedOption.setAttribute('selected', 'selected');
        }
      });

      let dataUrl = '';
      const filename = `IPE_${date}_Turno_${shift}.png`;

      try {
        // Primary modern renderer using SVG foreignObject (handles modern Tailwind 4 CSS perfectly)
        dataUrl = await toPng(targetEl, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
        });
      } catch (primaryErr) {
        console.warn('toPng failed, attempting html2canvas fallback:', primaryErr);
        const canvas = await html2canvas(targetEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
        dataUrl = canvas.toDataURL('image/png');
      }

      if (!dataUrl) {
        throw new Error('Não foi possível gerar a imagem.');
      }

      // Try automatic link download
      try {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (dlErr) {
        console.warn('Direct link click failed:', dlErr);
      }

      // Open download preview modal to guarantee user access to the image even if iframe blocks auto-download
      setExportedImage({ url: dataUrl, filename });
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
      alert('Falha ao exportar imagem. Por favor tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper renderer for input box matching original sheet style
  const renderInputBox = (
    label: string,
    value: string,
    setter: (val: string) => void,
    metaState: boolean | null,
    placeholder: string = '',
    idAttr: string
  ) => {
    let statusClass = 'bg-slate-200 border-slate-300 text-slate-900';
    let icon = null;

    if (metaState === true) {
      statusClass = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold';
      icon = <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />;
    } else if (metaState === false) {
      statusClass = 'bg-red-100 border-red-500 text-red-950 font-bold';
      icon = <XCircle className="w-4 h-4 text-red-600 shrink-0 ml-1" />;
    }

    return (
      <div className="flex items-center justify-between gap-2 p-1">
        <label htmlFor={idAttr} className="text-xs font-bold text-black tracking-tight select-none">
          {label} :
        </label>
        <div className="relative flex items-center w-28 sm:w-36">
          <input
            id={idAttr}
            type="text"
            inputMode="decimal"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setter(e.target.value)}
            className={`w-full px-2 py-1 text-sm font-bold rounded-none border focus:outline-none focus:ring-2 focus:ring-cyan-600 transition-colors ${statusClass}`}
          />
          {icon && <div className="absolute right-1.5 pointer-events-none">{icon}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4 md:p-6 space-y-6">
      {/* Alert Messages */}
      {errorMessage && (
        <div className="flex items-center space-x-3 p-4 bg-red-600 text-white font-bold rounded-lg shadow-md animate-pulse">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <span className="text-sm sm:text-base">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center space-x-3 p-4 bg-emerald-600 text-white font-bold rounded-lg shadow-md">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <span className="text-sm sm:text-base">{successMessage}</span>
        </div>
      )}

      {/* Main Sheet Form Frame - Faithful to image layout */}
      <div
        ref={formRef}
        id="launch-sheet-container"
        className="bg-white text-black p-4 sm:p-6 border-4 border-black shadow-2xl space-y-2 font-sans select-none"
        style={{ minWidth: '320px' }}
      >
        {/* Top Header: Data, Turno & IPE Logo */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-black pb-3 gap-4">
          <div className="flex flex-wrap items-center gap-6 font-bold text-base sm:text-lg">
            <div className="flex items-center space-x-2">
              <label htmlFor="launch-date-input" className="text-black">
                Data:
              </label>
              <input
                id="launch-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-2 border-black px-2 py-1 bg-slate-100 font-bold text-sm focus:bg-white"
              />
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="launch-shift-select" className="text-black">
                Turno:
              </label>
              <select
                id="launch-shift-select"
                value={shift}
                onChange={(e) => setShift(e.target.value as ShiftType)}
                className="border-2 border-black px-3 py-1 bg-slate-100 font-bold text-sm focus:bg-white"
              >
                <option value="A">Turno A</option>
                <option value="B">Turno B</option>
                <option value="C">Turno C</option>
                <option value="D">Turno D</option>
              </select>
            </div>
          </div>

          <div className="self-end sm:self-auto">
            <IPEBadge />
          </div>
        </div>

        {/* SECTION 1: BRASSAGEM */}
        <div className="border-2 border-black mt-2">
          {/* Header Bar */}
          <div className="bg-[#38bdf8] text-black font-black text-center text-sm sm:text-base py-1 uppercase tracking-wide border-b-2 border-black">
            BRASSAGEM
          </div>

          {/* Subheaders for Metas */}
          <div className="grid grid-cols-2 bg-[#7dd3fc] text-black font-extrabold text-xs sm:text-sm text-center py-1 border-b-2 border-black">
            <div>META: &lt;= -0,5%</div>
            <div>META: &lt;= 1°P</div>
          </div>

          {/* Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x-2 divide-black p-2 bg-white gap-y-1">
            {/* Col 1 */}
            <div className="space-y-1 pr-0 md:pr-2">
              {renderInputBox(
                'Sala 01 IPE (%)',
                sala1_ipe,
                setSala1Ipe,
                currentIVsState.sala1_ipe,
                'ex: -0.8',
                'field-sala1-ipe'
              )}
              {renderInputBox(
                'Sala 02 IPE (%)',
                sala2_ipe,
                setSala2Ipe,
                currentIVsState.sala2_ipe,
                'ex: -0.7',
                'field-sala2-ipe'
              )}
            </div>

            {/* Col 2 */}
            <div className="space-y-1 pl-0 md:pl-2 pt-1 md:pt-0">
              {renderInputBox(
                'Extrato Última Água S1 (°P)',
                extrato_agua_s1,
                setExtratoAguaS1,
                currentIVsState.extrato_agua_s1,
                'ex: 0.8',
                'field-extrato-s1'
              )}
              {renderInputBox(
                'Extrato Última Água S2 (°P)',
                extrato_agua_s2,
                setExtratoAguaS2,
                currentIVsState.extrato_agua_s2,
                'ex: 0.9',
                'field-extrato-s2'
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: ADEGA */}
        <div className="border-2 border-black mt-3">
          {/* Header Bar */}
          <div className="bg-[#38bdf8] text-black font-black text-center text-sm sm:text-base py-1 uppercase tracking-wide border-b-2 border-black">
            ADEGA
          </div>

          {/* Subheaders for Metas */}
          <div className="grid grid-cols-3 bg-[#7dd3fc] text-black font-extrabold text-xs sm:text-sm text-center py-1 border-b-2 border-black">
            <div>META: &lt;= 1%</div>
            <div>META: &lt;= 40 hl</div>
            <div>META: &lt;= 20</div>
          </div>

          {/* Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x-2 divide-black p-2 bg-white gap-y-1">
            {/* Col 1 */}
            <div className="space-y-1 pr-0 md:pr-1">
              {renderInputBox(
                'CTF 01 Perda (%)',
                ctf1_perda_pct,
                setCtf1PerdaPct,
                currentIVsState.ctf1_perda_pct,
                'ex: 0.8',
                'field-ctf1-perda-pct'
              )}
              {renderInputBox(
                'CTF 03 Perda (%)',
                ctf3_perda_pct,
                setCtf3PerdaPct,
                currentIVsState.ctf3_perda_pct,
                'ex: 0.7',
                'field-ctf3-perda-pct'
              )}
            </div>

            {/* Col 2 */}
            <div className="space-y-1 px-0 md:px-1 pt-1 md:pt-0">
              {renderInputBox(
                'CTF 01 Perda (hL)',
                ctf1_perda_hl,
                setCtf1PerdaHl,
                currentIVsState.ctf1_perda_hl,
                'ex: 32',
                'field-ctf1-perda-hl'
              )}
              {renderInputBox(
                'CTF 03 Perda (hL)',
                ctf3_perda_hl,
                setCtf3PerdaHl,
                currentIVsState.ctf3_perda_hl,
                'ex: 35',
                'field-ctf3-perda-hl'
              )}
            </div>

            {/* Col 3 */}
            <div className="space-y-1 pl-0 md:pl-1 pt-1 md:pt-0">
              {renderInputBox(
                'CTF 01 Nº Deslodamentos',
                ctf1_deslodamentos,
                setCtf1Deslodamentos,
                currentIVsState.ctf1_deslodamentos,
                'ex: 14',
                'field-ctf1-deslodamentos'
              )}
              {renderInputBox(
                'CTF 03 Nº Deslodamentos',
                ctf3_deslodamentos,
                setCtf3Deslodamentos,
                currentIVsState.ctf3_deslodamentos,
                'ex: 16',
                'field-ctf3-deslodamentos'
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: ADEGA PLUS */}
        <div className="border-2 border-black mt-3">
          <div className="bg-[#38bdf8] text-black font-black text-center text-sm sm:text-base py-1 uppercase tracking-wide border-b-2 border-black">
            ADEGA PLUS
          </div>
          <div className="p-2 bg-white flex flex-col sm:flex-row items-center justify-between gap-2">
            <label htmlFor="field-centrifuga-brux" className="text-xs font-bold text-black">
              Centrífuga Brux - Volume Recuperado (hL) [Meta: &gt; 0 hL] :
            </label>
            <div className="relative flex items-center w-full sm:w-48">
              <input
                id="field-centrifuga-brux"
                type="text"
                inputMode="decimal"
                placeholder="ex: 1.5"
                value={centrifuga_brux_hl}
                onChange={(e) => setCentrifugaBruxHl(e.target.value)}
                className={`w-full px-2 py-1 text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-cyan-600 ${
                  currentIVsState.centrifuga_brux_hl === true
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold'
                    : currentIVsState.centrifuga_brux_hl === false
                    ? 'bg-red-100 border-red-500 text-red-950 font-bold'
                    : 'bg-slate-200 border-slate-300'
                }`}
              />
              {currentIVsState.centrifuga_brux_hl === true && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-2 pointer-events-none" />
              )}
              {currentIVsState.centrifuga_brux_hl === false && (
                <XCircle className="w-4 h-4 text-red-600 absolute right-2 pointer-events-none" />
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: FILTRAÇÃO */}
        <div className="border-2 border-black mt-3">
          {/* Header Bar */}
          <div className="bg-[#38bdf8] text-black font-black text-center text-sm sm:text-base py-1 uppercase tracking-wide border-b-2 border-black">
            FILTRAÇÃO
          </div>

          {/* Subheaders for Metas */}
          <div className="grid grid-cols-3 bg-[#7dd3fc] text-black font-extrabold text-xs sm:text-sm text-center py-1 border-b-2 border-black">
            <div>META: &lt;= -1%</div>
            <div>META: &lt;= 100 hl</div>
            <div>META: &gt;= 1,5%</div>
          </div>

          {/* Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x-2 divide-black p-2 bg-white gap-y-1">
            {/* Col 1 */}
            <div className="space-y-1 pr-0 md:pr-1">
              {renderInputBox(
                'F 01 Perda (%)',
                f01_perda_pct,
                setF01PerdaPct,
                currentIVsState.f01_perda_pct,
                'ex: -1.4',
                'field-f01-perda-pct'
              )}
              {renderInputBox(
                'F 02 Perda (%)',
                f02_perda_pct,
                setF02PerdaPct,
                currentIVsState.f02_perda_pct,
                'ex: -1.2',
                'field-f02-perda-pct'
              )}
            </div>

            {/* Col 2 */}
            <div className="space-y-1 px-0 md:px-1 pt-1 md:pt-0">
              {renderInputBox(
                'F1 Perda (hL)',
                f1_perda_hl,
                setF1PerdaHl,
                currentIVsState.f1_perda_hl,
                'ex: 80',
                'field-f1-perda-hl'
              )}
              {renderInputBox(
                'F2 Perda (hL)',
                f2_perda_hl,
                setF2PerdaHl,
                currentIVsState.f2_perda_hl,
                'ex: 85',
                'field-f2-perda-hl'
              )}
            </div>

            {/* Col 3 */}
            <div className="space-y-1 pl-0 md:pl-1 pt-1 md:pt-0">
              {renderInputBox(
                'F1 Extratinho',
                f1_extratinho,
                setF1Extratinho,
                currentIVsState.f1_extratinho,
                'ex: 1.8',
                'field-f1-extratinho'
              )}
              {renderInputBox(
                'F2 Extratinho',
                f2_extratinho,
                setF2Extratinho,
                currentIVsState.f2_extratinho,
                'ex: 1.7',
                'field-f2-extratinho'
              )}
            </div>
          </div>
        </div>

        {/* SECTION 5: PROBLEM SOLVING */}
        <div className="border-2 border-black mt-3">
          <div className="bg-[#38bdf8] text-black font-black text-center text-sm sm:text-base py-1 uppercase tracking-wide border-b-2 border-black">
            PROBLEM SOLVING
          </div>

          <div className="p-2 bg-white grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Left: PI FOCO INVESTIGATIONS */}
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-tight text-slate-900 border-b border-black pb-1">
                INVESTIGAÇÕES PI FOCO (PERDA DE EXTRATO)
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="field-pi-brassagem" className="text-xs font-bold text-black">
                    Brassagem :
                  </label>
                  <input
                    id="field-pi-brassagem"
                    type="number"
                    min="0"
                    value={pi_brassagem}
                    onChange={(e) => setPiBrassagem(e.target.value)}
                    className="w-28 px-2 py-1 bg-slate-200 border border-slate-400 font-bold text-sm focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="field-pi-adega" className="text-xs font-bold text-black">
                    Adega :
                  </label>
                  <input
                    id="field-pi-adega"
                    type="number"
                    min="0"
                    value={pi_adega}
                    onChange={(e) => setPiAdega(e.target.value)}
                    className="w-28 px-2 py-1 bg-slate-200 border border-slate-400 font-bold text-sm focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="field-pi-filtracao" className="text-xs font-bold text-black">
                    Filtração :
                  </label>
                  <input
                    id="field-pi-filtracao"
                    type="number"
                    min="0"
                    value={pi_filtracao}
                    onChange={(e) => setPiFiltracao(e.target.value)}
                    className="w-28 px-2 py-1 bg-slate-200 border border-slate-400 font-bold text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right: Real-time IV Summary Box */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-100 border-2 border-black rounded-none space-y-1 text-center">
              <span className="text-xs font-black uppercase text-black">
                Nº de IVs no Turno Dentro de Faixa
              </span>
              <div className="text-3xl font-black text-black">
                {ivsMetCount} <span className="text-base text-slate-600 font-bold">/ 17</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 6: RESUMO AUTOMÁTICO */}
        <div className="border-2 border-black bg-slate-900 text-white p-3 mt-3 flex flex-wrap items-center justify-around gap-4 text-center">
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">
              Nº de IVs Dentro de Faixa
            </div>
            <div className="text-2xl font-black text-emerald-400">{ivsMetCount} / 17</div>
          </div>

          <div className="border-r border-slate-700 h-8 hidden sm:block"></div>

          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">
              Investigações PI Foco
            </div>
            <div className="text-2xl font-black text-cyan-400">+{totalPIs} pts</div>
          </div>

          <div className="border-r border-slate-700 h-8 hidden sm:block"></div>

          <div>
            <div className="text-[11px] font-bold uppercase text-amber-400">
              Pontuação Total do Turno
            </div>
            <div className="text-3xl font-black text-amber-400 drop-shadow">
              {totalScore} <span className="text-sm font-bold text-amber-200">Pontos</span>
            </div>
          </div>
        </div>

        {/* Optional Notes */}
        <div className="pt-2">
          <label htmlFor="field-launch-notes" className="text-xs font-bold text-slate-700">
            Observações Operacionais / Destaques do Turno (Opcional):
          </label>
          <input
            id="field-launch-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Parada programada na Sala 1 para manutenção preventiva..."
            className="w-full mt-1 p-2 border border-slate-400 bg-slate-50 text-xs text-black focus:outline-none"
          />
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xl">
        <button
          id="launch-reset-btn"
          type="button"
          onClick={handleReset}
          className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-lg border border-slate-700 transition-all shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Limpar Campos</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            id="launch-download-btn"
            type="button"
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-lg transition-all shadow-lg hover:shadow-amber-500/20 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Gerando Imagem...' : 'Baixar Imagem (PNG)'}</span>
          </button>

          <button
            id="launch-save-btn"
            type="button"
            onClick={handleSave}
            disabled={isSaving || isDuplicate}
            className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-lg transition-all shadow-lg hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Lançamento'}</span>
          </button>
        </div>
      </div>

      {/* Exported Image Modal / Download Fallback */}
      {exportedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border-2 border-slate-700">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base sm:text-lg">Imagem Gerada com Sucesso</h3>
              </div>
              <button
                type="button"
                onClick={() => setExportedImage(null)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Fechar"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto bg-slate-100 flex-1 flex flex-col items-center justify-center space-y-4">
              <p className="text-xs sm:text-sm text-slate-700 font-medium text-center max-w-xl">
                Sua imagem foi gerada. Se o download não iniciou automaticamente no seu navegador, clique no botão <strong>"Baixar Arquivo"</strong> abaixo ou clique com o botão direito na imagem e selecione <strong>"Salvar imagem como..."</strong>.
              </p>

              <div className="border-2 border-slate-300 rounded shadow-md overflow-hidden max-w-full bg-white p-2">
                <img
                  src={exportedImage.url}
                  alt="Relatório IPE"
                  className="max-h-[50vh] object-contain mx-auto"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
              <a
                href={exportedImage.url}
                download={exportedImage.filename}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Arquivo ({exportedImage.filename})</span>
              </a>

              <button
                type="button"
                onClick={() => setExportedImage(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm rounded-lg transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
