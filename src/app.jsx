import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import { auth, db } from './firebase/config';
import DashboardLayout from './layouts/DashboardLayout';
import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { CreditCard, Building2, Users, Trophy } from 'lucide-react';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Players from './pages/Players';
import Competitions from './pages/Competitions';
import CompetitionDetails from './pages/CompetitionDetails';
import SettingsPage from './pages/SettingsPage';
import PublicCompetition from './pages/PublicCompetition';

const Unauthorized = () => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: '',
    contactPerson: '',
    phone: '',
    plan: 'basic'
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: '29€',
      period: '/mjesec',
      tournaments: '1 turnir',
      categories: 'Do 10 kategorija',
      features: ['Raspored mečeva', 'Live rezultati', 'Tabele']
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '49€',
      period: '/mjesec',
      tournaments: '3 turnira',
      categories: 'Do 15 kategorija',
      features: ['Sve iz Basic', 'Statistike igrača', 'PDF izvještaji', 'Email notifikacije'],
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '99€',
      period: '/mjesec',
      tournaments: 'Neograničeno',
      categories: 'Neograničeno',
      features: ['Sve iz Pro', 'Branded portal', 'API pristup', 'Premium podrška']
    }
  ];

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const currentUser = auth.currentUser;
      await addDoc(collection(db, "access_requests"), {
        email: currentUser?.email,
        organizationName: formData.organizationName,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        selectedPlan: formData.plan,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Greška pri slanju zahtjeva:", err);
      alert("Došlo je do greške. Pokušajte ponovo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md bg-gray-900 border border-gray-800 p-10 rounded-3xl shadow-2xl text-center">
          <div className="text-green-500 text-5xl mb-6">✅</div>
          <h1 className="text-2xl font-bold mb-4 text-white">Zahtjev Poslat!</h1>
          <p className="text-gray-400 mb-8">
            Vaš zahtjev je uspješno primljen. Super Admin će ga pregledati i kontaktirati vas u najkraćem roku.
          </p>
          <button 
            onClick={() => {
              auth.signOut();
              window.location.href = '/';
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition w-full"
          >
            Zatvori
          </button>
        </div>
      </div>
    );
  }

  if (showRequestForm) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0f1a]">
        <div className="max-w-5xl w-full">
          {/* Plan Selection */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black mb-2 text-white">Odaberite Plan</h2>
            <p className="text-gray-400">Izaberite paket koji odgovara vašim potrebama</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {plans.map(plan => (
              <div 
                key={plan.id}
                onClick={() => setFormData({...formData, plan: plan.id})}
                className={`relative bg-gray-900 border-2 rounded-3xl p-6 cursor-pointer transition-all hover:scale-105 ${
                  formData.plan === plan.id 
                    ? 'border-blue-500 shadow-xl shadow-blue-500/20' 
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    NAJPOPULARNIJE
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="w-4 h-4 text-blue-500" />
                    <span>{plan.tournaments}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>{plan.categories}</span>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-4 space-y-2">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      {feature}
                    </div>
                  ))}
                </div>

                {formData.plan === plan.id && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Building2 className="text-blue-500" />
              Informacije o Organizaciji
            </h3>
            
            <form onSubmit={handleSubmitRequest} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Naziv Organizacije *</label>
                <input 
                  type="text" 
                  required
                  placeholder="npr. TT Klub Sarajevo"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Kontakt Osoba *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ime i Prezime"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Telefon *</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="+387 xx xxx xxx"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-400 mb-1">Odabrani Plan: {plans.find(p => p.id === formData.plan)?.name}</p>
                    <p className="text-gray-400 text-xs">Nakon odobrenja zahtjeva, kontaktiraćemo vas sa uputstvima za plaćanje i aktivaciju.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-gray-700 font-bold hover:bg-gray-800 transition"
                >
                  Nazad
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-blue-500/20 transition active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Šaljem...' : 'Pošalji Zahtjev'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-gray-900 border border-gray-800 p-10 rounded-3xl shadow-2xl">
        <div className="text-red-500 text-5xl mb-6">⚠️</div>
        <h1 className="text-2xl font-bold mb-4 text-white">Pristup Odbijen</h1>
        <p className="text-gray-400 mb-8 font-medium">
          Vaš email nije na listi dozvoljenih korisnika. 
          Možete poslati zahtjev za otvaranje računa.
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => setShowRequestForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
          >
            <Building2 className="w-5 h-5" />
            Pošalji Zahtjev za Pristup
          </button>
          <button 
            onClick={() => {
              auth.signOut();
              window.location.href = '/';
            }}
            className="text-gray-500 hover:text-white text-sm font-bold transition"
          >
            Odjavi se i vrati na početnu
          </button>
        </div>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/players" element={<Players />} />
            <Route path="/competitions" element={<Competitions />} />
            <Route path="/competitions/:id" element={<CompetitionDetails />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/p/:slug" element={<PublicCompetition />} />
            
            {/* Catch-all route: Redirect to home for any undefined path */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}
