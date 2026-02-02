import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { Shield, Building2, Users, Crown, CheckCircle, XCircle, Plus, Mail, Trash2, Clock, Phone, User } from 'lucide-react';

const SuperAdminDashboard = () => {
  const { userData, isSuperAdmin } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [whitelistedEmails, setWhitelistedEmails] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('organizations'); // 'organizations' | 'requests'

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Organizations
        const orgsQ = query(collection(db, "organizations"), orderBy("createdAt", "desc"));
        const orgsSnap = await getDocs(orgsQ);
        setOrganizations(orgsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Whitelisted Emails
        const whiteQ = query(collection(db, "whitelisted_emails"));
        const whiteSnap = await getDocs(whiteQ);
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

  if (!isSuperAdmin) {
    return <div className="p-20 text-center text-red-500 font-bold">PRISTUP ODBIJEN: Samo za Super Admina.</div>;
  }

  return (
    <DashboardLayout title="Super Admin Panel">
      <div className="space-y-10">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-2xl">
          <div className="text-blue-400 text-sm font-bold uppercase mb-2">Ukupno Klijenata</div>
          <div className="text-4xl font-black">{organizations.length}</div>
        </div>
        <div className="bg-purple-600/10 border border-purple-500/20 p-6 rounded-2xl">
          <div className="text-purple-400 text-sm font-bold uppercase mb-2">Aktivne Pretplate</div>
          <div className="text-4xl font-black">{organizations.filter(o => o.subscriptionStatus === 'active').length}</div>
        </div>
        <div className="bg-yellow-600/10 border border-yellow-500/20 p-6 rounded-2xl">
          <div className="text-yellow-400 text-sm font-bold uppercase mb-2">Na Čekanju</div>
          <div className="text-4xl font-black">{accessRequests.filter(r => r.status === 'pending').length}</div>
        </div>
        <div className="bg-green-600/10 border border-green-500/20 p-6 rounded-2xl">
          <div className="text-green-400 text-sm font-bold uppercase mb-2">Whitelisted</div>
          <div className="text-4xl font-black">{whitelistedEmails.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-900/50 border border-gray-800 rounded-2xl mb-8 w-fit">
        <button 
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${activeTab === 'requests' ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-500/20' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Clock size={18} /> Zahtjevi ({accessRequests.filter(r => r.status === 'pending').length})
        </button>
        <button 
          onClick={() => setActiveTab('organizations')}
          className={`px-6 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${activeTab === 'organizations' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Building2 size={18} /> Organizacije
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
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Whitelist Management */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-900/50 rounded-3xl border border-gray-800 p-6">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <Mail size={24} className="text-purple-500" />
                Dozvoljeni Emailovi
              </h2>
              
              <form onSubmit={handleAddWhitelist} className="flex gap-2 mb-6">
                <input 
                  type="email" 
                  placeholder="email@primjer.com"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 focus:border-blue-500 outline-none"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <button type="submit" className="bg-blue-600 p-2 rounded-xl hover:bg-blue-700 transition">
                  <Plus size={20} />
                </button>
              </form>

              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {whitelistedEmails.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-700/50">
                    <span className="text-sm font-medium">{item.email}</span>
                    <button onClick={() => removeWhitelist(item.id)} className="text-gray-500 hover:text-red-500 transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {whitelistedEmails.length === 0 && (
                  <div className="text-center py-4 text-gray-600 italic text-sm">Nema dodanih emailova.</div>
                )}
              </div>
            </div>
          </div>

          {/* Organizations Table */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 rounded-3xl border border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Building2 size={24} className="text-blue-500" />
                  Lista Organizacija
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4">Organizacija</th>
                      <th className="px-6 py-4">Admin Email</th>
                      <th className="px-6 py-4">Plan</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Akcije</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {organizations.map(org => (
                      <tr key={org.id} className="hover:bg-gray-800/30 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold">{org.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{org.id}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{org.adminEmail || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-blue-400 capitalize">{org.plan || 'basic'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            org.subscriptionStatus === 'active' ? 'bg-green-500/10 text-green-500' : 
                            org.subscriptionStatus === 'suspended' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                          }`}>
                            {org.subscriptionStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => toggleStatus(org.id, org.subscriptionStatus)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                              org.subscriptionStatus === 'active' 
                                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                                : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                            }`}
                          >
                            {org.subscriptionStatus === 'active' ? 'Suspenduj' : 'Aktiviraj'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {organizations.length === 0 && !loading && (
                      <tr>
                        <td colSpan="5" className="p-10 text-center text-gray-600 italic">Nema registrovanih organizacija.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
