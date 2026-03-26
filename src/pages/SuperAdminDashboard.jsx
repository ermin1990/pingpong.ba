import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { Shield, Building2, Users, Crown, CheckCircle, XCircle, Plus, Mail, Trash2, Clock, Phone, User, Trophy, Edit2, Layout, Bug } from 'lucide-react';
import plansSeed from '../../plans_seed.json';

const SuperAdminDashboard = () => {
  const { userData, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [allCompetitions, setAllCompetitions] = useState([]);
  const [globalStats, setGlobalStats] = useState({ players: 0, matches: 0 });
  const [whitelistedEmails, setWhitelistedEmails] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [plans, setPlans] = useState([]);
  const [newPlan, setNewPlan] = useState({ name: '', price: '', periodDays: 30, tournamentsLimit: 1, groupsLimit: 5, playersPerGroupLimit: 12, features: [] });
  const [editingPlan, setEditingPlan] = useState(null);
  const [featureInput, setFeatureInput] = useState('');
  const [featureUnlimited, setFeatureUnlimited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profiles'); // 'profiles' | 'requests'
  const [reports, setReports] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  const [userPlanSelections, setUserPlanSelections] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Users (Profiles)
        const usersQ = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const usersSnap = await getDocs(usersQ);
        const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const userStats = {};
        usersData.forEach(user => {
          userStats[user.uid] = { competitions: 0, players: 0 };
        });

        // Fetch All Competitions
        const compsSnap = await getDocs(collection(db, "competitions"));
        const compsData = compsSnap.docs.map(d => {
          const data = d.data();
          if (data.ownerUid && userStats[data.ownerUid]) {
            userStats[data.ownerUid].competitions++;
          }
          const creator = usersData.find(u => u.uid === data.ownerUid);
          return { 
            id: d.id, 
            ...data, 
            creatorName: creator?.displayName || data.ownerName || data.ownerEmail || 'N/A',
            creatorEmail: creator?.email || data.ownerEmail || ''
          };
        });
        setAllCompetitions(compsData);

        // Fetch All Players
        const playersSnap = await getDocs(collection(db, "players"));
        playersSnap.forEach(p => {
          const data = p.data();
          if (data.ownerUid && userStats[data.ownerUid]) {
            userStats[data.ownerUid].players++;
          }
        });

        // Merge stats back to users
        const finalUsers = usersData.map(u => ({
          ...u,
          stats: userStats[u.uid] || { competitions: 0, players: 0 }
        }));
        setUsers(finalUsers);

        // Estimate Global Stats
        const matchesSnap = await getDocs(collection(db, "matches"));
        setGlobalStats({
          players: playersSnap.size,
          matches: matchesSnap.size
        });

        // Fetch Whitelisted Emails
        const whiteSnap = await getDocs(collection(db, "whitelisted_emails"));
        setWhitelistedEmails(whiteSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Access Requests
        const requestsQ = query(collection(db, "access_requests"), orderBy("createdAt", "desc"));
        const requestsSnap = await getDocs(requestsQ);
        setAccessRequests(requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Plans
        try {
          const plansSnap = await getDocs(query(collection(db, 'plans'), orderBy('createdAt', 'desc')));
          setPlans(plansSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
          console.warn('Plans collection not found or empty', e);
        }

        // Fetch Reports
        try {
          const reportsSnap = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc')));
          setReports(reportsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
          console.warn('Reports collection not found', e);
        }

      } catch (err) {
        console.error("Greška pri dohvaćanju podataka:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  const handleDeleteOrganization = async (orgId) => {
    if (!confirm("OPREZ: Brisanjem organizacije brišete sve njihove zapise! Nastaviti?")) return;
    try {
      await deleteDoc(doc(db, "organizations", orgId));
      setOrganizations(prev => prev.filter(o => o.id !== orgId));
      alert("Organizacija obrisana.");
    } catch (err) {
      alert("Greška pri brisanju.");
    }
  };

  const handleApproveRequest = async (request) => {
    try {
      // 1. Dodaj na whitelistu
      await addDoc(collection(db, "whitelisted_emails"), {
        email: request.email.toLowerCase().trim(),
        role: 'org_admin',
        addedAt: new Date(),
        status: 'active',
        approvedFrom: 'access_request'
      });

      // 2. Update status zahtjeva
      await updateDoc(doc(db, "access_requests", request.id), {
        status: 'approved',
        approvedAt: new Date()
      });

      // 3. Update local state
      setAccessRequests(prev => prev.map(r => 
        r.id === request.id ? { ...r, status: 'approved' } : r
      ));
      setWhitelistedEmails(prev => [...prev, { email: request.email, role: 'org_admin' }]);

      alert(`Zahtjev odobren! Email ${request.email} dodan na listu dozvoljenih.`);
    } catch (err) {
      console.error("Greška:", err);
      alert("Greška pri odobravanju zahtjeva.");
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!confirm("Da li ste sigurni da želite odbiti ovaj zahtjev?")) return;
    
    try {
      await updateDoc(doc(db, "access_requests", requestId), {
        status: 'rejected',
        rejectedAt: new Date()
      });

      setAccessRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, status: 'rejected' } : r
      ));

      alert("Zahtjev odbijen.");
    } catch (err) {
      alert("Greška pri odbijanju zahtjeva.");
    }
  };

  const handleAddWhitelist = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      const docRef = await addDoc(collection(db, "whitelisted_emails"), {
        email: newEmail.toLowerCase().trim(),
        role: 'org_admin',
        addedAt: new Date(),
        status: 'active'
      });

      setWhitelistedEmails(prev => [...prev, { 
        id: docRef.id, 
        email: newEmail.toLowerCase().trim(),
        role: 'org_admin'
      }]);
      setNewEmail('');
      alert(`Email ${newEmail} je dodan na listu dozvoljenih.`);
    } catch (err) {
      console.error("Greška pri dodavanju:", err);
      alert("Greška pri dodavanju na listu.");
    }
  };

  const openEditSubscription = (user) => {
    setEditingSub({ id: user.id, email: user.email, subscriptionPlan: user.subscriptionPlan || '', subscriptionExpiry: user.subscriptionExpiry ? new Date(user.subscriptionExpiry.seconds ? user.subscriptionExpiry.toMillis() : user.subscriptionExpiry) : '' });
  };

  const saveSubscription = async () => {
    if (!editingSub) return;
    try {
      const uDoc = doc(db, 'users', editingSub.id);
      const payload = {
        subscriptionPlan: editingSub.subscriptionPlan || null,
        subscriptionExpiry: editingSub.subscriptionExpiry ? new Date(editingSub.subscriptionExpiry) : null
      };
      await updateDoc(uDoc, payload);
      setUsers(prev => prev.map(u => u.id === editingSub.id ? { ...u, ...payload } : u));
      setEditingSub(null);
      alert('Pretplata ažurirana.');
    } catch (err) {
      console.error('Greška pri ažuriranju pretplate:', err);
      alert('Greška pri ažuriranju.');
    }
  };

  const removeWhitelist = async (id) => {
    if (!confirm("Ukloniti email sa liste dozvoljenih?")) return;
    try {
      await deleteDoc(doc(db, "whitelisted_emails", id));
      setWhitelistedEmails(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert("Greška pri brisanju.");
    }
  };

  // Plans management
  const handleAddFeature = (e) => {
    e.preventDefault();
    if (!featureInput.trim()) return;
    const newFeature = { text: featureInput.trim(), unlimited: featureUnlimited };
    if (editingPlan) {
      setEditingPlan(prev => ({ ...prev, features: [...(prev.features || []), newFeature] }));
    } else {
      setNewPlan(prev => ({ ...prev, features: [...prev.features, newFeature] }));
    }
    setFeatureInput('');
    setFeatureUnlimited(false);
  };

  const handleRemoveFeature = (index) => {
    if (editingPlan) {
      setEditingPlan(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
    } else {
      setNewPlan(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
    }
  };

  const handleCreateOrUpdatePlan = async (e) => {
    e && e.preventDefault && e.preventDefault();
    try {
      if (editingPlan) {
        const pDoc = doc(db, 'plans', editingPlan.id);
        const payload = {
          name: editingPlan.name,
          price: editingPlan.price || null,
          periodDays: Number(editingPlan.periodDays) || 0,
          tournamentsLimit: Number(editingPlan.tournamentsLimit) || 0,
          groupsLimit: Number(editingPlan.groupsLimit) || 0,
          playersPerGroupLimit: Number(editingPlan.playersPerGroupLimit) || 0,
          features: editingPlan.features || []
        };
        await updateDoc(pDoc, payload);
        setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...p, ...payload } : p));
        setEditingPlan(null);
        alert('Plan ažuriran.');
      } else {
        const payload = {
          name: newPlan.name,
          price: newPlan.price || null,
          periodDays: Number(newPlan.periodDays) || 0,
          tournamentsLimit: Number(newPlan.tournamentsLimit) || 0,
          groupsLimit: Number(newPlan.groupsLimit) || 0,
          playersPerGroupLimit: Number(newPlan.playersPerGroupLimit) || 0,
          features: newPlan.features || [],
          createdAt: new Date()
        };
        const pRef = await addDoc(collection(db, 'plans'), payload);
        setPlans(prev => [{ id: pRef.id, ...payload }, ...prev]);
        setNewPlan({ name: '', price: '', periodDays: 30, tournamentsLimit: 1, groupsLimit: 5, playersPerGroupLimit: 12, features: [] });
        alert('Novi plan kreiran.');
      }
    } catch (err) {
      console.error('Greška pri spremanju plana:', err);
      alert('Greška pri spremanju plana.');
    }
  };

  const startEditPlan = (plan) => {
    setEditingPlan({ ...plan });
  };

  const cancelEditPlan = () => setEditingPlan(null);

  const handleDeletePlan = async (planId) => {
    if (!confirm('Obrisati plan? Ovo će ukloniti plan, ali postojeći korisnici neće biti automatski promijenjeni.')) return;
    try {
      await deleteDoc(doc(db, 'plans', planId));
      setPlans(prev => prev.filter(p => p.id !== planId));
      alert('Plan obrisan.');
    } catch (err) {
      console.error('Greška pri brisanju plana:', err);
      alert('Greška pri brisanju plana.');
    }
  };

  const assignPlanToUser = async (userId, planId) => {
    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) return alert('Plan nije pronađen.');
      const expiry = plan.periodDays ? new Date(Date.now() + Number(plan.periodDays) * 24*60*60*1000) : null;
      await updateDoc(doc(db, 'users', userId), {
        subscriptionPlan: plan.name || plan.id,
        subscriptionPlanId: plan.id,
        subscriptionExpiry: expiry
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscriptionPlan: plan.name || plan.id, subscriptionPlanId: plan.id, subscriptionExpiry: expiry } : u));
      alert('Plan primijenjen korisniku.');
    } catch (err) {
      console.error('Greška pri dodjeli plana:', err);
      alert('Greška pri dodjeli plana.');
    }
  };

  const seedInitialPlansDB = async () => {
    if (!confirm('Dodati početne planove (Jednokratni, Paket 5, Godišnji)?')) return;
    try {
      for (const planData of plansSeed) {
        await addDoc(collection(db, 'plans'), {
          ...planData,
          createdAt: new Date()
        });
      }
      // Refresh plans list
      const plansSnap = await getDocs(query(collection(db, 'plans'), orderBy('createdAt', 'desc')));
      setPlans(plansSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      alert('Početni planovi su dodani!');
    } catch (err) {
      console.error('Greška pri dodavanju planova:', err);
      alert('Greška pri dodavanju planova.');
    }
  };

  const toggleStatus = async (orgId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, "organizations", orgId), {
        subscriptionStatus: newStatus
      });
      setOrganizations(prev => prev.map(org => 
        org.id === orgId ? { ...org, subscriptionStatus: newStatus } : org
      ));
    } catch (err) {
      alert("Greška pri ažuriranju statusa.");
    }
  };

  const handleDeleteCompetition = async (compId) => {
    if (!confirm("Da li ste sigurni da želite obrisati cijelo takmičenje? Ova akcija je nepovratna!")) return;
    try {
      await deleteDoc(doc(db, "competitions", compId));
      setAllCompetitions(prev => prev.filter(c => c.id !== compId));
      alert("Takmičenje obrisano.");
    } catch (err) {
      alert("Greška pri brisanju takmičenja.");
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm("Obrisati ovaj izvještaj?")) return;
    try {
      await deleteDoc(doc(db, "reports", reportId));
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      alert("Greška pri brisanju.");
    }
  };

  const handleUpdateReportStatus = async (reportId, newStatus) => {
    try {
      await updateDoc(doc(db, "reports", reportId), { status: newStatus });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
    } catch (err) {
      alert("Greška pri ažuriranju statusa.");
    }
  };

  if (!isSuperAdmin) {
    return <div className="p-20 text-center text-red-500 font-bold">PRISTUP ODBIJEN: Samo za Super Admina.</div>;
  }

  return (
    <DashboardLayout title="Super Admin Panel">
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-blue-50 dark:bg-blue-600/10 border-2 border-blue-600 dark:border-blue-500/20 p-4 rounded-xl">
            <div className="text-blue-700 dark:text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase mb-1">Korisnici</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{users.length}</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-600/10 border-2 border-emerald-600 dark:border-emerald-500/20 p-4 rounded-xl">
            <div className="text-emerald-700 dark:text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase mb-1">Pristup</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{whitelistedEmails.length}</div>
          </div>
          <div className="bg-amber-50 dark:bg-yellow-600/10 border-2 border-amber-600 dark:border-yellow-500/20 p-4 rounded-xl">
            <div className="text-amber-700 dark:text-yellow-400 text-[10px] font-bold uppercase mb-1 tracking-widest">Takmičenja</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{allCompetitions.length}</div>
          </div>
          <div className="bg-teal-50 dark:bg-emerald-600/10 border-2 border-teal-600 dark:border-emerald-500/20 p-4 rounded-xl">
            <div className="text-teal-700 dark:text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase mb-1 tracking-widest">Igrači</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{globalStats.players}</div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-600/10 border-2 border-indigo-600 dark:border-indigo-500/20 p-4 rounded-xl">
            <div className="text-indigo-700 dark:text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase mb-1 tracking-widest">Mečevi</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{globalStats.matches}</div>
          </div>
        </div>

      {/* Tabs */}
      <div className="overflow-x-auto mb-6 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-gray-950 border-2 border-slate-300 dark:border-gray-800 rounded-xl w-fit shadow-xl min-w-min">
          <button 
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'requests' ? 'bg-amber-400 text-black shadow-lg' : 'text-slate-700 dark:text-gray-500 hover:text-slate-900 dark:hover:text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-800'}`}
          >
            <Clock size={14} /> Zahtjevi ({accessRequests.filter(r => r.status === 'pending').length})
          </button>
          <button 
            onClick={() => setActiveTab('profiles')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'profiles' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-700 dark:text-gray-500 hover:text-slate-900 dark:hover:text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-800'}`}
          >
            <Users size={14} /> Profili
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'users' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-700 dark:text-gray-500 hover:text-slate-900 dark:hover:text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-800'}`}
          >
            <Mail size={14} /> Whitelist
          </button>
          <button 
            onClick={() => setActiveTab('competitions')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'competitions' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-700 dark:text-gray-500 hover:text-slate-900 dark:hover:text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-800'}`}
          >
            <Trophy size={14} /> Takmičenja
          </button>
          <button 
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'plans' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-700 dark:text-gray-500 hover:text-slate-900 dark:hover:text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-800'}`}
          >
            <Plus size={14} /> Planovi
          </button>
          <button 
            onClick={() => setActiveTab('bugs')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'bugs' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-700 dark:text-gray-500 hover:text-slate-900 dark:hover:text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-800'}`}
          >
            <Bug size={14} /> Prijave ({reports.filter(r => r.status === 'new').length})
          </button>
        </div>
      </div>

      {/* Access Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {accessRequests.filter(r => r.status === 'pending').length === 0 ? (
            <div className="bg-slate-50 dark:bg-gray-800/30 border-2 border-slate-300 dark:border-gray-700 rounded-lg p-20 text-center">
              <Clock className="w-16 h-16 text-slate-400 dark:text-gray-700 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-700 dark:text-gray-400 mb-2">Nema novih zahtjeva</h3>
              <p className="text-slate-600 dark:text-gray-500">Svi zahtjevi su procesuirani.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {accessRequests.filter(r => r.status === 'pending').map(request => (
                <div key={request.id} className="bg-white dark:bg-gray-900 border-2 border-slate-300 dark:border-gray-800 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-500/50 transition shadow-sm">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{request.organizationName}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-700 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4" />
                          {request.email}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4" />
                          {request.phone}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-yellow-500/10 text-amber-600 dark:text-yellow-500">
                      Pending
                    </span>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-100 dark:bg-gray-800/50 p-4 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-gray-500 mb-1">Kontakt Osoba</div>
                      <div className="font-bold flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        {request.contactPerson}
                      </div>
                    </div>
                    <div className="bg-slate-100 dark:bg-gray-800/50 p-4 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-gray-500 mb-1">Grad</div>
                      <div className="font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        {request.city || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-slate-100 dark:bg-gray-800/50 p-4 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-gray-500 mb-1">Status Zahtjeva</div>
                      <div className="font-bold text-amber-600 dark:text-yellow-500 uppercase">{request.selectedPlan}</div>
                    </div>
                    <div className="bg-slate-100 dark:bg-gray-800/50 p-4 rounded-xl">
                      <div className="text-xs text-slate-500 dark:text-gray-500 mb-1">Datum Zahtjeva</div>
                      <div className="font-bold">
                        {request.createdAt?.toDate ? request.createdAt.toDate().toLocaleDateString() : 'Nedavno'}
                      </div>
                    </div>
                  </div>

                  {request.message && (
                    <div className="bg-blue-50 dark:bg-blue-600/5 border-2 border-blue-200 dark:border-blue-500/10 p-4 rounded-xl mb-6">
                       <div className="text-[10px] text-blue-700 dark:text-blue-600 dark:text-blue-400 font-black uppercase mb-2 tracking-widest">Poruka korisnika:</div>
                       <p className="text-sm text-slate-700 dark:text-slate-700 dark:text-gray-300 italic">"{request.message}"</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleApproveRequest(request)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Odobri Zahtjev
                    </button>
                    <button 
                      onClick={() => handleRejectRequest(request.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg"
                    >
                      <XCircle className="w-5 h-5" />
                      Odbij
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Approved/Rejected History */}
          {accessRequests.filter(r => r.status !== 'pending').length > 0 && (
            <div className="mt-12">
              <h3 className="text-lg font-bold mb-4 text-slate-600 dark:text-gray-400">Procesovani Zahtjevi</h3>
              <div className="space-y-3">
                {accessRequests.filter(r => r.status !== 'pending').map(request => (
                  <div key={request.id} className="bg-white dark:bg-gray-900/30 border border-slate-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {request.organizationName}
                        <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase">{request.selectedPlan}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-gray-500">{request.email}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      {request.approvedAt && (
                        <div className="text-[10px] text-gray-600 text-right">
                          Odobreno: {request.approvedAt.toDate ? request.approvedAt.toDate().toLocaleDateString() : 'Nedavno'}
                        </div>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                        request.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profiles Tab */}
      {activeTab === 'profiles' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 border-2 border-slate-300 dark:border-gray-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-5 border-b-2 border-slate-300 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-950/30">
              <div>
                <h2 className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-white">
                  <Users size={20} className="text-blue-600 dark:text-blue-500" />
                  Korisnički Profili
                </h2>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-700 dark:text-gray-400 text-[9px] font-black uppercase tracking-widest border-b-2 border-slate-300 dark:border-gray-800 bg-slate-100 dark:bg-gray-900/50">
                    <th className="px-5 py-3">Korisnik</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Sadržaj</th>
                    <th className="px-5 py-3">Uloga</th>
                    <th className="px-5 py-3">Pretplata</th>
                    <th className="px-5 py-3 text-right">Upravljanje</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-200 dark:divide-gray-800">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-blue-600/[0.02] transition-colors group">
                      <td className="px-5 py-3">
                        <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{user.displayName || 'N/A'}</div>
                        <div className="text-[8px] text-slate-500 dark:text-gray-600 font-mono mt-0.5 opacity-70">UID: {user.uid}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-xs text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                          <Mail size={10} className="text-gray-600" />
                          {user.email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <div className="bg-slate-100 dark:bg-gray-800/40 px-2 py-1 rounded-lg border border-slate-300 dark:border-gray-700/30 min-w-[50px] text-center">
                            <div className="text-[8px] text-gray-600 uppercase font-black">Turn</div>
                            <div className="text-xs font-bold text-purple-600 dark:text-purple-400">{user.stats?.competitions || 0}</div>
                          </div>
                          <div className="bg-slate-100 dark:bg-gray-800/40 px-2 py-1 rounded-lg border border-slate-300 dark:border-gray-700/30 min-w-[50px] text-center">
                            <div className="text-[8px] text-gray-600 uppercase font-black">Igrač</div>
                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{user.stats?.players || 0}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase w-fit ${
                          user.role === 'super_admin' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-sm text-slate-300">
                          <div>{user.subscriptionPlan || 'N/A'}</div>
                          <div className="text-[11px] text-slate-500 dark:text-gray-500">{user.subscriptionExpiry ? (() => {
                            try {
                              const d = user.subscriptionExpiry.seconds ? new Date(user.subscriptionExpiry.toMillis()) : new Date(user.subscriptionExpiry);
                              const days = Math.ceil((d - new Date()) / (1000*60*60*24));
                              return `${d.toLocaleDateString()} (${days}d)`;
                            } catch (e) {
                              return 'invalid';
                            }
                          })() : 'No expiry'}</div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            className="bg-white dark:bg-gray-800 border-2 border-slate-300 dark:border-gray-700 text-xs rounded-lg px-2 py-1 text-slate-800 dark:text-gray-200"
                            value={userPlanSelections[user.id] || user.subscriptionPlanId || ''}
                            onChange={(e) => setUserPlanSelections(prev => ({ ...prev, [user.id]: e.target.value }))}
                          >
                            <option value="">-- Odaberi plan --</option>
                            {plans.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.periodDays || 0}d)</option>
                            ))}
                          </select>
                          <button onClick={() => assignPlanToUser(user.id, userPlanSelections[user.id] || user.subscriptionPlanId)} className="p-1.5 rounded-lg bg-emerald-600 text-slate-900 dark:text-white hover:bg-emerald-700 transition-all shadow-md">Dodijeli</button>
                          <button onClick={() => openEditSubscription(user)} className="p-1.5 rounded-lg bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-400 hover:bg-slate-300 dark:hover:bg-gray-700 hover:bg-blue-600 hover:text-slate-900 dark:text-white transition-all shadow-md">Edit</button>
                          <button 
                            onClick={() => {
                              if(confirm("Obrisati profil korisnika? Podaci u bazi će ostati ali on gubi pristup.")) {
                                deleteDoc(doc(db, "users", user.id));
                                setUsers(prev => prev.filter(u => u.id !== user.id));
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-400 hover:bg-slate-300 dark:hover:bg-gray-700 hover:bg-red-600 hover:text-slate-900 dark:text-white transition-all shadow-md"
                          >
                            <Trash2 size= {12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users (Whitelist) Tab */}
      {activeTab === 'users' && (
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 border-2 border-slate-300 dark:border-gray-800 rounded-xl p-5 shadow-lg">
              <h2 className="text-sm font-black italic flex items-center gap-2 mb-4 uppercase text-slate-900 dark:text-white">
                <Plus size={16} className="text-emerald-600 dark:text-emerald-500" />
                Dodaj
              </h2>
              <form onSubmit={handleAddWhitelist} className="space-y-3">
                <input 
                  type="email" 
                  placeholder="Email adresa"
                  className="w-full bg-white dark:bg-gray-800 border-2 border-slate-300 dark:border-gray-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-blue-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-emerald-500/20 outline-none transition-all text-xs"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest py-3 rounded-lg text-[10px] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                  <CheckCircle size={14} />
                  Odobri
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-950/30">
                <h2 className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
                  <Shield size={18} className="text-emerald-500" />
                  Autorizovani Admini
                </h2>
              </div>
              <div className="divide-y divide-gray-800">
                {whitelistedEmails.map(user => {
                  return (
                    <div key={user.id} className="p-4 hover:bg-emerald-500/[0.02] transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border-2 border-slate-300 dark:border-gray-700 flex items-center justify-center text-slate-500 dark:text-gray-500 group-hover:text-emerald-600 dark:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-800 dark:text-gray-200">{user.email}</div>
                          <div className="text-[9px] text-gray-600 flex items-center gap-1.5">
                            Uloga: {user.role || 'org_admin'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => removeWhitelist(user.id)}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-500 hover:bg-red-600 hover:text-slate-900 dark:text-white transition-all border border-transparent"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Competitions Tab */}
      {activeTab === 'competitions' && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-950/30">
            <h2 className="text-lg font-black flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Trophy size={20} />
              Sva Takmičenja
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-600 dark:text-gray-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
                  <th className="px-5 py-3">Naziv Turnira</th>
                  <th className="px-5 py-3">Vlasnik (Korisnik)</th>
                  <th className="px-5 py-3">Status / Tip</th>
                  <th className="px-5 py-3 text-right">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {allCompetitions.map(comp => (
                  <tr key={comp.id} className="hover:bg-purple-600/[0.02] transition-colors group">
                    <td className="px-5 py-3">
                      <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:text-purple-400 transition-colors leading-tight">{comp.name}</div>
                      <div className="text-[8px] text-gray-600 font-mono mt-0.5 opacity-50">ID: {comp.id}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <div className="text-xs font-bold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                          <User size={10} className="text-purple-500" />
                          {comp.creatorName}
                        </div>
                        {comp.creatorEmail && (
                          <div className="text-[9px] text-slate-500 dark:text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <Mail size={8} className="text-gray-600" />
                            {comp.creatorEmail}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 leading-tight">{comp.type || 'Turnir'}</span>
                            <span className="text-[8px] text-slate-500 dark:text-gray-500 font-bold uppercase mt-0.5 underline decoration-gray-700 underline-offset-2">{comp.date || 'No Date'}</span>
                        </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a 
                          href={`/competitions/${comp.id}`} 
                          target="_blank"
                          rel="noreferrer"
                          className="bg-slate-100 dark:bg-gray-800 hover:bg-white hover:text-black p-1.5 rounded-lg text-slate-600 dark:text-gray-400 transition-all shadow-md"
                          title="Pogledaj"
                        >
                          <Plus size={12} />
                        </a>
                        <button 
                          onClick={() => handleDeleteCompetition(comp.id)}
                          className="p-1.5 rounded-lg bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-400 hover:bg-slate-300 dark:hover:bg-gray-700 hover:bg-red-600 hover:text-slate-900 dark:text-white transition-all shadow-md"
                          title="Obriši"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 border-2 border-slate-300 dark:border-gray-800 rounded-xl p-5 shadow-lg">
            <h2 className="text-sm font-black italic flex items-center gap-2 mb-4 uppercase text-slate-900 dark:text-white">
              <Plus size={16} className="text-emerald-600 dark:text-emerald-500" />
              {editingPlan ? 'Uredi Plan' : 'Novi Plan'}
            </h2>
            
            {plans.length === 0 && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-300 mb-3">Nema planova u bazi. Želite li dodati početne planove?</p>
                <button 
                  onClick={seedInitialPlansDB}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                >
                  Dodaj početne planove
                </button>
              </div>
            )}
            
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-gray-500 tracking-widest pl-1">Osnovne informacije</label>
                  <div className="grid grid-cols-1 gap-2">
                    <input 
                      type="text"
                      placeholder="Naziv plana (npr. Pro)"
                      className="w-full bg-white dark:bg-gray-800 border-2 border-slate-300 dark:border-gray-700 rounded-lg px-3 py-2.5 focus:border-blue-600 dark:focus:border-emerald-500 outline-none transition-all text-xs"
                      value={editingPlan ? editingPlan.name : newPlan.name}
                      onChange={(e) => editingPlan ? setEditingPlan(prev => ({ ...prev, name: e.target.value })) : setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <input 
                      type="text"
                      placeholder="Cijena (npr. 50 KM / turnir)"
                      className="w-full bg-white dark:bg-gray-800 border-2 border-slate-300 dark:border-gray-700 rounded-lg px-3 py-2.5 focus:border-blue-600 dark:focus:border-emerald-500 outline-none transition-all text-xs"
                      value={editingPlan ? editingPlan.price : newPlan.price}
                      onChange={(e) => editingPlan ? setEditingPlan(prev => ({ ...prev, price: e.target.value })) : setNewPlan(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                </div>
              
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-gray-500 tracking-widest pl-1">Ograničenja (∞ = 999)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-500 uppercase font-bold pl-1 tracking-tight">Turniri/Lige</span>
                      <div className="flex">
                        <input 
                          type="number"
                          className="w-full bg-white dark:bg-gray-800 border-2 border-r-0 border-slate-300 dark:border-gray-700 rounded-l-lg px-2 py-2 focus:border-blue-600 dark:focus:border-emerald-500 outline-none transition-all text-xs"
                          value={editingPlan ? editingPlan.tournamentsLimit : newPlan.tournamentsLimit}
                          onChange={(e) => editingPlan ? setEditingPlan(prev => ({ ...prev, tournamentsLimit: e.target.value })) : setNewPlan(prev => ({ ...prev, tournamentsLimit: e.target.value }))}
                        />
                        <button 
                          type="button"
                          onClick={() => editingPlan ? setEditingPlan(prev => ({ ...prev, tournamentsLimit: 999 })) : setNewPlan(prev => ({ ...prev, tournamentsLimit: 999 }))}
                          className="px-2.5 bg-slate-100 dark:bg-gray-800 border-2 border-slate-300 dark:border-gray-700 rounded-r-lg text-xs hover:bg-emerald-600 hover:text-white transition-all font-bold"
                        >
                          ∞
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-500 uppercase font-bold pl-1 tracking-tight">Trajanje (dani)</span>
                      <div className="flex">
                        <input 
                          type="number"
                          className="w-full bg-white dark:bg-gray-800 border-2 border-r-0 border-slate-300 dark:border-gray-700 rounded-l-lg px-2 py-2 focus:border-blue-600 dark:focus:border-emerald-500 outline-none transition-all text-xs"
                          value={editingPlan ? editingPlan.periodDays : newPlan.periodDays}
                          onChange={(e) => editingPlan ? setEditingPlan(prev => ({ ...prev, periodDays: e.target.value })) : setNewPlan(prev => ({ ...prev, periodDays: e.target.value }))}
                        />
                        <button 
                          type="button"
                          onClick={() => editingPlan ? setEditingPlan(prev => ({ ...prev, periodDays: 999 })) : setNewPlan(prev => ({ ...prev, periodDays: 999 }))}
                          className="px-2.5 bg-slate-100 dark:bg-gray-800 border-2 border-slate-300 dark:border-gray-700 rounded-r-lg text-xs hover:bg-emerald-600 hover:text-white transition-all font-bold"
                        >
                          ∞
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-500 uppercase font-bold pl-1 tracking-tight">Limit grupa</span>
                      <div className="flex">
                        <input 
                          type="number"
                          className="w-full bg-white dark:bg-gray-800 border-2 border-r-0 border-slate-300 dark:border-gray-700 rounded-l-lg px-2 py-2 focus:border-blue-600 dark:focus:border-emerald-500 outline-none transition-all text-xs"
                          value={editingPlan ? editingPlan.groupsLimit : newPlan.groupsLimit}
                          onChange={(e) => editingPlan ? setEditingPlan(prev => ({ ...prev, groupsLimit: e.target.value })) : setNewPlan(prev => ({ ...prev, groupsLimit: e.target.value }))}
                        />
                        <button 
                          type="button"
                          onClick={() => editingPlan ? setEditingPlan(prev => ({ ...prev, groupsLimit: 999 })) : setNewPlan(prev => ({ ...prev, groupsLimit: 999 }))}
                          className="px-2.5 bg-slate-100 dark:bg-gray-800 border-2 border-slate-300 dark:border-gray-700 rounded-r-lg text-xs hover:bg-emerald-600 hover:text-white transition-all font-bold"
                        >
                          ∞
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-500 uppercase font-bold pl-1 tracking-tight">Igrača/grupa</span>
                      <div className="flex">
                        <input 
                          type="number"
                          className="w-full bg-white dark:bg-gray-800 border-2 border-r-0 border-slate-300 dark:border-gray-700 rounded-l-lg px-2 py-2 focus:border-blue-600 dark:focus:border-emerald-500 outline-none transition-all text-xs"
                          value={editingPlan ? editingPlan.playersPerGroupLimit : newPlan.playersPerGroupLimit}
                          onChange={(e) => editingPlan ? setEditingPlan(prev => ({ ...prev, playersPerGroupLimit: e.target.value })) : setNewPlan(prev => ({ ...prev, playersPerGroupLimit: e.target.value }))}
                        />
                        <button 
                          type="button"
                          onClick={() => editingPlan ? setEditingPlan(prev => ({ ...prev, playersPerGroupLimit: 999 })) : setNewPlan(prev => ({ ...prev, playersPerGroupLimit: 999 }))}
                          className="px-2.5 bg-slate-100 dark:bg-gray-800 border-2 border-slate-300 dark:border-gray-700 rounded-r-lg text-xs hover:bg-emerald-600 hover:text-white transition-all font-bold"
                        >
                          ∞
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-gray-500 tracking-widest pl-1">Stavke / Opcije</label>
                  <form onSubmit={handleAddFeature} className="flex items-center gap-1.5 bg-slate-50 dark:bg-gray-800/50 p-1.5 rounded-lg border-2 border-slate-200 dark:border-gray-800">
                    <input 
                      type="text"
                      placeholder="Dodaj..."
                      className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-xs px-1"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                    />
                    <label className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-gray-400 cursor-pointer hover:text-emerald-600 transition-colors">
                      <input 
                        type="checkbox"
                        checked={featureUnlimited}
                        onChange={(e) => setFeatureUnlimited(e.target.checked)}
                        className="w-3.5 h-3.5 text-emerald-600 bg-white dark:bg-gray-900 border-slate-300 dark:border-gray-700 rounded focus:ring-emerald-500/20"
                      />
                      ∞
                    </label>
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-md transition-all">
                      <Plus size={14} />
                    </button>
                  </form>
                
                  <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                    {(editingPlan ? editingPlan.features : newPlan.features).map((feature, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-2.5 py-2 group shadow-sm">
                        <span className="text-[11px] text-slate-700 dark:text-gray-300 leading-tight pr-2 flex items-center gap-1.5">
                          {typeof feature === 'object' && feature.unlimited && <Crown size={10} className="text-amber-500 shrink-0" />}
                          <span className="truncate">{typeof feature === 'string' ? feature : feature.text}</span>
                        </span>
                        <button 
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                        >
                          <XCircle size= {12} />
                        </button>
                      </div>
                    ))}
                    {(editingPlan ? editingPlan.features : newPlan.features).length === 0 && (
                      <div className="text-[10px] text-slate-400 italic py-4 text-center border-2 border-dashed border-slate-100 dark:border-gray-800 rounded-lg">Prazna lista stavki</div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    onClick={handleCreateOrUpdatePlan}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest py-3 rounded-xl text-[10px] transition-all shadow-lg shadow-blue-900/10 active:scale-95"
                  >
                    {editingPlan ? 'Spremi Izmjene' : 'Kreiraj Plan'}
                  </button>
                  {editingPlan && (
                    <button 
                      onClick={cancelEditPlan}
                      className="bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-400 px-4 rounded-xl transition-all"
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="grid md:grid-cols-2 gap-4 h-fit">
              {plans.length === 0 && (
                <div className="col-span-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg p-12 text-center">
                  <Shield size={40} className="text-gray-800 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-gray-500 font-bold italic">Nema definiranih planova.</p>
                </div>
              )}
              {plans.map(plan => (
                <div key={plan.id} className="bg-white dark:bg-gray-900 border-2 border-slate-300 dark:border-gray-800 rounded-lg overflow-hidden hover:border-teal-500 dark:hover:border-emerald-500/30 hover:shadow-lg transition-all flex flex-col group relative">
                  {plan.badge && (
                    <div className="absolute -top-3 -right-3 z-10">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-full shadow-lg border-2 border-white dark:border-gray-900 tracking-wider">
                        {plan.badge}
                      </div>
                    </div>
                  )}
                  <div className="p-6 border-b-2 border-slate-200 dark:border-gray-800">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-emerald-400 transition-colors">{plan.name}</h3>
                        <div className="text-teal-600 dark:text-emerald-500 font-black text-lg mt-1">{plan.price || 'Gratis'}</div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => startEditPlan(plan)} className="p-2 rounded-lg bg-blue-50 dark:bg-gray-800 text-blue-700 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white transition-all border-2 border-transparent hover:border-blue-600">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDeletePlan(plan.id)} className="p-2 rounded-lg bg-red-50 dark:bg-gray-800 text-red-700 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all border-2 border-transparent hover:border-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-500 dark:text-gray-700" />
                        {plan.periodDays >= 365 ? 'Neograničeno' : `${plan.periodDays || 0} Dana`}
                      </div>
                      <div className="flex items-center gap-1.5" title="Ukupni limit turnira i liga">
                        <Trophy size={12} className="text-slate-500 dark:text-gray-700" />
                        {plan.tournamentsLimit >= 99 ? 'Neograničeno' : `${plan.tournamentsLimit || 0} Turnira/Liga`}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Layout size={12} className="text-slate-500 dark:text-gray-700" />
                        {plan.groupsLimit >= 99 ? 'Neograničeno' : `${plan.groupsLimit || 0} Grupa`}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-slate-500 dark:text-gray-700" />
                        {plan.playersPerGroupLimit >= 99 ? 'Neograničeno' : `${plan.playersPerGroupLimit || 0} Igrača`}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 dark:bg-gray-950/20 flex-1 border-t-2 border-slate-100 dark:border-transparent">
                    <div className="space-y-2.5">
                      {(plan.features || []).map((feature, fidx) => (
                        <div key={fidx} className="flex items-start gap-2.5">
                          <div className="mt-1">
                            {typeof feature === 'object' && feature.unlimited ? (
                              <Crown size={12} className="text-amber-600 dark:text-amber-400" />
                            ) : (
                              <CheckCircle size={12} className="text-teal-600 dark:text-emerald-500" />
                            )}
                          </div>
                          <span className="text-slate-700 dark:text-gray-400 text-xs font-medium leading-tight">
                            {typeof feature === 'string' ? feature : feature.text}
                            {typeof feature === 'object' && feature.unlimited && <span className="text-amber-600 dark:text-amber-400 font-bold ml-1">(∞)</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bugs / Reports Tab */}
      {activeTab === 'bugs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Bug className="text-rose-500" /> Greške i Unaprijeđenja
            </h2>
            <div className="text-xs text-slate-500">
              Ukupno prijava: {reports.length}
            </div>
          </div>

          <div className="grid gap-4">
            {reports.length === 0 ? (
              <div className="text-center p-12 bg-slate-50 dark:bg-gray-800/20 rounded-xl border-2 border-dashed border-slate-200 dark:border-gray-800">
                <p className="text-slate-500">Nema prijava.</p>
              </div>
            ) : (
              reports.map(report => (
                <div key={report.id} className={`bg-white dark:bg-gray-900 border-2 rounded-xl p-4 shadow-sm transition-all ${report.status === 'new' ? 'border-rose-200 dark:border-rose-900/30' : 'border-slate-200 dark:border-gray-800'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${report.type === 'bug' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'}`}>
                          {report.type === 'bug' ? 'Greška' : 'Prijedlog'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium italic">
                          {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleString('bs-BA') : 'Nepoznato'}
                        </span>
                        {report.status === 'new' && (
                          <span className="animate-pulse flex h-2 w-2 rounded-full bg-rose-500"></span>
                        )}
                      </div>
                      
                      <p className="text-slate-800 dark:text-gray-200 font-medium mb-3 whitespace-pre-wrap leading-relaxed">
                        {report.message}
                      </p>

                      <div className="flex flex-wrap gap-4 text-[11px]">
                        <div className="text-slate-500">
                          <span className="font-bold text-slate-700 dark:text-gray-400">Email:</span> {report.email}
                        </div>
                        <div className="text-slate-500 truncate max-w-xs" title={report.url}>
                          <span className="font-bold text-slate-700 dark:text-gray-400">URL:</span> {report.url}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select 
                        value={report.status || 'new'} 
                        onChange={(e) => handleUpdateReportStatus(report.id, e.target.value)}
                        className={`text-[10px] font-bold uppercase rounded border-2 px-2 py-1 outline-none transition focus:ring-0 ${
                          report.status === 'resolved' ? 'border-emerald-500 text-emerald-600' : 
                          report.status === 'in_progress' ? 'border-blue-500 text-blue-600' : 
                          'border-rose-500 text-rose-600'
                        } bg-white dark:bg-gray-800`}
                      >
                        <option value="new">Nova</option>
                        <option value="in_progress">U radu</option>
                        <option value="resolved">Riješeno</option>
                        <option value="ignored">Ignorisati</option>
                      </select>

                      <button 
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {report.userAgent && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-800">
                      <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1 italic">Tehnički podaci</div>
                      <div className="text-[10px] text-slate-500 font-mono bg-slate-50 dark:bg-gray-950 p-2 rounded text-wrap break-all">
                        {report.userAgent}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
      {/* Edit subscription modal */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/80" onClick={() => setEditingSub(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 w-full max-w-md z-10">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Uredi pretplatu — {editingSub.email}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400">Plan</label>
                <input className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white" value={editingSub.subscriptionPlan} onChange={e => setEditingSub({...editingSub, subscriptionPlan: e.target.value})} />
              </div>
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400">Datum isteka</label>
                <input type="date" className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white" value={editingSub.subscriptionExpiry ? new Date(editingSub.subscriptionExpiry).toISOString().slice(0,10) : ''} onChange={e => setEditingSub({...editingSub, subscriptionExpiry: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition" onClick={() => setEditingSub(null)}>Otkaži</button>
              <button className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition" onClick={saveSubscription}>Spremi</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
