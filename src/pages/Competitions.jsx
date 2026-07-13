import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, or } from 'firebase/firestore';
import { Trophy, Plus, Calendar, Target, ChevronRight, MapPin } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

const FINISHED_STATUSES = new Set(['finished', 'completed', 'ended', 'archived']);

const parseDateValue = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value) => {
  const date = parseDateValue(value);
  if (!date) return 'TBD';
  return date.toLocaleDateString('de-DE');
};

const isCompetitionFinished = (comp) => {
  const status = String(comp?.status || '').toLowerCase();
  if (FINISHED_STATUSES.has(status)) return true;

  const endDate = parseDateValue(comp?.endDate);
  if (!endDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return endDate < today;
};

const CompetitionCard = ({ comp, onOpen }) => {
  const status = String(comp?.status || '').toLowerCase();
  const isActive = status === 'active';
  const isFinished = isCompetitionFinished(comp);

  let badgeClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  let badgeLabel = 'DRAFT';

  if (isFinished) {
    badgeClass = 'bg-slate-500/10 text-slate-300 border-slate-500/20';
    badgeLabel = 'ZAVRŠEN';
  } else if (isActive) {
    badgeClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    badgeLabel = 'AKTIVAN';
  } else if (status === 'upcoming' || status === 'scheduled') {
    badgeLabel = 'USKORO';
  }

  return (
    <div
      onClick={onOpen}
      className="group relative bg-[#0f172a] border border-slate-800 rounded-2xl p-4 hover:border-amber-500/50 transition-all cursor-pointer overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3 gap-3">
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl group-hover:bg-amber-500 group-hover:text-black transition-all shrink-0">
            <Trophy className="w-4 h-4 text-amber-500 group-hover:text-black" />
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${badgeClass}`}>
            {badgeLabel}
          </div>
        </div>

        <h3 className="text-sm md:text-base font-black text-white uppercase italic tracking-tight mb-3 line-clamp-2 group-hover:text-amber-500 transition-colors">
          {comp.name || 'Neimenovani turnir'}
        </h3>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-slate-400 min-w-0">
            <Calendar size={13} className="text-amber-500/60 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest truncate">
              {formatDate(comp.startDate)}
              {comp.endDate ? ` - ${formatDate(comp.endDate)}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 min-w-0">
            <MapPin size={13} className="text-amber-500/60 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest truncate">
              {comp.location || 'Nema lokacije'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <Target size={13} className="text-amber-500 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white truncate">
              {comp.sport || 'Padel'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-amber-500 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform shrink-0">
            Detalji <ChevronRight size={13} />
          </div>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-amber-500/10 transition-all" />
    </div>
  );
};

const Competitions = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let q;
    const userRole = userData?.role;

    if (userRole === 'super_admin') {
      q = query(collection(db, 'competitions'));
    } else {
      const filters = [];
      if (user.uid) filters.push(where('ownerUid', '==', user.uid));
      if (user.email) filters.push(where('collaborators', 'array-contains', user.email));

      if (filters.length === 0) {
        setLoading(false);
        return;
      }

      q = query(collection(db, 'competitions'), or(...filters));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      list = list.filter((comp) => comp.type !== 'League');
      setCompetitions(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userData]);

  const { activeOrUpcoming, finished } = useMemo(() => {
    const active = [];
    const done = [];

    competitions.forEach((comp) => {
      if (isCompetitionFinished(comp)) {
        done.push(comp);
      } else {
        active.push(comp);
      }
    });

    const sortByStartDate = (a, b) => {
      const aDate = parseDateValue(a.startDate)?.getTime() ?? Number.POSITIVE_INFINITY;
      const bDate = parseDateValue(b.startDate)?.getTime() ?? Number.POSITIVE_INFINITY;
      return aDate - bDate;
    };

    const sortByRecentEndDate = (a, b) => {
      const aDate = parseDateValue(a.endDate)?.getTime() ?? 0;
      const bDate = parseDateValue(b.endDate)?.getTime() ?? 0;
      return bDate - aDate;
    };

    active.sort(sortByStartDate);
    done.sort(sortByRecentEndDate);

    return {
      activeOrUpcoming: active,
      finished: done
    };
  }, [competitions]);

  const noCompetitions = !loading && competitions.length === 0;

  return (
    <DashboardLayout title="Turniri">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight">Moji Turniri</h1>
            <p className="text-slate-500 text-[10px] md:text-[11px] font-black uppercase tracking-widest mt-1">Kompaktan pregled svih turnira</p>
          </div>
          <button
            onClick={() => navigate('/admin/competitions/new')}
            className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-black px-5 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Novi Turnir
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="w-9 h-9 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Učitavanje podataka...</p>
          </div>
        ) : noCompetitions ? (
          <div className="bg-[#0f172a] border border-slate-800 border-dashed rounded-2xl p-12 text-center">
            <Trophy size={44} className="text-slate-800 mx-auto mb-5" />
            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-2">Nema turnira</h3>
            <p className="text-slate-500 mb-7 max-w-sm mx-auto text-[11px] font-bold uppercase tracking-widest">Kreirajte svoj prvi turnir i započnite sa upravljanjem.</p>
            <button
              onClick={() => navigate('/admin/competitions/new')}
              className="bg-amber-500 hover:bg-amber-600 text-black px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20"
            >
              Započni Odmah
            </button>
          </div>
        ) : (
          <div className="space-y-7">
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm md:text-base font-black text-white uppercase tracking-widest">Trenutni i budući</h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{activeOrUpcoming.length} turnira</span>
              </div>

              {activeOrUpcoming.length === 0 ? (
                <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 text-[10px] uppercase tracking-widest font-black text-slate-400">
                  Trenutno nema aktivnih ili budućih turnira.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {activeOrUpcoming.map((comp) => (
                    <CompetitionCard
                      key={comp.id}
                      comp={comp}
                      onOpen={() => navigate(`/admin/competitions/${comp.id}`)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3 pt-2 border-t border-slate-900/80">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm md:text-base font-black text-slate-300 uppercase tracking-widest">Završeni</h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{finished.length} turnira</span>
              </div>

              {finished.length === 0 ? (
                <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 text-[10px] uppercase tracking-widest font-black text-slate-500">
                  Nema završenih turnira.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {finished.map((comp) => (
                    <CompetitionCard
                      key={comp.id}
                      comp={comp}
                      onOpen={() => navigate(`/admin/competitions/${comp.id}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Competitions;
