import React from 'react';
import { Share2, MapPin, Calendar, Users, DollarSign, CheckCircle, ClockIcon, ExternalLink, Link2, PlayCircle } from 'lucide-react';
import { formatDate } from '../utils';
import Countdown from '../UI/Countdown';

const CompetitionHeader = ({ competition, onShare, publicSocialLinks = [], publicVideoBanners = [] }) => {
  const parseDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const now = new Date();
  const startDateObj = parseDate(competition?.startDate);
  const endDateObj = parseDate(competition?.endDate) || startDateObj;
  const registrationDeadlineObj = parseDate(competition?.registration?.deadline);

  const tournamentNotStarted = !!(startDateObj && startDateObj.getTime() > now.getTime());
  const tournamentFinished = !!(
    endDateObj &&
    new Date(
      endDateObj.getFullYear(),
      endDateObj.getMonth(),
      endDateObj.getDate(),
      23,
      59,
      59,
      999
    ).getTime() < now.getTime()
  );

  const registrationVisible = competition?.registration?.show !== false;
  const registrationOpen = competition?.registration?.isOpen === true;
  const hasRegistrationLink = !!competition?.registration?.link;
  const hasFutureRegistrationDeadline = !!(
    registrationDeadlineObj && registrationDeadlineObj.getTime() > now.getTime()
  );

  const showTournamentCountdownCard = tournamentNotStarted && !!startDateObj;
  const showRegistrationDeadlineCountdownCard = registrationVisible && hasFutureRegistrationDeadline;
  const showRegistrationCard = registrationVisible && (registrationOpen || hasRegistrationLink || showTournamentCountdownCard);
  const showRightPanel = !tournamentFinished && (showTournamentCountdownCard || showRegistrationDeadlineCountdownCard || showRegistrationCard);

  const dateRange = `${formatDate(competition?.startDate)}${competition?.endDate && competition?.endDate !== competition?.startDate ? ` - ${formatDate(competition?.endDate)}` : ''}`;
  const infoRows = [
    { label: 'Lokacija', value: competition?.location, icon: <MapPin size={14} /> },
    { label: 'Datum', value: (competition?.startDate || competition?.endDate) ? dateRange : null, icon: <Calendar size={14} /> },
    { label: 'Organizator', value: competition?.organizer, icon: <Users size={14} /> },
    { label: 'Kotizacija', value: competition?.entryFee, icon: <DollarSign size={14} /> },
    { label: 'Direktor', value: competition?.director, icon: <Users size={14} /> },
    { label: 'Vrhovni sudija', value: competition?.referee, icon: <Users size={14} /> },
    { label: 'Telefon', value: competition?.contact?.phone, icon: <Users size={14} /> },
    { label: 'Email', value: competition?.contact?.email, icon: <Users size={14} /> }
  ].filter((item) => item.value);

  return (
    <header className="relative border-b border-slate-800/60 bg-gradient-to-b from-[#0b1220] to-[#070b14]">
      <div className="container mx-auto px-4 py-6 md:py-8 relative z-10">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl overflow-hidden">
          <div className="flex flex-col xl:flex-row">
            <div className={`flex-1 p-5 md:p-7 border-b ${showRightPanel ? 'xl:border-b-0 xl:border-r' : 'xl:border-b-0'} border-slate-800`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black tracking-[0.2em] uppercase text-amber-300">
                  Javna stranica turnira
                </span>
                <button
                  onClick={onShare}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:border-slate-500 transition-all"
                >
                  <Share2 size={14} className="text-amber-400" /> Podijeli
                </button>
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tight">
                {competition?.name || 'Turnir'}
              </h1>

              {competition?.description && (
                <p className="mt-4 text-sm text-slate-300 leading-relaxed max-w-3xl">
                  {competition.description}
                </p>
              )}

              <div className="mt-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-3">Informacije o turniru</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {infoRows.length > 0 ? (
                    infoRows.map((item) => <InfoChip key={item.label} icon={item.icon} label={item.label} value={item.value} />)
                  ) : (
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                      Nema dodatnih informacija.
                    </div>
                  )}
                </div>
              </div>

              {(publicVideoBanners.length > 0 || publicSocialLinks.length > 0) && (
                <div className="mt-5 space-y-3">
                  {publicVideoBanners.length > 0 && (
                    <div>
                      <p className="text-[10px] text-red-300 font-black uppercase tracking-[0.2em] mb-2">Live Stream Linkovi</p>
                      <div className="flex flex-wrap gap-2.5">
                        {publicVideoBanners.map((item, index) => (
                          <a
                            key={`${item.url}-${index}`}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group w-full sm:w-[320px] xl:w-[300px] shrink-0 rounded-xl border border-red-500/30 bg-gradient-to-r from-red-500/12 via-red-400/5 to-amber-400/10 p-3.5 hover:border-red-400/50 transition-all"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[9px] text-red-300 font-black uppercase tracking-[0.18em] mb-1">YouTube Live</p>
                                <p className="text-sm font-black text-white uppercase tracking-tight truncate">{item.title}</p>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-red-500 text-white flex items-center justify-center shrink-0">
                                <PlayCircle size={16} />
                              </div>
                            </div>
                            <div className="mt-2 text-[10px] text-slate-200 font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                              Otvori <ExternalLink size={12} />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {publicSocialLinks.length > 0 && (
                    <div>
                      <p className="text-[10px] text-cyan-300 font-black uppercase tracking-[0.2em] mb-2">Ostali Linkovi</p>
                      <div className="flex flex-wrap gap-2">
                        {publicSocialLinks.map((item, index) => (
                          <a
                            key={`${item.url}-${index}`}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-cyan-400/30 bg-slate-950/70 text-slate-100 hover:border-cyan-300 hover:text-cyan-200 transition-all text-[11px] font-bold uppercase tracking-wider"
                          >
                            <Link2 size={13} />
                            <span className="truncate max-w-[190px]">{item.label}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {showRightPanel && (
            <div className="w-full xl:w-[360px] p-5 md:p-7 bg-slate-950/50 space-y-4">
              {showTournamentCountdownCard && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                  <p className="text-[10px] text-amber-300 font-black uppercase tracking-[0.2em] mb-3">Početak za</p>
                  <Countdown targetDate={startDateObj.toISOString()} />
                </div>
              )}

              {showRegistrationDeadlineCountdownCard && (
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                  <p className="text-[10px] text-cyan-300 font-black uppercase tracking-[0.2em] mb-3">Prijave se zatvaraju za</p>
                  <Countdown targetDate={registrationDeadlineObj.toISOString()} />
                </div>
              )}

              {showRegistrationCard && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                  {registrationOpen ? (
                    <>
                      <div className="flex items-center gap-2 text-emerald-300 mb-3">
                        <CheckCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.18em]">Prijave otvorene</span>
                      </div>
                      <button
                        onClick={() => competition.registration.link && window.open(competition.registration.link, '_blank')}
                        className="w-full px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black uppercase tracking-[0.16em] transition-colors"
                      >
                        Prijavi se
                      </button>
                      {competition.registration.deadline && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <ClockIcon size={12} /> Rok: {formatDate(competition.registration.deadline)}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-4 text-slate-300 text-[11px] font-black uppercase tracking-wider">
                      <ClockIcon size={14} className="text-slate-500" /> Prijave zatvorene
                    </div>
                  )}
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const InfoChip = ({ icon, label, value }) => {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 min-w-0">
      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-300 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">{label}</p>
        <p className="text-[12px] text-slate-200 font-semibold truncate">{value}</p>
      </div>
    </div>
  );
};

export default CompetitionHeader;
