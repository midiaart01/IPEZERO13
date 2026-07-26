import { useState, useMemo } from 'react';
import {
  Trophy,
  Award,
  TrendingUp,
  Calendar,
  Layers,
  BarChart3,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { IPERecord, ShiftType, RankingShiftItem, DashboardStats } from '../types';

interface RankingDashboardProps {
  records: IPERecord[];
}

const SHIFT_COLORS: Record<ShiftType, string> = {
  A: '#0284c7', // Sky blue
  B: '#10b981', // Emerald
  C: '#f59e0b', // Amber
  D: '#8b5cf6', // Purple
};

export default function RankingDashboard({ records }: RankingDashboardProps) {
  // Default to current month YYYY-MM
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Available months extracted from records
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentMonthStr);
    records.forEach((r) => {
      if (r.date && r.date.length >= 7) {
        set.add(r.date.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [records, currentMonthStr]);

  // Filter records by selected month
  const monthRecords = useMemo(() => {
    return records.filter((r) => r.date.startsWith(selectedMonth));
  }, [records, selectedMonth]);

  // Calculate shift ranking
  const rankingData = useMemo<RankingShiftItem[]>(() => {
    const shifts: ShiftType[] = ['A', 'B', 'C', 'D'];

    const summaryMap: Record<
      ShiftType,
      { totalScore: number; totalEntries: number; totalIVs: number; totalPIs: number }
    > = {
      A: { totalScore: 0, totalEntries: 0, totalIVs: 0, totalPIs: 0 },
      B: { totalScore: 0, totalEntries: 0, totalIVs: 0, totalPIs: 0 },
      C: { totalScore: 0, totalEntries: 0, totalIVs: 0, totalPIs: 0 },
      D: { totalScore: 0, totalEntries: 0, totalIVs: 0, totalPIs: 0 },
    };

    monthRecords.forEach((r) => {
      if (summaryMap[r.shift]) {
        summaryMap[r.shift].totalScore += r.totalScore;
        summaryMap[r.shift].totalEntries += 1;
        summaryMap[r.shift].totalIVs += r.ivsScore;
        summaryMap[r.shift].totalPIs += r.piScore;
      }
    });

    const list: RankingShiftItem[] = shifts.map((shift) => {
      const data = summaryMap[shift];
      return {
        shift,
        totalScore: data.totalScore,
        totalEntries: data.totalEntries,
        averageScore: data.totalEntries > 0 ? Math.round((data.totalScore / data.totalEntries) * 10) / 10 : 0,
        totalIVs: data.totalIVs,
        totalPIs: data.totalPIs,
        position: 0,
      };
    });

    // Sort by total score descending
    list.sort((a, b) => b.totalScore - a.totalScore);

    // Assign position
    list.forEach((item, index) => {
      item.position = index + 1;
    });

    return list;
  }, [monthRecords]);

  // Dashboard Stats
  const stats = useMemo<DashboardStats>(() => {
    const leader = rankingData[0];
    const totalEntries = monthRecords.length;

    let avgScore = 0;
    let maxDailyScore = 0;

    if (totalEntries > 0) {
      const sum = monthRecords.reduce((acc, cur) => acc + cur.totalScore, 0);
      avgScore = Math.round((sum / totalEntries) * 10) / 10;
      maxDailyScore = Math.max(...monthRecords.map((r) => r.totalScore));
    }

    return {
      leaderShift: leader && leader.totalScore > 0 ? leader.shift : '-',
      leaderScore: leader ? leader.totalScore : 0,
      totalEntriesMonth: totalEntries,
      avgScoreMonth: avgScore,
      maxDailyScoreMonth: maxDailyScore,
    };
  }, [rankingData, monthRecords]);

  // Data for Charts
  // 1. Bar Chart Data
  const barData = useMemo(() => {
    return rankingData.map((item) => ({
      name: `Turno ${item.shift}`,
      Pontos: item.totalScore,
      IVs: item.totalIVs,
      Investigações: item.totalPIs,
      fill: SHIFT_COLORS[item.shift],
    }));
  }, [rankingData]);

  // 2. Line Chart Data (Daily Evolution)
  const lineData = useMemo(() => {
    const dateMap: Record<string, Record<ShiftType, number>> = {};

    monthRecords.forEach((r) => {
      if (!dateMap[r.date]) {
        dateMap[r.date] = { A: 0, B: 0, C: 0, D: 0 };
      }
      dateMap[r.date][r.shift] = r.totalScore;
    });

    const dates = Object.keys(dateMap).sort();

    return dates.map((d) => {
      // Format day readable DD/MM
      const parts = d.split('-');
      const formattedDate = `${parts[2]}/${parts[1]}`;
      return {
        date: formattedDate,
        fullDate: d,
        A: dateMap[d].A || null,
        B: dateMap[d].B || null,
        C: dateMap[d].C || null,
        D: dateMap[d].D || null,
      };
    });
  }, [monthRecords]);

  // 3. Pie Chart Data (Share)
  const pieData = useMemo(() => {
    const totalPointsAll = rankingData.reduce((acc, cur) => acc + cur.totalScore, 0);
    if (totalPointsAll === 0) return [];

    return rankingData
      .filter((item) => item.totalScore > 0)
      .map((item) => ({
        name: `Turno ${item.shift}`,
        value: item.totalScore,
        pct: Math.round((item.totalScore / totalPointsAll) * 100),
        color: SHIFT_COLORS[item.shift],
      }));
  }, [rankingData]);

  // Month Display Name (e.g., "Julho de 2026")
  const formattedMonthName = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthName = dateObj.toLocaleString('pt-BR', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;
  }, [selectedMonth]);

  const getPodiumBadge = (position: number) => {
    switch (position) {
      case 1:
        return <span className="text-2xl sm:text-3xl">🥇</span>;
      case 2:
        return <span className="text-2xl sm:text-3xl">🥈</span>;
      case 3:
        return <span className="text-2xl sm:text-3xl">🥉</span>;
      default:
        return <span className="text-lg font-black text-slate-400">4º</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Month Selector Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900 text-white p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-100">
              Ranking Mensal por Turno
            </h2>
            <p className="text-xs sm:text-sm text-cyan-400 font-medium">
              Acompanhamento oficial de desempenho IPE ({formattedMonthName})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
          <Calendar className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />
          <label htmlFor="ranking-month-select" className="text-xs font-bold text-slate-300">
            Mês:
          </label>
          <select
            id="ranking-month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-900 text-white font-bold text-sm px-3 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            {availableMonths.map((m) => {
              const [y, mo] = m.split('-');
              const d = new Date(parseInt(y), parseInt(mo) - 1, 1);
              const label = `${d.toLocaleString('pt-BR', { month: 'long' })} / ${y}`;
              return (
                <option key={m} value={m}>
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Líder do Mês */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Líder do Mês
            </span>
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-400">
              {stats.leaderShift !== '-' ? `Turno ${stats.leaderShift}` : '-'}
            </span>
            {stats.leaderScore > 0 && (
              <span className="text-xs font-bold text-slate-300">({stats.leaderScore} pts)</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Primeira posição do ranking mensal</p>
        </div>

        {/* Card 2: Total Lançamentos */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Total de Lançamentos
            </span>
            <Layers className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="mt-3 text-3xl font-black text-white">{stats.totalEntriesMonth}</div>
          <p className="text-[11px] text-slate-400 mt-1">Registros computados no mês</p>
        </div>

        {/* Card 3: Pontuação Média */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Pontuação Média
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-black text-emerald-400">
            {stats.avgScoreMonth}{' '}
            <span className="text-xs font-normal text-slate-400">pts/turno</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Média geral dos turnos lançados</p>
        </div>

        {/* Card 4: Maior Pontuação Diária */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Maior Pontuação
            </span>
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <div className="mt-3 text-3xl font-black text-purple-400">
            {stats.maxDailyScoreMonth}{' '}
            <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Recorde diário individual no mês</p>
        </div>
      </div>

      {/* Podium & Ranking List Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <h3 className="text-lg font-extrabold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>Classificação dos Turnos ({formattedMonthName})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rankingData.map((item) => {
            const isLeader = item.position === 1 && item.totalScore > 0;
            return (
              <div
                key={item.shift}
                className={`p-5 rounded-xl border transition-all flex flex-col justify-between relative ${
                  isLeader
                    ? 'bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/50 shadow-amber-500/10 shadow-lg'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getPodiumBadge(item.position)}
                    <div>
                      <h4 className="text-lg font-black text-white">Turno {item.shift}</h4>
                      <span className="text-xs text-slate-400 font-medium">
                        {item.totalEntries} {item.totalEntries === 1 ? 'lançamento' : 'lançamentos'}
                      </span>
                    </div>
                  </div>

                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: SHIFT_COLORS[item.shift] }}
                  ></span>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 font-bold uppercase">Pontuação:</span>
                  <span className="text-2xl font-black text-white">
                    {item.totalScore}{' '}
                    <span className="text-xs font-normal text-slate-400">pontos</span>
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-400 flex justify-between">
                  <span>Média: {item.averageScore} pts</span>
                  <span>
                    IVs: {item.totalIVs} | PI: +{item.totalPIs}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Ranking por Turno (Barras) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <span>Pontuação Total por Turno</span>
            </h3>
            <span className="text-xs text-slate-400">Gráfico de Barras</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="Pontos" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Participação Percentual (Pizza) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
              <PieIcon className="w-5 h-5 text-amber-400" />
              <span>Participação Percentual dos Turnos</span>
            </h3>
            <span className="text-xs text-slate-400">Distribuição Mês</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, pct }) => `${name} (${pct}%)`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend tick={{ fill: '#94a3b8', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-sm italic">
                Nenhum dado cadastrado para este mês.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chart 3: Evolução Diária (Linhas) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Evolução Diária de Pontuação por Turno</span>
          </h3>
          <span className="text-xs text-slate-400">Histórico do Mês</span>
        </div>

        <div className="h-72 w-full">
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="A"
                  name="Turno A"
                  stroke={SHIFT_COLORS.A}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="B"
                  name="Turno B"
                  stroke={SHIFT_COLORS.B}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="C"
                  name="Turno C"
                  stroke={SHIFT_COLORS.C}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="D"
                  name="Turno D"
                  stroke={SHIFT_COLORS.D}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
              Nenhum dado registrado para o mês selecionado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
