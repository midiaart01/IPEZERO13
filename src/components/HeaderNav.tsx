import { ClipboardList, Trophy, History, ShieldCheck } from 'lucide-react';

interface HeaderNavProps {
  activeTab: 'launch' | 'ranking' | 'history' | 'manager';
  setActiveTab: (tab: 'launch' | 'ranking' | 'history' | 'manager') => void;
}

export default function HeaderNav({ activeTab, setActiveTab }: HeaderNavProps) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-md bg-cyan-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-md">
              IPE
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight leading-tight">
                Controle de Indicadores IPE
              </h1>
              <p className="text-[11px] text-cyan-400 font-medium">
                Gestão Industrial & Pontuação por Turno
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              id="nav-launch-btn"
              onClick={() => setActiveTab('launch')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'launch'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>🏠 Lançamento</span>
            </button>

            <button
              id="nav-ranking-btn"
              onClick={() => setActiveTab('ranking')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'ranking'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>🏆 Ranking</span>
            </button>

            <button
              id="nav-history-btn"
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>📋 Histórico</span>
            </button>

            <button
              id="nav-manager-btn"
              onClick={() => setActiveTab('manager')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'manager'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">⚙️ Gestão</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
