import { useState, useEffect, useCallback } from 'react';
import HeaderNav from './components/HeaderNav';
import LaunchForm from './components/LaunchForm';
import RankingDashboard from './components/RankingDashboard';
import HistoryTable from './components/HistoryTable';
import ManagerPanel from './components/ManagerPanel';
import { IPERecord } from './types';
import { fetchRecords, subscribeToRecords } from './lib/recordsService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'launch' | 'ranking' | 'history' | 'manager'>('launch');
  const [records, setRecords] = useState<IPERecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Subscribe to real-time Firestore changes so all tabs / incognito windows see additions instantly
  useEffect(() => {
    const unsubscribe = subscribeToRecords((data) => {
      setRecords(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchRecords();
      setRecords(data);
    } catch (err) {
      console.error('Erro ao buscar lançamentos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSaveSuccess = () => {
    loadData();
  };

  const handleRecordDeleted = () => {
    loadData();
  };

  const handleDataReset = () => {
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Navigation Header */}
      <HeaderNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 py-6 px-2 sm:px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-400">Carregando dados do sistema IPE em tempo real...</p>
          </div>
        ) : (
          <>
            {activeTab === 'launch' && (
              <LaunchForm onSaveSuccess={handleSaveSuccess} existingRecords={records} />
            )}

            {activeTab === 'ranking' && <RankingDashboard records={records} />}

            {activeTab === 'history' && (
              <HistoryTable
                records={records}
                onRecordDeleted={handleRecordDeleted}
                onRecordUpdated={handleSaveSuccess}
              />
            )}

            {activeTab === 'manager' && (
              <ManagerPanel records={records} onDataReset={handleDataReset} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-4 px-6 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-300">
            Controle de Indicadores IPE &copy; {new Date().getFullYear()} — Operações Industriais
          </p>
          <div className="flex items-center space-x-4 text-slate-400 text-[11px]">
            <span>Turnos A, B, C, D</span>
            <span>•</span>
            <span>IPE Abaixo de 0</span>
            <span>•</span>
            <span>Problem Solving</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
