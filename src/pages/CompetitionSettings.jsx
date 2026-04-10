import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  ArrowLeft, Save, Globe, Lock, Calendar, MapPin, 
  Info, Shield, Phone, Mail, LinkIcon, Clock, 
  Settings2, FileText, Award, DollarSign, Users, X, ExternalLink
} from 'lucide-react';

const CompetitionSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [competition, setCompetition] = useState(null);

  // Form State
  const [compName, setCompName] = useState('');
  const [compSlug, setCompSlug] = useState('');
  const [compStartDate, setCompStartDate] = useState('');
  const [compEndDate, setCompEndDate] = useState('');
  const [compLocation, setCompLocation] = useState('');
  const [compOrganizer, setCompOrganizer] = useState('');
  const [compDirector, setCompDirector] = useState('');
  const [compReferee, setCompReferee] = useState('');
  const [compDescription, setCompDescription] = useState('');
  const [compRules, setCompRules] = useState('');
  const [compEntryFee, setCompEntryFee] = useState('');
  const [compPrizes, setCompPrizes] = useState('');
  const [compSchedule, setCompSchedule] = useState('');
  const [compContactPhone, setCompContactPhone] = useState('');
  const [compContactEmail, setCompContactEmail] = useState('');
  const [compContactAddress, setCompContactAddress] = useState('');
  const [regIsOpen, setRegIsOpen] = useState(false);
  const [showRegistration, setShowRegistration] = useState(true);
  const [regLink, setRegLink] = useState('');
  const [regDeadline, setRegDeadline] = useState('');
  const [compSetsToWin, setCompSetsToWin] = useState(2);
  const [compWinPoints, setCompWinPoints] = useState(2);
  const [compLossPoints, setCompLossPoints] = useState(0);
  const [compAdvancingPlayers, setCompAdvancingPlayers] = useState(2);
  const [collaborators, setCollaborators] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [newCollabEmail, setNewCollabEmail] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    const fetchCompetition = async () => {
      if (!id || !user) return;
      
      try {
        const compRef = doc(db, "competitions", id);
        const compSnap = await getDoc(compRef);
        
        if (compSnap.exists()) {
          const compData = { id: compSnap.id, ...compSnap.data() };
          setCompetition(compData);
          setCompName(compData.name || '');
          setCompSlug(compData.slug || '');
          setCompStartDate(compData.startDate || '');
          setCompEndDate(compData.endDate || '');
          setCompLocation(compData.location || '');
          setCompOrganizer(compData.organizer || '');
          setCompDirector(compData.director || '');
          setCompReferee(compData.referee || '');
          setCompDescription(compData.description || '');
          setCompRules(compData.rules || '');
          setCompEntryFee(compData.entryFee || '');
          setCompPrizes(compData.prizes || '');
          setCompSchedule(compData.schedule || '');
          setCompContactPhone(compData.contact?.phone || '');
          setCompContactEmail(compData.contact?.email || '');
          setCompContactAddress(compData.contact?.address || '');
          setRegIsOpen(compData.registration?.isOpen || false);
          setShowRegistration(compData.registration?.show !== false);
          setRegLink(compData.registration?.link || '');
          setRegDeadline(compData.registration?.deadline || '');
          setCompSetsToWin(compData.defaultSettings?.setsToWin || 2);
          setCompWinPoints(compData.defaultSettings?.winPoints || 2);
          setCompLossPoints(compData.defaultSettings?.lossPoints || 0);
          setCompAdvancingPlayers(compData.defaultSettings?.advancingPlayers || 2);
          setCollaborators(compData.collaborators || []);
          setIsPublic(compData.isPublic || false);
          setAvailableCategories(compData.availableCategories || []);
        }
      } catch (err) {
        console.error("Error fetching competition:", err);
        alert("Greška pri učitavanju takmičenja.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompetition();
  }, [id, user]);

  const handleSave = async () => {
    if (!compName.trim()) {
      alert("Naziv takmičenja je obavezan.");
      return;
    }
    
    setSaving(true);
    try {
      const slugVal = compSlug.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
      const updateData = {
        name: compName.trim(),
        slug: slugVal,
        startDate: compStartDate || null,
        endDate: compEndDate || null,
        location: compLocation || '',
        organizer: compOrganizer || '',
        director: compDirector || '',
        referee: compReferee || '',
        description: compDescription || '',
        rules: compRules || '',
        entryFee: compEntryFee || '',
        prizes: compPrizes || '',
        schedule: compSchedule || '',
        contact: {
          phone: compContactPhone || '',
          email: compContactEmail || '',
          address: compContactAddress || ''
        },
        registration: {
          isOpen: regIsOpen,
          show: showRegistration,
          link: regLink || '',
          deadline: regDeadline || null
        },
        defaultSettings: {
          setsToWin: Number(compSetsToWin),
          winPoints: Number(compWinPoints),
          lossPoints: Number(compLossPoints),
          advancingPlayers: Number(compAdvancingPlayers)
        },
        collaborators: collaborators,
        isPublic: isPublic,
        availableCategories: availableCategories,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, "competitions", id), updateData);
      alert("Postavke su uspješno sačuvane!");
      navigate(`/admin/competitions/${id}`);
    } catch (err) {
      console.error("Error updating competition:", err);
      alert("Greška pri ažuriranju postavki.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublic = async () => {
    try {
      await updateDoc(doc(db, "competitions", id), {
        isPublic: !isPublic,
        updatedAt: serverTimestamp()
      });
      setIsPublic(!isPublic);
    } catch (err) {
      console.error("Error toggling public:", err);
      alert("Greška pri promjeni vidljivosti.");
    }
  };

  const addCollaborator = () => {
    if (!newCollabEmail.trim()) return;
    if (collaborators.includes(newCollabEmail.trim())) {
      alert("Ovaj saradnik je već dodan.");
      setNewCollabEmail('');
      return;
    }
    setCollaborators([...collaborators, newCollabEmail.trim()]);
    setNewCollabEmail('');
  };

  const removeCollaborator = (email) => {
    setCollaborators(collaborators.filter(c => c !== email));
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    if (availableCategories.some(cat => cat.toLowerCase() === newCategory.trim().toLowerCase())) {
      alert("Ova kategorija je već dodana.");
      setNewCategory('');
      return;
    }
    setAvailableCategories([...availableCategories, newCategory.trim()]);
    setNewCategory('');
  };

  const removeCategory = (category) => {
    setAvailableCategories(availableCategories.filter(c => c !== category));
  };

  if (loading) {
    return (
      <DashboardLayout title="Postavke Takmičenja">
        <div className="flex items-center justify-center py-20">
          <div className="text-blue-500 animate-pulse font-black uppercase tracking-widest">Učitavanje...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!competition) {
    return (
      <DashboardLayout title="Postavke Takmičenja">
        <div className="max-w-4xl mx-auto text-center py-20">
          <p className="text-slate-500">Takmičenje nije pronađeno.</p>
          <button 
            onClick={() => navigate('/admin/competitions')}
            className="mt-4 text-blue-500 font-bold uppercase text-xs hover:underline"
          >
            Nazad na listu
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Postavke - ${competition.name}`}>
      <div className="max-w-5xl mx-auto pb-20">
        <button 
          onClick={() => navigate(`/admin/competitions/${id}`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Nazad na takmičenje
        </button>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
                  <Settings2 size={26} />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-100 uppercase italic tracking-tighter">Postavke Takmičenja</h1>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{competition.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {isPublic ? <Globe size={16} className="text-emerald-500" /> : <Lock size={16} className="text-slate-500" />}
                  <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${isPublic ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                    {isPublic ? 'JAVNO' : 'PRIVATNO'}
                  </span>
                </div>
                <button 
                  onClick={handleTogglePublic}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    isPublic 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {isPublic ? 'Sakrij' : 'Objavi'}
                </button>
              </div>
            </div>

            {/* Public Link Section - Only visible when public */}
            {isPublic && (
              <div className="mt-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3 overflow-hidden w-full">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                    <LinkIcon size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Javni Link Takmičenja</p>
                    <p className="text-xs text-slate-100 font-bold truncate">
                      {`${window.location.origin}/p/${compSlug || id}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/p/${compSlug || id}`);
                      alert("Link kopiran u međuspremnik!");
                    }}
                    className="flex-1 md:flex-none px-4 py-2.5 bg-slate-950 border border-emerald-500/30 text-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/10 transition-all"
                  >
                    Kopiraj
                  </button>
                  <a 
                    href={`/p/${compSlug || id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 text-center flex items-center justify-center gap-2"
                  >
                    Otvori <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 space-y-7">
            {/* Osnovne Informacije */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Info size={18} className="text-blue-500" />
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">Osnovne Informacije</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Naziv Takmičenja *</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all "
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">URL Link (Slug)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      pingpong.ba/p/
                    </span>
                    <input 
                      type="text" 
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-40 pr-4 text-amber-400 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all "
                      value={compSlug}
                      onChange={(e) => setCompSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      placeholder="memorijalni-turnir-2024"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium px-1 mt-1.5">
                    Prilagođeni URL link za javnu stranicu turnira. Koristite mala slova, brojeve i crtice.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Lokacija / Dvorana</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all "
                      value={compLocation}
                      onChange={(e) => setCompLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Organizator</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all "
                    value={compOrganizer}
                    onChange={(e) => setCompOrganizer(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Direktor Turnira</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all "
                    value={compDirector}
                    onChange={(e) => setCompDirector(e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Vrhovni Sudija</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all "
                    value={compReferee}
                    onChange={(e) => setCompReferee(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Datum Početka</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-100 font-bold outline-none "
                      value={compStartDate}
                      onChange={(e) => setCompStartDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Datum Završetka</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-100 font-bold outline-none "
                      value={compEndDate}
                      onChange={(e) => setCompEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Opis i Propozicije */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Shield size={18} className="text-emerald-500" />
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">Opis i Propozicije</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Opis Turnira</label>
                  <textarea 
                    rows={3}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none "
                    value={compDescription}
                    onChange={(e) => setCompDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Pravila i Sistemi (Propozicije)</label>
                  <textarea 
                    rows={6}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none "
                    value={compRules}
                    onChange={(e) => setCompRules(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Kotizacija</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all "
                      value={compEntryFee}
                      onChange={(e) => setCompEntryFee(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nagrade</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all "
                      value={compPrizes}
                      onChange={(e) => setCompPrizes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Raspored (Satnica)</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none "
                    value={compSchedule}
                    onChange={(e) => setCompSchedule(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Kontakt Podaci */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Phone size={18} className="text-amber-500" />
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">Kontakt Podaci</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Kontakt Telefon</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-100 font-bold outline-none "
                      value={compContactPhone}
                      onChange={(e) => setCompContactPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Kontakt Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-100 font-bold outline-none "
                      value={compContactEmail}
                      onChange={(e) => setCompContactEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Puna Adresa</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all "
                    value={compContactAddress}
                    onChange={(e) => setCompContactAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Postavke Prijava */}
            <div className="space-y-6 bg-slate-950/40 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <LinkIcon size={18} className="text-amber-500" />
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">Postavke Prijava</h3>
                  </div>
                  
                  {/* Global Show/Hide Toggle */}
                  <div className="flex items-center gap-2 border-l border-slate-800 pl-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${showRegistration ? 'text-amber-400' : 'text-slate-400'}`}>
                      Prikaži sekciju
                    </span>
                    <button 
                      type="button"
                      onClick={() => setShowRegistration(!showRegistration)}
                      className={`w-10 h-5 rounded-full p-1 transition-colors relative ${showRegistration ? 'bg-amber-500' : 'bg-slate-700'}`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${showRegistration ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${regIsOpen ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {regIsOpen ? 'Otvoreno' : 'Zatvoreno'}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setRegIsOpen(!regIsOpen)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors relative ${regIsOpen ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${regIsOpen ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Link za prijavu</label>
                  <input 
                    disabled={!regIsOpen || !showRegistration}
                    type="text" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none disabled:opacity-50 "
                    value={regLink}
                    onChange={(e) => setRegLink(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Rok za prijavu</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      disabled={!regIsOpen || !showRegistration}
                      type="date" 
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-100 font-bold outline-none disabled:opacity-50 "
                      value={regDeadline}
                      onChange={(e) => setRegDeadline(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dostupne Kategorije za Prijave */}
            <div className="space-y-6 bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/15">
              <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-4">
                <Award size={18} className="text-emerald-500" />
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">Dostupne Kategorije za Prijave</h3>
              </div>

              <p className="text-xs text-slate-400 font-medium">
                Dodajte kategorije koje će biti dostupne za prijave na javnoj stranici turnira (npr. "Muški Singl", "Ženski Singl", "Mlađi Pioniri", itd.)
              </p>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Unesite naziv kategorije..."
                  className="flex-1 bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all "
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                />
                <button 
                  type="button"
                  onClick={addCategory}
                  className="px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-emerald-600/20"
                >
                  Dodaj
                </button>
              </div>

              {availableCategories.length > 0 && (
                <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800">
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map((category, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-2 bg-emerald-500/15 text-emerald-300 px-4 py-2 rounded-lg font-bold text-sm border border-emerald-500/20"
                      >
                        <Award size={14} />
                        <span>{category}</span>
                        <button 
                          type="button"
                          onClick={() => removeCategory(category)}
                          className="ml-1 text-emerald-400 hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {availableCategories.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Award size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold uppercase tracking-widest">Nema dodanih kategorija</p>
                </div>
              )}
            </div>

            {/* Pravila Mečeva */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Settings2 size={18} className="text-slate-500" />
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">Podrazumijevana Pravila Mečeva</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 text-center block">Setova do pobjede</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-black text-center outline-none "
                    value={compSetsToWin}
                    onChange={(e) => setCompSetsToWin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 text-center block">Pobjeda (Bodovi)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-black text-center outline-none "
                    value={compWinPoints}
                    onChange={(e) => setCompWinPoints(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 text-center block">Poraz (Bodovi)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-black text-center outline-none "
                    value={compLossPoints}
                    onChange={(e) => setCompLossPoints(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 text-center block">Prolazi iz grupe</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-black text-center outline-none "
                    value={compAdvancingPlayers}
                    onChange={(e) => setCompAdvancingPlayers(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide px-1 italic">
                * Ove postavke će biti primijenjene samo na novo kreirane kategorije.
              </p>
            </div>

            {/* Saradnici */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Users size={18} className="text-purple-500" />
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">Saradnici (Pristup)</h3>
              </div>

              <div className="flex gap-2">
                <input 
                  type="email" 
                  className="flex-1 bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all "
                  value={newCollabEmail}
                  onChange={(e) => setNewCollabEmail(e.target.value)}
                  placeholder="email@example.com"
                  onKeyPress={(e) => e.key === 'Enter' && addCollaborator()}
                />
                <button 
                  onClick={addCollaborator}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-200 px-8 rounded-xl font-black uppercase text-xs tracking-widest transition-all border border-slate-700"
                >
                  Dodaj
                </button>
              </div>

              <div className="space-y-2">
                {collaborators.map((email) => (
                  <div key={email} className="flex items-center justify-between bg-slate-950/70 border border-slate-800 p-4 rounded-xl group transition-all">
                    <span className="text-slate-100 text-sm font-bold">{email}</span>
                    <button 
                      onClick={() => removeCollaborator(email)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {collaborators.length === 0 && (
                  <p className="text-center py-6 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-2 border-dashed border-slate-800 rounded-xl">Nema dodanih saradnika</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-800 bg-slate-950/30 flex gap-3">
            <button 
              onClick={() => navigate(`/admin/competitions/${id}`)}
              className="flex-1 bg-slate-900 text-slate-200 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all border border-slate-700"
            >
              Otkaži
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] bg-amber-400 hover:bg-amber-500 text-black py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {saving ? 'Spremanje...' : (
                <>
                  <Save size={18} /> Sačuvaj Postavke
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompetitionSettings;
