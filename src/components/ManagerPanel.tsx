import { useState } from 'react';
import { Download, RefreshCw, BookOpen, CheckCircle, ShieldAlert, Database } from 'lucide-react';
import { IPERecord, IV_METAS } from '../types';
import { resetRecords } from '../lib/recordsService';
import { isSupabaseConfigured } from '../lib/supabase';

interface ManagerPanelProps {
  records: IPERecord[];
  onDataReset: () => void;
}

export default function ManagerPanel({ records, onDataReset }: ManagerPanelProps) {
  const [isResetting, setIsResetting] = useState(false);

  const handleExportCSV = () => {
    if (records.length === 0) {
      alert('Nenhum dado disponível para exportação.');
      return;
    }

    const headers = [
      'ID',
      'Data',
      'Turno',
      'Pontuação Total',
      'IVs Conformes',
      'Investigações PI',
      'Sala 1 IPE',
      'Sala 2 IPE',
      'Extrato Agua S1',
      'Extrato Agua S2',
      'CTF1 Perda %',
      'CTF3 Perda %',
      'CTF1 Perda hL',
      'CTF3 Perda hL',
      'CTF1 Deslodamentos',
      'CTF3 Deslodamentos',
      'Centrifuga Brux hL',
      'F01 Perda %',
      'F02 Perda %',
      'F1 Perda hL',
      'F2 Perda hL',
      'F1 Extratinho',
      'F2 Extratinho',
      'PI Brassagem',
      'PI Adega',
      'PI Filtração',
      'Observações'
    ];

    const rows = records.map((r) => [
      r.id,
      r.date,
      r.shift,
      r.totalScore,
      r.ivsScore,
      r.piScore,
      r.sala1_ipe ?? '',
      r.sala2_ipe ?? '',
      r.extrato_agua_s1 ?? '',
      r.extrato_agua_s2 ?? '',
      r.ctf1_perda_pct ?? '',
      r.ctf3_perda_pct ?? '',
      r.ctf1_perda_hl ?? '',
      r.ctf3_perda_hl ?? '',
      r.ctf1_deslodamentos ?? '',
      r.ctf3_deslodamentos ?? '',
      r.centrifuga_brux_hl ?? '',
      r.f01_perda_pct ?? '',
      r.f02_perda_pct ?? '',
      r.f1_perda_hl ?? '',
      r.f2_perda_hl ?? '',
      r.f1_extratinho ?? '',
      r.f2_extratinho ?? '',
      r.pi_brassagem,
      r.pi_adega,
      r.pi_filtracao,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IPE_Relatorio_Indicadores_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetSeedData = async () => {
    if (
      !confirm(
        'Deseja restaurar os dados de demonstração originais no Supabase? Isso atualizará a base com os lançamentos de exemplo.'
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      await resetRecords();
      alert('Dados de demonstração restaurados com sucesso.');
      onDataReset();
    } catch (err) {
      alert('Erro ao restaurar dados.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
            <span>Painel de Controle e Gestão Operacional</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ferramentas administrativas para exportação de dados, referência de metas IPE e manutenção do banco.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${
            isSupabaseConfigured 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            <Database className="w-4 h-4" />
            <span>{isSupabaseConfigured ? 'Supabase Conectado' : 'Supabase (Modo Demo / Local)'}</span>
          </div>

          <button
            id="manager-export-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-cyan-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV Completo</span>
          </button>

          <button
            id="manager-reset-data-btn"
            onClick={handleResetSeedData}
            disabled={isResetting}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isResetting ? 'Restaurando...' : 'Restaurar Dados Exemplo'}</span>
          </button>
        </div>
      </div>

      {/* Benchmark Rules Reference */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-extrabold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <span>Manual de Regras & Metas IPE (17 Indicadores)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* BRASSAGEM */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-black text-cyan-400 border-b border-slate-800 pb-1 uppercase">
              1. BRASSAGEM (4 IVs)
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center justify-between">
                <span>Sala 01 IPE (%)</span>
                <span className="font-mono font-bold text-emerald-400">&le; -0,5%</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Sala 02 IPE (%)</span>
                <span className="font-mono font-bold text-emerald-400">&le; -0,5%</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Última Água S1 (°P)</span>
                <span className="font-mono font-bold text-emerald-400">&le; 1,0 °P</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Última Água S2 (°P)</span>
                <span className="font-mono font-bold text-emerald-400">&le; 1,0 °P</span>
              </li>
            </ul>
          </div>

          {/* ADEGA */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-black text-cyan-400 border-b border-slate-800 pb-1 uppercase">
              2. ADEGA (6 IVs)
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center justify-between">
                <span>CTF 01 / 03 Perda (%)</span>
                <span className="font-mono font-bold text-emerald-400">&le; 1,0%</span>
              </li>
              <li className="flex items-center justify-between">
                <span>CTF 01 / 03 Perda (hL)</span>
                <span className="font-mono font-bold text-emerald-400">&le; 40 hL</span>
              </li>
              <li className="flex items-center justify-between">
                <span>CTF 01 / 03 Deslodamentos</span>
                <span className="font-mono font-bold text-emerald-400">&le; 20</span>
              </li>
            </ul>
          </div>

          {/* ADEGA PLUS */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-black text-cyan-400 border-b border-slate-800 pb-1 uppercase">
              3. ADEGA PLUS (1 IV)
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center justify-between">
                <span>Centrífuga Brux Vol. Rec.</span>
                <span className="font-mono font-bold text-emerald-400">&gt; 0 hL</span>
              </li>
              <li className="text-[10px] text-slate-500 pt-1">
                Ex: 0 = Não atende, 0.1 = Atende
              </li>
            </ul>
          </div>

          {/* FILTRAÇÃO */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-black text-cyan-400 border-b border-slate-800 pb-1 uppercase">
              4. FILTRAÇÃO (6 IVs)
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center justify-between">
                <span>F01 / F02 Perda (%)</span>
                <span className="font-mono font-bold text-emerald-400">&le; -1,0%</span>
              </li>
              <li className="flex items-center justify-between">
                <span>F1 / F2 Perda (hL)</span>
                <span className="font-mono font-bold text-emerald-400">&le; 100 hL</span>
              </li>
              <li className="flex items-center justify-between">
                <span>F1 / F2 Extratinho</span>
                <span className="font-mono font-bold text-emerald-400">&ge; 1,5%</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Scoring System Explanation */}
        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-2 mt-4">
          <div className="font-black text-white flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Regras de Cálculo da Pontuação do Turno:</span>
          </div>
          <p>
            • <strong>17 IVs Individuais:</strong> Cada IV dentro da meta estabelecida adiciona <strong>+1 ponto</strong>.
          </p>
          <p>
            • <strong>Problem Solving (Investigações PI Foco):</strong> Cada investigação conduzida na Brassagem, Adega ou Filtração concede <strong>+1 ponto</strong> sem limite máximo.
          </p>
          <p>
            • <strong>Pontuação Total =</strong> IVs dentro da Faixa (max 17) + PIs Brassagem + PIs Adega + PIs Filtração.
          </p>
        </div>
      </div>
    </div>
  );
}
