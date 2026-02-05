import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../themes/ThemeContext';
import { User, Building, Shield, Bell, Save, CreditCard, Trophy, Palette } from 'lucide-react';
import ThemeSwitcher from '../components/common/ThemeSwitcher';

const SettingsPage = () => {
  const { user, userData } = useAuth();
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  return (
    <DashboardLayout title="Postavke">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Theme Selector Section - NEW */}
        <div className="bg-white dark:bg-slate-900/40 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Palette size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Tema Aplikacije</h3>
                <p className="text-slate-600 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">Prilagodite izgled prema vašem ukusu</p>
              </div>
            </div>
            <button
              onClick={() => setShowThemeSelector(!showThemeSelector)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-xl"
            >
              {showThemeSelector ? 'Sakrij' : 'Promijeni Temu'}
            </button>
          </div>

          {showThemeSelector && (
            <div className="mt-6 flex justify-center">
              <ThemeSwitcher />
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Profil Korisnika</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Upravljajte vašim ličnim podacima</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Email Adresa</label>
              <input 
                type="email" 
                disabled 
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-400 font-bold outline-none cursor-not-allowed"
                value={user?.email || ''}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Uloga</label>
              <div className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-blue-400 font-black uppercase text-xs">
                {userData?.role || 'Administrator'}
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
              <Building size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Profil Korisnika</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Podaci o vašem profilu</p>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-white font-black uppercase text-sm">{userData?.displayName || 'Korisnik'}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase italic">{userData?.email}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full font-black uppercase">{userData?.role || 'User'}</span>
             </div>
          </div>
        </div>

        {/* Subscription Plan */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
              <CreditCard size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Pretplata i Plan</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Vaš trenutni paket usluga</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-950/50 border border-slate-700/50 rounded-3xl p-8 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-amber-500">⭐⭐⭐</span>
                <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">PRO PLAN</span>
              </div>
              <h4 className="text-3xl font-black text-white uppercase italic mb-2">Premium Tournament</h4>
              <p className="text-slate-400 text-sm font-medium mb-6">Uživajte u svim naprednim statistikama i neograničenom broju mečeva.</p>
              <button className="bg-white text-slate-950 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 hover:text-white transition-all">Nadogradi Plan</button>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Trophy size={160} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button className="px-8 py-4 rounded-2xl text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">Poništi</button>
          <button className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2">
            <Save size={16} /> Sačuvaj Sve Izmjene
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
