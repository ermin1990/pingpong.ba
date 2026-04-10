import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Trophy, ArrowLeft, Calendar, MapPin, Settings2, 
  Info, Shield, Phone, Mail, Link as LinkIcon, 
  Clock, CheckCircle, Save, Globe, Lock, ExternalLink, Award, X 
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

const CreateCompetition = () => {
  const { user, userData, planDetails, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState('Groups');
  const [sport, setSport] = useState('Table Tennis');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Organization Details
  const [organizer, setOrganizer] = useState('');
  const [director, setDirector] = useState('');
  const [referee, setReferee] = useState('');
  
  // Description & Rules
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  
  // Additional Info
  const [entryFee, setEntryFee] = useState('');
  const [prizes, setPrizes] = useState('');
  const [schedule, setSchedule] = useState('');
  
  // Contact
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  
  // Registration
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registrationLink, setRegistrationLink] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');

  // Default Settings
  const [setsToWin, setSetsToWin] = useState(2);
  const [winPoints, setWinPoints] = useState(2);
  const [lossPoints, setLossPoints] = useState(0);
  const [advancingPlayers, setAdvancingPlayers] = useState(2);
  const [isPublic, setIsPublic] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  // Auto-generisi slug iz naziva
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/č/g, 'c')
      .replace(/ć/g, 'c')
      .replace(/š/g, 's')
      .replace(/ž/g, 'z')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value) => {
    setName(value);
    // Auto-generiši slug samo ako korisnik nije manuelno editovao slug
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSlugChange = (value) => {
    setSlug(generateSlug(value));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      const finalSlug = slug || generateSlug(name);
      
      const docRef = await addDoc(collection(db, "competitions"), {
        name,
        slug: finalSlug,
        sport,
        type,
        status: isPublic ? 'active' : 'draft',
        isPublic: isPublic,
        ownerUid: user.uid,
        ownerName: userData.displayName || userData.name || userData.email || 'Admin',
        ownerEmail: userData.email || user.email || '',
        createdAt: serverTimestamp(),
        participantsCount: 0,
        location: location || '',
        startDate: startDate || null,
        endDate: endDate || null,
        organizer: organizer || '',
        director: director || '',
        referee: referee || '',
        description: description || '',
        rules: rules || '',
        entryFee: entryFee || '',
        prizes: prizes || '',
        schedule: schedule || '',
        contact: {
            phone: phone || '',
            email: email || '',
            address: address || ''
        },
        registration: {
            isOpen: registrationOpen,
            link: registrationLink || '',
            deadline: registrationDeadline || null
        },
        defaultSettings: {
          setsToWin: Number(setsToWin),
          winPoints: Number(winPoints),
          lossPoints: Number(lossPoints),
          advancingPlayers: Number(advancingPlayers)
        },
        availableCategories: availableCategories
      });
      navigate(`/admin/competitions/${docRef.id}`);
    } catch (err) {
      console.error("Greška:", err);
      alert(`Greška: ${err.message}`);
    } finally {
      setLoading(false);
    }
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

  return (
    <DashboardLayout title="Novi Turnir">
      <div className="max-w-4xl mx-auto pb-20">
        <button 
          onClick={() => navigate('/admin/competitions')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Nazad na listu
        </button>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-950/30">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
                <Trophy size={26} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-100 uppercase italic tracking-tighter">Kreiraj Novo Takmičenje</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Popunite detalje vašeg sportskog događaja</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreate} className="p-5 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Info size={18} className="text-blue-500" />
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">Osnovne Informacije</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Naziv Takmičenja *</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm "
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="npr. Memorijalni turnir 2024"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">URL Link (Slug)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400  font-bold text-sm">
                      pingpong.ba/p/
                    </span>
                    <input 
                      type="text" 
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-40 pr-4 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm "
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="memorijalni-turnir-2024"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium px-1 mt-1.5">
                    Automatski se generiše iz naziva. Koristite mala slova, brojeve i crtice.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Organizator</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm "
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    placeholder="Ime kluba ili organizacije"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Direktor Turnira</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm "
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    placeholder="Ime i prezime"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Vrhovni Sudija</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm "
                    value={referee}
                    onChange={(e) => setReferee(e.target.value)}
                    placeholder="Ime i prezime vrhovnog sudije"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tip Takmičenja</label>
                  <select 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none cursor-pointer appearance-none"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="Groups">Grupna Faza + Knockout</option>
                    <option value="Knockout">Samo Knockout (Eliminacije)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Lokacija / Dvorana</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm "
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Dvorana Borik, Grad..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Datum Početka</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-100 font-bold outline-none shadow-sm "
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Datum Završetka</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-100 font-bold outline-none shadow-sm "
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

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
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none shadow-sm "
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ukratko o turniru..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Pravila i Sistemi (Propozicije)</label>
                  <textarea 
                    rows={6}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none shadow-sm "
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    placeholder="Detaljna pravila takmičenja..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Kotizacija</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm "
                      value={entryFee}
                      onChange={(e) => setEntryFee(e.target.value)}
                      placeholder="20 KM / 15 EUR"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nagrade</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm "
                      value={prizes}
                      onChange={(e) => setPrizes(e.target.value)}
                      placeholder="Pehare, medalje, diplome..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Raspored (Satnica)</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none shadow-sm "
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="Subota 9:00 - U11, 11:00 - U15..."
                  />
                </div>
              </div>
            </div>

            {/* Dostupne Kategorije za Prijave */}
            <div className="space-y-6 bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/20">
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
                  className="flex-1 bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm "
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
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
                <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800">
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
                <div className="text-center py-8 text-slate-400 ">
                  <Award size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold uppercase tracking-widest">Nema dodanih kategorija</p>
                </div>
              )}
            </div>

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
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-100 font-bold outline-none shadow-sm "
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+387..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Kontakt Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-100 font-bold outline-none shadow-sm "
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@kompanija.ba"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Puna Adresa</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm "
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ulica broj, Poštanski broj Grad, Država"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 bg-slate-950/40 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <LinkIcon size={18} className="text-amber-500" />
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">Postavke Prijava</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${registrationOpen ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {registrationOpen ? 'Otvoreno' : 'Zatvoreno'}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setRegistrationOpen(!registrationOpen)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors relative ${registrationOpen ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${registrationOpen ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Link za prijavu</label>
                  <input 
                    disabled={!registrationOpen}
                    type="text" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-bold outline-none disabled:opacity-50 shadow-sm "
                    value={registrationLink}
                    onChange={(e) => setRegistrationLink(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Rok za prijavu</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      disabled={!registrationOpen}
                      type="date" 
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-100 font-bold outline-none disabled:opacity-50 shadow-sm "
                      value={registrationDeadline}
                      onChange={(e) => setRegistrationDeadline(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Settings2 size={18} className="text-slate-500" />
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">Pravila Mečeva</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 text-center block">Setova do pobjede</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-black text-center outline-none shadow-sm "
                    value={setsToWin}
                    onChange={(e) => setSetsToWin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 text-center block">Pobjeda (Bodovi)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-black text-center outline-none shadow-sm "
                    value={winPoints}
                    onChange={(e) => setWinPoints(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 text-center block">Poraz (Bodovi)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-black text-center outline-none shadow-sm "
                    value={lossPoints}
                    onChange={(e) => setLossPoints(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 text-center block">Prolazi iz grupe</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-black text-center outline-none shadow-sm "
                    value={advancingPlayers}
                    onChange={(e) => setAdvancingPlayers(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Visibility Section */}
            <div className="space-y-6 bg-slate-950/40 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-700  pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isPublic ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                    {isPublic ? <Globe size={18} /> : <Lock size={18} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest leading-none mb-1">Vidljivost Takmičenja</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {isPublic ? 'Takmičenje će biti javno odmah nakon kreiranja' : 'Takmičenje će biti privatno (DRAFT)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isPublic ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {isPublic ? 'JAVNO' : 'PRIVATNO'}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors relative ${isPublic ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {isPublic && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-[10px] text-emerald-300 font-bold uppercase leading-relaxed">
                    <CheckCircle size={10} className="inline mr-1" /> Javno takmičenje je vidljivo svima. 
                    Nakon kreiranja, dobit ćete link koji možete podijeliti sa učesnicima i gledaocima.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 flex gap-4">
              <button 
                type="button"
                onClick={() => navigate('/admin/competitions')}
                className="flex-1 md:px-12 py-4 bg-slate-900 text-slate-200 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all border border-slate-700"
              >
                Otkaži
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-[2] md:px-16 py-4 bg-amber-400 hover:bg-amber-500 text-black rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? 'Kreiranje...' : (
                    <>
                        <Save size={18} /> Kreiraj Takmičenje
                    </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateCompetition;
