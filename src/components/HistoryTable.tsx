import { useState, useMemo } from 'react';
import {
  History,
  Trash2,
  Eye,
  Filter,
  Calendar,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers
} from 'lucide-react';
import { IPERecord, ShiftType, IV_METAS } from '../types';
import { deleteRecord } from '../lib/recordsService';

interface HistoryTableProps {
  records: IPERecord[];
  onRecordDeleted: () => void;
}

export default function HistoryTable({ records, onRecordDeleted }: HistoryTableProps) {
  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string>('ALL');

  // Selected Record for Detail Modal
  const [detailRecord, setDetailRecord] = useState<IPERecord | null>(null);

  // Selected Record for Delete Modal
  const [deleteCandidate, setDeleteCandidate] = useState<IPERecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedShift !== 'ALL' && r.shift !== selectedShift) {
        return false;
      }
      if (startDate && r.date < startDate) {
        return false;
      }
      if (endDate && r.date > endDate) {
        return false;
      }
      return true;
    });
  }, [records, selectedShift, startDate, endDate]);

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);

    try {
      await deleteRecord(deleteCandidate.id);
      setDeleteCandidate(null);
      if (detailRecord?.id === deleteCandidate.id) {
        setDetailRecord(null);
      }
      onRecordDeleted();
    } catch (err) {
      alert('Falha ao tentar excluir lançamento.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedShift('ALL');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <History className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100">
                Histórico de Lançamentos IPE
              </h2>
              <p className="text-xs text-slate-400">
                Consulta completa, filtros avançados e gerenciamento de registros
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 self-start md:self-auto">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Total Encontrado: {filteredRecords.length} registros</span>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Data Inicial */}
          <div>
            <label htmlFor="filter-start-date" className="block text-xs font-bold text-slate-300 mb-1">
              Data Inicial:
            </label>
            <div className="relative">
              <input
                id="filter-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Data Final */}
          <div>
            <label htmlFor="filter-end-date" className="block text-xs font-bold text-slate-300 mb-1">
              Data Final:
            </label>
            <div className="relative">
              <input
                id="filter-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Turno */}
          <div>
            <label htmlFor="filter-shift-select" className="block text-xs font-bold text-slate-300 mb-1">
              Turno:
            </label>
            <select
              id="filter-shift-select"
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="ALL">Todos os Turnos</option>
              <option value="A">Turno A</option>
              <option value="B">Turno B</option>
              <option value="C">Turno C</option>
              <option value="D">Turno D</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              id="history-clear-filters-btn"
              onClick={clearFilters}
              className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 px-3 rounded-lg border border-slate-700 text-xs font-bold transition-all"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="p-4">Data</th>
                <th className="p-4">Turno</th>
                <th className="p-4">IVs Conformes</th>
                <th className="p-4">Investigações PI</th>
                <th className="p-4">Pontuação Total</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm font-medium">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r) => {
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-800/50 transition-colors text-slate-200"
                    >
                      <td className="p-4 font-bold text-white flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>{formatDateDisplay(r.date)}</span>
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-cyan-900/60 text-cyan-300 border border-cyan-700/60">
                          Turno {r.shift}
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`font-bold ${
                            r.ivsScore === 17 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {r.ivsScore} <span className="text-slate-500 font-normal">/ 17</span>
                        </span>
                      </td>

                      <td className="p-4 text-slate-300">+{r.piScore} pts</td>

                      <td className="p-4">
                        <span className="text-base font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30">
                          {r.totalScore} pts
                        </span>
                      </td>

                      <td className="p-4 text-right space-x-2">
                        <button
                          id={`history-view-${r.id}`}
                          onClick={() => setDetailRecord(r)}
                          className="inline-flex items-center space-x-1 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-bold transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>

                        <button
                          id={`history-delete-${r.id}`}
                          onClick={() => setDeleteCandidate(r)}
                          className="inline-flex items-center space-x-1 bg-red-900/40 hover:bg-red-600 text-red-300 hover:text-white px-3 py-1.5 rounded-lg border border-red-700/50 text-xs font-bold transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic text-sm">
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center space-x-3 text-red-500">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white">Confirmar Exclusão</h3>
            </div>

            <p className="text-sm text-slate-300">
              Deseja realmente excluir este lançamento de{' '}
              <strong className="text-white">{formatDateDisplay(deleteCandidate.date)}</strong> do{' '}
              <strong className="text-white">Turno {deleteCandidate.shift}</strong>?
            </p>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1">
              <div>
                Pontuação Total: <strong>{deleteCandidate.totalScore} pontos</strong>
              </div>
              <div>
                IVs Atingidos: <strong>{deleteCandidate.ivsScore} / 17</strong>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                id="modal-cancel-delete-btn"
                onClick={() => setDeleteCandidate(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold border border-slate-700"
              >
                Cancelar
              </button>

              <button
                id="modal-confirm-delete-btn"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-black transition-all shadow-lg shadow-red-600/30"
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Inspection Modal */}
      {detailRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <Clock className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="text-lg font-black text-white">
                    Detalhes do Lançamento IPE
                  </h3>
                  <span className="text-xs text-slate-400">
                    {formatDateDisplay(detailRecord.date)} | Turno {detailRecord.shift}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setDetailRecord(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Summary Banner */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-3 text-center gap-2">
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-bold">IVs Conformes</div>
                <div className="text-xl font-black text-emerald-400">
                  {detailRecord.ivsScore} / 17
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-bold">Investigações</div>
                <div className="text-xl font-black text-cyan-400">+{detailRecord.piScore} pts</div>
              </div>
              <div>
                <div className="text-[11px] text-amber-400 uppercase font-bold">Total Final</div>
                <div className="text-2xl font-black text-amber-400">{detailRecord.totalScore} pts</div>
              </div>
            </div>

            {/* IV Breakdown Grid */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              <h4 className="text-xs font-black uppercase text-slate-300 border-b border-slate-800 pb-1">
                Indicadores de Perda de Extrato (17 IVs)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {IV_METAS.map((meta) => {
                  const rawVal = detailRecord[meta.key] as number | null;
                  const isMet = meta.check(rawVal);

                  return (
                    <div
                      key={meta.key}
                      className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        isMet
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                          : 'bg-red-950/40 border-red-800/60 text-red-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{meta.label}</div>
                        <div className="text-[10px] text-slate-400">Meta: {meta.metaLabel}</div>
                      </div>

                      <div className="flex items-center space-x-1.5 font-mono font-black text-sm">
                        <span>{rawVal !== null ? `${rawVal} ${meta.unit}` : 'N/A'}</span>
                        {isMet ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Problem Solving Breakdown */}
              <h4 className="text-xs font-black uppercase text-slate-300 border-b border-slate-800 pb-1 pt-2">
                Problem Solving (Investigações PI Foco)
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs text-center font-bold">
                <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                  <div className="text-slate-400 text-[10px]">Brassagem</div>
                  <div className="text-sm text-cyan-300">+{detailRecord.pi_brassagem}</div>
                </div>
                <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                  <div className="text-slate-400 text-[10px]">Adega</div>
                  <div className="text-sm text-cyan-300">+{detailRecord.pi_adega}</div>
                </div>
                <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                  <div className="text-slate-400 text-[10px]">Filtração</div>
                  <div className="text-sm text-cyan-300">+{detailRecord.pi_filtracao}</div>
                </div>
              </div>

              {detailRecord.notes && (
                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-400">Observações:</span>
                  <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800 mt-1 italic">
                    "{detailRecord.notes}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setDetailRecord(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg"
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
