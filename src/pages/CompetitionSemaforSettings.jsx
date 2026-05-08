import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ArrowLeft, ExternalLink, MonitorPlay, Save } from 'lucide-react';

import DashboardLayout from '../layouts/DashboardLayout';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const DEFAULT_SEMAFOR_SETTINGS = {
  enabled: true,
  showPublicQr: false,
  qrSlideInterval: 5,
  slideDurationSec: 12,
  phases: {
    groups: true,
    knockout: true,
  },
  selectedCategoryIds: [],
  selectedGroupsByCategory: {},
};

const getCategoryGroupIds = (category) => {
  if (!category?.groupConfig) return category?.format === 'round_robin' ? [0] : [];

  const ids = Object.keys(category.groupConfig)
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => a - b);

  if (ids.length === 0 && category?.format === 'round_robin') return [0];
  return ids;
};

const CompetitionSemaforSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [competition, setCompetition] = useState(null);
  const [categoryDocs, setCategoryDocs] = useState([]);
  const [semaforSettings, setSemaforSettings] = useState(DEFAULT_SEMAFOR_SETTINGS);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return;

      try {
        const compSnap = await getDoc(doc(db, 'competitions', id));
        if (!compSnap.exists()) {
          alert('Takmičenje nije pronađeno.');
          navigate('/admin/competitions');
          return;
        }

        const compData = { id: compSnap.id, ...compSnap.data() };
        setCompetition(compData);

        const catSnap = await getDocs(collection(db, 'competitions', id, 'categories'));
        const catList = catSnap.docs
          .map((categoryDoc) => ({ id: categoryDoc.id, ...categoryDoc.data() }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        setCategoryDocs(catList);

        const savedSemafor = compData.semaforSettings || {};
        const savedSelections = savedSemafor.selectedGroupsByCategory || {};
        const allCategoryIds = catList.map((category) => category.id);
        const savedCategoryIds = Array.isArray(savedSemafor.selectedCategoryIds)
          ? savedSemafor.selectedCategoryIds.filter((categoryId) => allCategoryIds.includes(categoryId))
          : allCategoryIds;

        const normalizedSelections = {};
        catList.forEach((category) => {
          const availableGroupIds = getCategoryGroupIds(category);
          const selectedForCategory = Array.isArray(savedSelections[category.id])
            ? savedSelections[category.id].map((value) => Number(value)).filter((value) => availableGroupIds.includes(value))
            : availableGroupIds;

          normalizedSelections[category.id] = selectedForCategory;
        });

        setSemaforSettings({
          enabled: savedSemafor.enabled ?? DEFAULT_SEMAFOR_SETTINGS.enabled,
          showPublicQr: savedSemafor.showPublicQr ?? DEFAULT_SEMAFOR_SETTINGS.showPublicQr,
          qrSlideInterval: Math.max(2, Number(savedSemafor.qrSlideInterval) || DEFAULT_SEMAFOR_SETTINGS.qrSlideInterval),
          slideDurationSec: Math.max(5, Number(savedSemafor.slideDurationSec) || DEFAULT_SEMAFOR_SETTINGS.slideDurationSec),
          phases: {
            groups: savedSemafor.phases?.groups ?? DEFAULT_SEMAFOR_SETTINGS.phases.groups,
            knockout: savedSemafor.phases?.knockout ?? DEFAULT_SEMAFOR_SETTINGS.phases.knockout,
          },
          selectedCategoryIds: savedCategoryIds,
          selectedGroupsByCategory: normalizedSelections,
        });
      } catch (error) {
        console.error('Semafor settings fetch error:', error);
        alert('Greška pri učitavanju semafor postavki.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, navigate]);

  const publicSemaforLink = useMemo(
    () => `${window.location.origin}/p/${competition?.slug || id}/screen-semafor`,
    [competition?.slug, id]
  );

  const updateSemaforPhase = (phaseKey, value) => {
    setSemaforSettings((current) => ({
      ...current,
      phases: {
        ...current.phases,
        [phaseKey]: value,
      },
    }));
  };

  const toggleSemaforCategory = (categoryId) => {
    setSemaforSettings((current) => {
      const selected = current.selectedCategoryIds || [];
      const exists = selected.includes(categoryId);
      return {
        ...current,
        selectedCategoryIds: exists ? selected.filter((idValue) => idValue !== categoryId) : [...selected, categoryId],
      };
    });
  };

  const selectAllSemaforCategories = (categoryIds) => {
    setSemaforSettings((current) => ({
      ...current,
      selectedCategoryIds: categoryIds,
    }));
  };

  const toggleSemaforGroup = (categoryId, groupIdx) => {
    setSemaforSettings((current) => {
      const currentGroups = current.selectedGroupsByCategory?.[categoryId] || [];
      const exists = currentGroups.includes(groupIdx);
      const nextGroups = exists
        ? currentGroups.filter((value) => value !== groupIdx)
        : [...currentGroups, groupIdx].sort((a, b) => a - b);

      return {
        ...current,
        selectedGroupsByCategory: {
          ...current.selectedGroupsByCategory,
          [categoryId]: nextGroups,
        },
      };
    });
  };

  const selectAllCategoryGroups = (categoryId, groupIds) => {
    setSemaforSettings((current) => ({
      ...current,
      selectedGroupsByCategory: {
        ...current.selectedGroupsByCategory,
        [categoryId]: groupIds,
      },
    }));
  };

  const handleSaveSemafor = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'competitions', id), {
        semaforSettings: {
          enabled: semaforSettings.enabled,
          showPublicQr: semaforSettings.showPublicQr === true,
          qrSlideInterval: Math.max(2, Number(semaforSettings.qrSlideInterval) || 5),
          slideDurationSec: Math.max(5, Number(semaforSettings.slideDurationSec) || 12),
          phases: {
            groups: semaforSettings.phases?.groups !== false,
            knockout: semaforSettings.phases?.knockout !== false,
          },
          selectedCategoryIds: semaforSettings.selectedCategoryIds || [],
          selectedGroupsByCategory: semaforSettings.selectedGroupsByCategory || {},
        },
        updatedAt: serverTimestamp(),
      });

      alert('Semafor postavke su sačuvane.');
    } catch (error) {
      console.error('Semafor save error:', error);
      alert('Greška pri čuvanju semafor postavki.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Semafor Postavke">
        <div className="flex items-center justify-center py-20">
          <div className="text-cyan-400 animate-pulse font-black uppercase tracking-widest">Učitavanje...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Semafor - ${competition?.name || 'Takmičenje'}`}>
      <div className="max-w-5xl mx-auto pb-20">
        <button
          onClick={() => navigate(`/admin/competitions/${id}`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Nazad na takmičenje
        </button>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-950/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
                <MonitorPlay size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-100 uppercase italic tracking-tighter">Semafor Postavke</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{competition?.name}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSemaforSettings((current) => ({ ...current, enabled: !current.enabled }))}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                semaforSettings.enabled
                  ? 'bg-cyan-500 text-black'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {semaforSettings.enabled ? 'Uključen' : 'Isključen'}
            </button>
          </div>

          <div className="p-5 space-y-7">
            <p className="text-xs text-slate-400 font-medium">
              Ovdje su izdvojene sve postavke za semafor prikaz. Čuvanje ovih postavki je odvojeno od glavnih postavki takmičenja.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Interval slajdova (sekunde)</label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={semaforSettings.slideDurationSec}
                  onChange={(e) =>
                    setSemaforSettings((current) => ({
                      ...current,
                      slideDurationSec: Number(e.target.value) || 12,
                    }))
                  }
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-black outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Faze koje se prikazuju</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateSemaforPhase('groups', !semaforSettings.phases?.groups)}
                    className={`flex-1 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.12em] border transition ${
                      semaforSettings.phases?.groups
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400'
                    }`}
                  >
                    Grupe
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSemaforPhase('knockout', !semaforSettings.phases?.knockout)}
                    className={`flex-1 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.12em] border transition ${
                      semaforSettings.phases?.knockout
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400'
                    }`}
                  >
                    Knockout
                  </button>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Dodatne opcije</label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setSemaforSettings((current) => ({ ...current, showPublicQr: !current.showPublicQr }))}
                    className={`w-full rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.12em] border transition text-left ${
                      semaforSettings.showPublicQr
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400'
                    }`}
                  >
                    Prikaži QR kod kao poseban slide
                  </button>

                  {semaforSettings.showPublicQr && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">QR na svakih N slajdova</label>
                      <input
                        type="number"
                        min={2}
                        max={30}
                        value={semaforSettings.qrSlideInterval}
                        onChange={(e) =>
                          setSemaforSettings((current) => ({
                            ...current,
                            qrSlideInterval: Math.max(2, Number(e.target.value) || 5),
                          }))
                        }
                        className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-100 font-black outline-none"
                      />
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Primjer: 5 = QR će biti na 1, 6, 11, ... slajdu.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Kategorije za prikaz</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => selectAllSemaforCategories(categoryDocs.map((category) => category.id))}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-300"
                    >
                      Sve
                    </button>
                    <button
                      type="button"
                      onClick={() => selectAllSemaforCategories([])}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-300"
                    >
                      Nijedna
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {categoryDocs.map((category) => {
                    const checked = (semaforSettings.selectedCategoryIds || []).includes(category.id);

                    return (
                      <button
                        key={`semafor-category-${category.id}`}
                        type="button"
                        onClick={() => toggleSemaforCategory(category.id)}
                        className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition ${
                          checked
                            ? 'border-emerald-400/60 bg-emerald-400/20 text-emerald-200'
                            : 'border-slate-700 bg-slate-900 text-slate-500'
                        }`}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {categoryDocs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-[10px] font-bold uppercase tracking-widest border border-dashed border-slate-700 rounded-xl">
                  Nema kategorija za prikaz
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryDocs.map((category) => {
                    const groupIds = getCategoryGroupIds(category);
                    const selected = semaforSettings.selectedGroupsByCategory?.[category.id] || [];

                    return (
                      <div key={category.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-slate-100">{category.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                              {category.format === 'direct_knockout' ? 'Direktni knockout' : 'Grupe'}
                            </p>
                          </div>
                          {groupIds.length > 0 && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => selectAllCategoryGroups(category.id, groupIds)}
                                className="px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-300"
                              >
                                Sve
                              </button>
                              <button
                                type="button"
                                onClick={() => selectAllCategoryGroups(category.id, [])}
                                className="px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-300"
                              >
                                Nijedna
                              </button>
                            </div>
                          )}
                        </div>

                        {groupIds.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {groupIds.map((groupId) => {
                              const checked = selected.includes(groupId);
                              const label = category.format === 'round_robin' ? 'Tabela lige' : `Grupa ${String.fromCharCode(65 + groupId)}`;

                              return (
                                <button
                                  key={`${category.id}-group-${groupId}`}
                                  type="button"
                                  onClick={() => toggleSemaforGroup(category.id, groupId)}
                                  className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition ${
                                    checked
                                      ? 'border-cyan-400/60 bg-cyan-400/20 text-cyan-200'
                                      : 'border-slate-700 bg-slate-900 text-slate-500'
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">Ova kategorija nema grupnu fazu.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {competition?.isPublic && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-3">
                  <p className="text-[10px] uppercase tracking-widest font-black text-cyan-300">Javni semafor link</p>
                  <p className="mt-1 text-xs text-white break-all">{publicSemaforLink}</p>
                </div>
                <a
                  href={publicSemaforLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] transition"
                >
                  Otvori semafor <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-800 bg-slate-950/30 flex gap-3">
            <button
              onClick={() => navigate(`/admin/competitions/${id}`)}
              className="flex-1 bg-slate-900 text-slate-200 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all border border-slate-700"
            >
              Nazad
            </button>
            <button
              onClick={handleSaveSemafor}
              disabled={saving}
              className="flex-[2] bg-cyan-400 hover:bg-cyan-500 text-slate-950 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {saving ? 'Spremanje...' : (
                <>
                  <Save size={18} /> Sačuvaj Semafor Postavke
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompetitionSemaforSettings;
