import { useState, useRef } from 'react';
import { db } from '../../firebase/config';
import {
  collection, doc, getDocs, setDoc, updateDoc,
  writeBatch, serverTimestamp, query, where
} from 'firebase/firestore';
import {
  Download, Upload, CheckCircle, AlertTriangle,
  RefreshCw, X, Database, FileJson
} from 'lucide-react';

const BACKUP_VERSION = '1.0';

// Converts Firestore Timestamps to ISO strings (and back)
const serializeValue = (val) => {
  if (!val) return val;
  if (typeof val?.toDate === 'function') return { _type: 'timestamp', value: val.toDate().toISOString() };
  if (Array.isArray(val)) return val.map(serializeValue);
  if (typeof val === 'object') {
    const out = {};
    for (const k of Object.keys(val)) out[k] = serializeValue(val[k]);
    return out;
  }
  return val;
};

const deserializeValue = (val) => {
  if (!val) return val;
  if (val?._type === 'timestamp') return new Date(val.value);
  if (Array.isArray(val)) return val.map(deserializeValue);
  if (typeof val === 'object') {
    const out = {};
    for (const k of Object.keys(val)) out[k] = deserializeValue(val[k]);
    return out;
  }
  return val;
};

const CompetitionBackup = ({
  competition,
  categories = [],
  matches = [],
  allPlayers = [],
  onClose,
}) => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState(null); // { success, message }
  const fileInputRef = useRef(null);

  // ─── EXPORT ───────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const competitionId = competition?.id;

      // Fetch manualOrders subcollections per category
      const manualOrdersMap = {};
      for (const cat of categories) {
        const ordersSnap = await getDocs(
          collection(db, 'competitions', competitionId, 'categories', cat.id, 'manualOrders')
        );
        if (!ordersSnap.empty) {
          manualOrdersMap[cat.id] = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      }

      // Only include players that are assigned to at least one category in this competition
      const assignedPlayerIds = new Set(
        categories.flatMap(cat => [
          ...(cat.playerIds || []),
          ...(cat.doublesPairs || []).flatMap(pair => pair.playerIds || []),
        ])
      );
      const relevantPlayers = allPlayers.filter(p => assignedPlayerIds.has(p.id));

      const backup = {
        _meta: {
          backupVersion: BACKUP_VERSION,
          exportedAt: new Date().toISOString(),
          competitionId,
          competitionName: competition?.name || '',
        },
        competition: serializeValue({ ...competition }),
        categories: categories.map(cat => ({
          ...serializeValue(cat),
          _manualOrders: manualOrdersMap[cat.id] ? serializeValue(manualOrdersMap[cat.id]) : [],
        })),
        matches: matches.map(m => serializeValue({ ...m })),
        players: relevantPlayers.map(p => serializeValue({ ...p })),
      };

      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = (competition?.name || competitionId || 'turnir').replace(/[^a-zA-Z0-9_\-]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `backup_${safeName}_${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Greška pri exportu: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // ─── IMPORT ───────────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        processImport(data);
      } catch (err) {
        setImportResult({ success: false, message: 'Neispravan JSON fajl: ' + err.message });
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const processImport = async (data) => {
    if (!data?._meta || !data?.competition) {
      setImportResult({ success: false, message: 'Fajl nije validan backup.' });
      return;
    }

    const targetCompetitionId = competition?.id;
    if (!targetCompetitionId) {
      setImportResult({ success: false, message: 'Nije moguće odrediti ID takmičenja.' });
      return;
    }

    const confirmed = window.confirm(
      `PAŽNJA: Import će PREPISATI sve podatke ovog takmičenja!\n\n` +
      `Backup: "${data._meta.competitionName}" (${data._meta.exportedAt?.slice(0, 10) || '?'})\n` +
      `Kategorije: ${data.categories?.length || 0}\n` +
      `Mečevi: ${data.matches?.length || 0}\n` +
      `Igrači: ${data.players?.length || 0}\n\n` +
      `Da li ste sigurni?`
    );
    if (!confirmed) return;

    setImporting(true);
    setImportResult(null);

    try {
      // 1. Restore competition metadata (excluding id)
      const { id: _cid, ...compData } = deserializeValue(data.competition);
      const compRef = doc(db, 'competitions', targetCompetitionId);
      await updateDoc(compRef, {
        ...compData,
        id: targetCompetitionId,
        restoredAt: serverTimestamp(),
        restoredFrom: data._meta.competitionId || null,
      });

      // 2. Restore categories + manualOrders
      for (const catRaw of (data.categories || [])) {
        const { _manualOrders, id: originalCatId, ...catData } = deserializeValue(catRaw);
        const catId = originalCatId;
        const catRef = doc(db, 'competitions', targetCompetitionId, 'categories', catId);
        await setDoc(catRef, { ...catData, id: catId }, { merge: false });

        // manualOrders subcollection
        if (_manualOrders?.length) {
          for (const order of _manualOrders) {
            const { id: ordId, ...orderData } = order;
            await setDoc(
              doc(db, 'competitions', targetCompetitionId, 'categories', catId, 'manualOrders', ordId),
              orderData
            );
          }
        }
      }

      // 3. Restore matches in batches of 400
      const matchDocs = data.matches || [];
      const CHUNK = 400;
      for (let i = 0; i < matchDocs.length; i += CHUNK) {
        const batch = writeBatch(db);
        matchDocs.slice(i, i + CHUNK).forEach(mRaw => {
          const { id: mId, ...mData } = deserializeValue(mRaw);
          // Force competitionId to current competition
          batch.set(doc(db, 'matches', mId), {
            ...mData,
            competitionId: targetCompetitionId,
          }, { merge: false });
        });
        await batch.commit();
      }

      // 4. Restore players (only upsert, never overwrite with empty)
      const playerDocs = data.players || [];
      for (let i = 0; i < playerDocs.length; i += CHUNK) {
        const batch = writeBatch(db);
        playerDocs.slice(i, i + CHUNK).forEach(pRaw => {
          const { id: pId, ...pData } = deserializeValue(pRaw);
          if (pId && pData.name) {
            batch.set(doc(db, 'players', pId), pData, { merge: true });
          }
        });
        await batch.commit();
      }

      setImportResult({
        success: true,
        message: `Import uspješan! ${matchDocs.length} mečeva, ${data.categories?.length || 0} kategorija, ${playerDocs.length} igrača obnovljeno. Stranica će se osvježiti...`,
      });

      setTimeout(() => window.location.reload(), 2500);
    } catch (err) {
      console.error('Import error:', err);
      setImportResult({ success: false, message: 'Greška pri importu: ' + err.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-950 border border-slate-800 rounded-[28px] w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Backup & Restore</h2>
              <p className="text-slate-500 text-xs">{competition?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Export */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm">Exportuj Backup</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Preuzima kompletan JSON backup turnira: takmičenje, kategorije, sve mečeve i igrače.
                </p>
                <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-slate-500">
                  <span className="bg-slate-800 rounded-lg px-2 py-1">{categories.length} kategorija</span>
                  <span className="bg-slate-800 rounded-lg px-2 py-1">{matches.length} mečeva</span>
                  <span className="bg-slate-800 rounded-lg px-2 py-1">{allPlayers.length} igrača</span>
                </div>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all"
                >
                  {exporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  {exporting ? 'Exportujem...' : 'Preuzmi Backup (.json)'}
                </button>
              </div>
            </div>
          </div>

          {/* Import */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Upload className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm">Importuj Backup</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Vraća turnir iz prethodno preuzetog backup fajla. Prepisuje sve postojeće podatke.
                </p>

                {importResult && (
                  <div className={`mt-3 flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-xs leading-relaxed ${
                    importResult.success
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    {importResult.success
                      ? <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
                      : <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />}
                    {importResult.message}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-amber-600/80 hover:bg-amber-600 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all"
                >
                  {importing ? <RefreshCw size={14} className="animate-spin" /> : <FileJson size={14} />}
                  {importing ? 'Importujem...' : 'Odaberi JSON fajl za Import'}
                </button>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2.5 bg-red-500/5 border border-red-500/15 rounded-2xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400/80 text-xs leading-relaxed">
              Import <strong>prepisuje</strong> sve postojeće podatke turnira. Ova akcija se ne može poništiti — preporučujemo da prvo napravite novi backup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionBackup;
