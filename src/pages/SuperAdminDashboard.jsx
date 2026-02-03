import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { Shield, Building2, Users, Crown, CheckCircle, XCircle, Plus, Mail, Trash2, Clock, Phone, User, Trophy, Edit2 } from 'lucide-react';

const SuperAdminDashboard = () => {
  const { userData, isSuperAdmin } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [allCompetitions, setAllCompetitions] = useState([]);
  const [globalStats, setGlobalStats] = useState({ players: 0, matches: 0 });
  const [whitelistedEmails, setWhitelistedEmails] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('organizations'); // 'organizations' | 'requests'
  const [editingOrg, setEditingOrg] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Organizations
        const orgsQ = query(collection(db, "organizations"), orderBy("createdAt", "desc"));
        const orgsSnap = await getDocs(orgsQ);
        const orgsData = orgsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const orgStats = {};
        orgsData.forEach(org => {
          orgStats[org.id] = { competitions: 0, players: 0 };
        });

        // Fetch All Competitions
        const compsSnap = await getDocs(collection(db, "competitions"));
        const compsData = compsSnap.docs.map(d => {
          const data = d.data();
          if (data.organizationId && orgStats[data.organizationId]) {
            orgStats[data.organizationId].competitions++;
          }
          const org = orgsData.find(o => o.id === data.organizationId);
          return { id: d.id, ...data, organizationName: org?.name || 'N/A' };
        });
        setAllCompetitions(compsData);

        // Fetch All Players
        const playersSnap = await getDocs(collection(db, "players"));
        playersSnap.forEach(p => {
          const data = p.data();
          if (data.organizationId && orgStats[data.organizationId]) {
            orgStats[data.organizationId].players++;
          }
        });

        // Merge stats back to organizations
        const finalOrgs = orgsData.map(o => ({
          ...o,
          stats: orgStats[o.id] || { competitions: 0, players: 0 }
        }));
        setOrganizations(finalOrgs);

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
      // 0. Napravi organizaciju
      const orgRef = await addDoc(collection(db, "organizations"), {
        name: request.organizationName || "Nova Organizacija",
        plan: request.selectedPlan || 'basic',
        contactPerson: request.contactPerson || "",
        phone: request.phone || "",
        adminEmail: request.email.toLowerCase().trim(),
        createdAt: new Date(),
        subscriptionStatus: 'active'
      });

      // 1. Dodaj na whitelistu sa povezanim organizationId
      await addDoc(collection(db, "whitelisted_emails"), {
        email: request.email.toLowerCase().trim(),
        organizationId: orgRef.id,
        addedAt: new Date(),
        status: 'active',
        approvedFrom: 'access_request'
      });

      // 2. Update status zahtjeva
      await updateDoc(doc(db, "access_requests", request.id), {
        status: 'approved',
        approvedAt: new Date(),
        organizationId: orgRef.id
      });

      // 3. Update local state
      setAccessRequests(prev => prev.map(r => 
        r.id === request.id ? { ...r, status: 'approved' } : r
      ));
      setWhitelistedEmails(prev => [...prev, { email: request.email, organizationId: orgRef.id }]);

      alert(`Zahtjev odobren! Kreirana organizacija i email ${request.email} dodan na listu.`);
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
      // Svaki org_admin mora imati organizaciju. Kreiramo defaultnu za ručno dodane.
      const orgRef = await addDoc(collection(db, "organizations"), {
        name: "Standardna Organizacija",
        adminEmail: newEmail.toLowerCase().trim(),
        plan: 'basic',
        subscriptionStatus: 'active',
        createdAt: new Date()
      });

      const docRef = await addDoc(collection(db, "whitelisted_emails"), {
        email: newEmail.toLowerCase().trim(),
        organizationId: orgRef.id,
        addedAt: new Date(),
        status: 'active'
      });

      setWhitelistedEmails(prev => [...prev, { 
        id: docRef.id, 
        email: newEmail.toLowerCase().trim(),
        organizationId: orgRef.id 
      }]);
      setNewEmail('');
      alert(`Email ${newEmail} je dodan na listu i kreirana je defaultna organizacija.`);
    } catch (err) {
      console.error("Greška pri dodavanju:", err);
      alert("Greška pri dodavanju na listu.");
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

  if (!isSuperAdmin) {
    return <div className="p-20 text-center text-red-500 font-bold">PRISTUP ODBIJEN: Samo za Super Admina.</div>;
  }

  return (
    <DashboardLayout title="Super Admin Panel">
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl">
            <div className="text-blue-400 text-[10px] font-bold uppercase mb-1">Klijenti</div>
            <div className="text-2xl font-black">{organizations.length}</div>
          </div>
          <div className="bg-purple-600/10 border border-purple-500/20 p-4 rounded-xl">
            <div className="text-purple-400 text-[10px] font-bold uppercase mb-1">Pretplate</div>
            <div className="text-2xl font-black">{organizations.filter(o => o.subscriptionStatus === 'active').length}</div>
          </div>
          <div className="bg-yellow-600/10 border border-yellow-500/20 p-4 rounded-xl">
            <div className="text-yellow-400 text-[10px] font-bold uppercase mb-1 tracking-widest">Takmičenja</div>
            <div className="text-2xl font-black">{allCompetitions.length}</div>
          </div>
          <div className="bg-emerald-600/10 border border-emerald-500/20 p-4 rounded-xl">
            <div className="text-emerald-400 text-[10px] font-bold uppercase mb-1 tracking-widest">Igrači</div>
            <div className="text-2xl font-black">{globalStats.players}</div>
          </div>
          <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl">
            <div className="text-indigo-400 text-[10px] font-bold uppercase mb-1 tracking-widest">Mečevi</div>
            <div className="text-2xl font-black">{globalStats.matches}</div>
          </div>
        </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-950 border border-gray-800 rounded-xl mb-6 w-fit shadow-2xl">
        <button 
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${activeTab === 'requests' ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-500/20' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Clock size={14} /> Zahtjevi ({accessRequests.filter(r => r.status === 'pending').length})
        </button>
        <button 
          onClick={() => setActiveTab('organizations')}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${activeTab === 'organizations' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Building2 size={14} /> Organizacije
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${activeTab === 'users' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Users size={14} /> Korisnici
        </button>
        <button 
          onClick={() => setActiveTab('competitions')}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${activeTab === 'competitions' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Trophy size={14} /> Takmičenja
        </button>
      </div>

      {/* Access Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {accessRequests.filter(r => r.status === 'pending').length === 0 ? (
            <div className="bg-gray-800/30 border border-gray-700 rounded-3xl p-20 text-center">
              <Clock className="w-16 h-16 text-gray-700 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">Nema novih zahtjeva</h3>
              <p className="text-gray-500">Svi zahtjevi su procesuirani.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {accessRequests.filter(r => r.status === 'pending').map(request => (
                <div key={request.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 hover:border-blue-500/50 transition">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{request.organizationName}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
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
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-yellow-500/10 text-yellow-500">
                      Pending
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-800/50 p-4 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">Kontakt Osoba</div>
                      <div className="font-bold flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        {request.contactPerson}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">Odabrani Plan</div>
                      <div className="font-bold text-blue-400 uppercase">{request.selectedPlan}</div>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">Datum Zahtjeva</div>
                      <div className="font-bold">{request.createdAt?.toDate().toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleApproveRequest(request)}
                      className="flex-1 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Odobri Zahtjev
                    </button>
                    <button 
                      onClick={() => handleRejectRequest(request.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
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
              <h3 className="text-lg font-bold mb-4 text-gray-400">Procesovani Zahtjevi</h3>
              <div className="space-y-3">
                {accessRequests.filter(r => r.status !== 'pending').map(request => (
                  <div key={request.id} className="bg-gray-900/30 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {request.organizationName}
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded uppercase">{request.selectedPlan}</span>
                      </div>
                      <div className="text-xs text-gray-500">{request.email}</div>
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

      {/* Organizations Tab */}
      {activeTab === 'organizations' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-950/30">
              <div>
                <h2 className="text-lg font-black flex items-center gap-2">
                  <Building2 size={20} className="text-blue-500" />
                  Lista Organizacija
                </h2>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-[9px] font-black uppercase tracking-widest border-b border-gray-800 bg-gray-900/50">
                    <th className="px-5 py-3">Organizacija</th>
                    <th className="px-5 py-3">Admin / Kontakt</th>
                    <th className="px-5 py-3">Sadržaj</th>
                    <th className="px-5 py-3">Plan / Status</th>
                    <th className="px-5 py-3 text-right">Upravljanje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {organizations.map(org => (
                    <tr key={org.id} className="hover:bg-blue-600/[0.02] transition-colors group">
                      <td className="px-5 py-3">
                        <div className="font-bold text-sm group-hover:text-blue-400 transition-colors">{org.name}</div>
                        <div className="text-[8px] text-gray-600 font-mono mt-0.5 opacity-50">ID: {org.id}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <div className="text-xs text-gray-300 flex items-center gap-1.5 leading-tight">
                            <Mail size={10} className="text-gray-600" />
                            {org.adminEmail || 'N/A'}
                          </div>
                          {org.phone && (
                            <div className="text-[10px] text-gray-500 flex items-center gap-1.5 leading-tight mt-0.5">
                              <Phone size={9} className="text-gray-600" />
                              {org.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <div className="bg-gray-800/40 px-2 py-1 rounded-lg border border-gray-700/30 min-w-[50px] text-center">
                            <div className="text-[8px] text-gray-600 uppercase font-black">Turn</div>
                            <div className="text-xs font-bold text-purple-400">{org.stats?.competitions || 0}</div>
                          </div>
                          <div className="bg-gray-800/40 px-2 py-1 rounded-lg border border-gray-700/30 min-w-[50px] text-center">
                            <div className="text-[8px] text-gray-600 uppercase font-black">Igrač</div>
                            <div className="text-xs font-bold text-emerald-400">{org.stats?.players || 0}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-black uppercase text-blue-400">
                            {org.plan?.toUpperCase() || 'BASIC'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase w-fit ${
                            org.subscriptionStatus === 'active' ? 'bg-green-500/10 text-green-500' : 
                            org.subscriptionStatus === 'suspended' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                          }`}>
                            {org.subscriptionStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingOrg(org)}
                            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-blue-600 hover:text-white transition-all shadow-md"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={() => toggleStatus(org.id, org.subscriptionStatus)}
                            className={`px-2 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all shadow-md border ${
                              org.subscriptionStatus === 'active' 
                                ? 'bg-amber-600/10 text-amber-500 hover:bg-amber-600 hover:text-white border-amber-600/20' 
                                : 'bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-white border-green-600/20'
                            }`}
                          >
                            {org.subscriptionStatus === 'active' ? 'Susp' : 'Akt'}
                          </button>
                          <button 
                            onClick={() => handleDeleteOrganization(org.id)}
                            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-red-600 hover:text-white transition-all shadow-md"
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
        </div>
      )}

      {/* Users (Whitelist) Tab */}
      {activeTab === 'users' && (
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-2xl">
              <h2 className="text-sm font-black italic flex items-center gap-2 mb-4 uppercase">
                <Plus size={16} className="text-emerald-500" />
                Dodaj
              </h2>
              <form onSubmit={handleAddWhitelist} className="space-y-3">
                <input 
                  type="email" 
                  placeholder="Email adresa"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-emerald-500 outline-none transition-all text-xs"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest py-3 rounded-lg text-[10px] transition-all flex items-center justify-center gap-2">
                  <CheckCircle size={14} />
                  Odobri
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-gray-800 bg-gray-950/30">
                <h2 className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
                  <Shield size={18} className="text-emerald-500" />
                  Autorizovani Admini
                </h2>
              </div>
              <div className="divide-y divide-gray-800">
                {whitelistedEmails.map(user => {
                  const userOrg = organizations.find(o => o.id === user.organizationId);
                  return (
                    <div key={user.id} className="p-4 hover:bg-emerald-500/[0.02] transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-gray-200">{user.email}</div>
                          <div className="text-[9px] text-gray-600 flex items-center gap-1.5">
                            {userOrg?.name || 'Dodijeljena Organizacija'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => removeWhitelist(user.id)}
                          className="p-2 rounded-lg bg-gray-800 text-gray-500 hover:bg-red-600 hover:text-white transition-all border border-transparent"
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
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-gray-800 bg-gray-950/30">
            <h2 className="text-lg font-black flex items-center gap-2 text-purple-400">
              <Trophy size={20} />
              Sva Takmičenja
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-[9px] font-black uppercase tracking-widest border-b border-gray-800 bg-gray-900/50">
                  <th className="px-5 py-3">Naziv Turnira</th>
                  <th className="px-5 py-3">Organizacija</th>
                  <th className="px-5 py-3">Status / Tip</th>
                  <th className="px-5 py-3 text-right">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {allCompetitions.map(comp => (
                  <tr key={comp.id} className="hover:bg-purple-600/[0.02] transition-colors group">
                    <td className="px-5 py-3">
                      <div className="font-bold text-sm text-white group-hover:text-purple-400 transition-colors leading-tight">{comp.name}</div>
                      <div className="text-[8px] text-gray-600 font-mono mt-0.5 opacity-50">ID: {comp.id}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                        <Building2 size={10} className="text-gray-600" />
                        {comp.organizationName}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-blue-400 leading-tight">{comp.type || 'Turnir'}</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase mt-0.5 underline decoration-gray-700 underline-offset-2">{comp.date || 'No Date'}</span>
                        </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a 
                          href={`/competitions/${comp.id}`} 
                          target="_blank"
                          rel="noreferrer"
                          className="bg-gray-800 hover:bg-white hover:text-black p-1.5 rounded-lg text-gray-400 transition-all shadow-md"
                          title="Pogledaj"
                        >
                          <Plus size={12} />
                        </a>
                        <button 
                          onClick={() => handleDeleteCompetition(comp.id)}
                          className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-red-600 hover:text-white transition-all shadow-md"
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
      
      {/* Edit Organization Modal */}
      {editingOrg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
              <h3 className="text-white font-black uppercase italic tracking-tighter text-lg">Uredi Organizaciju</h3>
              <button onClick={() => setEditingOrg(null)} className="text-gray-500 hover:text-white transition-colors"><XCircle size={24} /></button>
            </div>
            
            <form onSubmit={handleUpdateOrg} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">Naziv Organizacije</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 transition-all"
                  value={editingOrg.name}
                  onChange={(e) => setEditingOrg({...editingOrg, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">Admin Email</label>
                <input 
                  type="email" 
                  className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 transition-all"
                  value={editingOrg.adminEmail}
                  onChange={(e) => setEditingOrg({...editingOrg, adminEmail: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">Plan Pretplate</label>
                <select 
                  className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500 transition-all"
                  value={editingOrg.plan}
                  onChange={(e) => setEditingOrg({...editingOrg, plan: e.target.value})}
                >
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingOrg(null)}
                  className="flex-1 bg-gray-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-700 transition-all"
                >
                  Odustani
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20"
                >
                  Sačuvaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
