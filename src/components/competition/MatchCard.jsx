import React from 'react';

const MatchCard = ({ match, categories, tables, referee, handleMatchClick }) => {
    const isCompleted = match.status === 'completed';
    const isInProgress = match.status === 'in_progress';
    const category = categories.find(c => c.id === match.categoryId);
    
    const p1Name = match.player1Name || match.player1?.name || 'TBD';
    const p2Name = match.player2Name || match.player2?.name || 'TBD';
    const p1Club = match.player1Club || match.player1?.club || 'Ind.';
    const p2Club = match.player2Club || match.player2?.club || 'Ind.';

    return (
        <div 
            onClick={() => handleMatchClick(match)}
            className={`group relative overflow-hidden bg-[#0f172a] rounded-[24px] p-4 border-2 transition-all active:scale-[0.98] cursor-pointer shadow-xl ${
                isInProgress 
                ? 'border-amber-500 shadow-amber-500/10' 
                : isCompleted 
                ? 'border-emerald-500/20 opacity-60' 
                : 'border-slate-800 hover:border-slate-700'
            }`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest border transition-all ${
                            isInProgress 
                            ? 'bg-amber-500 text-black border-amber-400' 
                            : isCompleted 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}>
                            {isInProgress ? 'U TOKU' : isCompleted ? 'ZAVRŠENO' : 'NA ČEKANJU'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter italic">
                            {match.roundName || `RUNDA ${match.round || '-'}`}
                        </span>
                    </div>
                    {category && (
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic decoration-2 underline-offset-4">
                            {category.name}
                        </span>
                    )}
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter block leading-none mb-1 shadow-sm">
                        {tables.find(t => t.id === match.tableId)?.name || 'BEZ TERENA'}
                    </span>
                    {match.isKnockout === false && match.groupId !== undefined && (
                        <span className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1 justify-end">
                            <LayoutGrid size={10} /> GRUPA {String.fromCharCode(65 + (match.groupId || 0))}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 relative">
                <div className="flex-1 min-w-0">
                    <p className={`text-[12px] font-black uppercase tracking-tight line-clamp-1 italic leading-tight ${
                        match.winnerId === (match.player1Id || match.player1?.id) 
                        ? 'text-emerald-500' 
                        : 'text-white'
                    }`}>
                        {p1Name}
                    </p>
                    <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest truncate">{p1Club}</p>
                </div>

                <div className="flex flex-col items-center shrink-0">
                    <div className="flex bg-slate-950 rounded-[18px] border border-slate-800 py-1.5 px-4 shadow-inner">
                        <span className={`text-2xl font-black italic tabular-nums ${match.winnerId === (match.player1Id || match.player1?.id) ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {match.player1Score ?? 0}
                        </span>
                        <span className="text-2xl font-black px-2 text-slate-800 italic">:</span>
                        <span className={`text-2xl font-black italic tabular-nums ${match.winnerId === (match.player2Id || match.player2?.id) ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {match.player2Score ?? 0}
                        </span>
                    </div>
                </div>

                <div className="flex-1 text-right min-w-0">
                    <p className={`text-[12px] font-black uppercase tracking-tight line-clamp-1 italic leading-tight ${
                        match.winnerId === (match.player2Id || match.player2?.id) 
                        ? 'text-emerald-500' 
                        : 'text-white'
                    }`}>
                        {p2Name}
                    </p>
                    <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest truncate">{p2Club}</p>
                </div>
            </div>

            {/* Assignment Indicator with refined styling */}
            {(() => {
                let label = null;
                if (match.refereeId === referee?.id) label = "Vaš Meč (Direktno)";
                else if (referee?.assignedTableId && match.tableId === referee.assignedTableId) label = "Vaš Teren";
                else if (referee?.assignedCategoryId && match.categoryId === referee.assignedCategoryId) {
                    if (referee.assignedGroupId !== undefined && referee.assignedGroupId !== null && match.groupId === referee.assignedGroupId) {
                        label = "Vaša Grupa";
                    } else if (referee.assignedGroupId === undefined || referee.assignedGroupId === null) {
                        label = "Vaša Kategorija";
                    }
                }

                if (!label) return null;

                return (
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                            {label}
                        </span>
                    </div>
                );
            })()}
        </div>
    );
};

export default MatchCard;
