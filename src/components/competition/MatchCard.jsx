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
            className={`group relative overflow-hidden bg-slate-900 rounded-2xl p-3 sm:p-4 border-2 transition-all active:scale-[0.98] ${
                isInProgress 
                ? 'border-blue-600 shadow-xl shadow-blue-600/10' 
                : isCompleted 
                ? 'border-transparent opacity-40' 
                : 'border-slate-800 hover:border-slate-700'
            }`}
        >
            <div className="flex justify-between items-start mb-2 sm:mb-3">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${
                            isInProgress ? 'bg-blue-600 text-white' : isCompleted ? 'bg-slate-800 text-slate-500' : 'bg-slate-800 text-slate-400'
                        }`}>
                            {isInProgress ? 'U TOKU' : isCompleted ? 'KRAJ' : 'PEND'}
                        </span>
                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-tighter">
                            {match.roundName || `R ${match.round || '-'}`}
                        </span>
                    </div>
                    {category && (
                        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tight">
                            {category.name}
                        </span>
                    )}
                </div>
                <div className="text-right">
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter block leading-none mb-1">
                        {tables.find(t => t.id === match.tableId)?.name || 'Bez stola'}
                    </span>
                    {match.isKnockout === false && match.groupId !== undefined && (
                        <span className="text-[8px] font-black text-slate-600 uppercase">
                            Gr. {String.fromCharCode(65 + (match.groupId || 0))}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between gap-1 sm:gap-4">
                <div className="flex-1 text-center min-w-0">
                    <p className={`text-[11px] sm:text-xs font-black uppercase tracking-tighter line-clamp-2 leading-tight mb-0.5 ${
                        match.winnerId === (match.player1Id || match.player1?.id) 
                        ? 'text-emerald-500' 
                        : 'text-blue-500'
                    }`}>
                        {p1Name}
                    </p>
                </div>

                <div className="flex flex-col items-center shrink-0 px-1">
                    <div className="flex bg-slate-950 rounded-xl sm:rounded-2xl border-2 border-white/5 py-1 px-2 sm:py-2 sm:px-4 shadow-inner">
                        <span className={`text-base sm:text-2xl font-black tabular-nums ${match.winnerId === (match.player1Id || match.player1?.id) ? 'text-emerald-500' : 'text-white'}`}>
                            {match.player1Score ?? 0}
                        </span>
                        <span className="text-base sm:text-2xl font-black px-1 sm:px-2 text-slate-800">:</span>
                        <span className={`text-base sm:text-2xl font-black tabular-nums ${match.winnerId === (match.player2Id || match.player2?.id) ? 'text-emerald-500' : 'text-white'}`}>
                            {match.player2Score ?? 0}
                        </span>
                    </div>
                </div>

                <div className="flex-1 text-center min-w-0">
                    <p className={`text-[11px] sm:text-xs font-black uppercase tracking-tighter line-clamp-2 leading-tight mb-0.5 ${
                        match.winnerId === (match.player2Id || match.player2?.id) 
                        ? 'text-emerald-500' 
                        : 'text-slate-100'
                    }`}>
                        {p2Name}
                    </p>
                </div>
            </div>

            {/* Assignment Indicator */}
            {(() => {
                let label = null;
                if (match.refereeId === referee?.id) label = "Vaš Meč (Direktno)";
                else if (referee?.assignedTableId && match.tableId === referee.assignedTableId) label = "Vaš Stol";
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
