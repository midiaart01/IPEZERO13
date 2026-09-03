export default function IPEBadge() {
  return (
    <div className="flex items-center space-x-2 bg-slate-900 text-white p-2 px-3 rounded-lg border-2 border-amber-500/60 shadow-md">
      <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-slate-900 font-black text-slate-950 text-xs shadow-inner">
        <div className="text-center leading-none">
          <div className="text-[10px] uppercase font-bold tracking-tighter">ZERO</div>
          <div className="text-[11px] font-black tracking-widest text-white drop-shadow">IPE</div>
        </div>
      </div>
      <div className="flex flex-col text-left">
        <span className="text-xs font-black tracking-wider text-amber-400 uppercase">
          IPE ABAIXO DE 0
        </span>
        <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-tight">
          Eficiência & Perda Zero
        </span>
      </div>
    </div>
  );
}
