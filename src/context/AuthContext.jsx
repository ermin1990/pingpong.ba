import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, addDoc, collection, updateDoc, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("onAuthStateChanged:", currentUser?.email);
      setLoading(true);
      
      try {
        if (currentUser) {
          setUser(currentUser);
          const userEmail = currentUser.email?.toLowerCase().trim();
          if (!userEmail) {
            setUserData({ role: 'unauthorized', message: 'Email nije dostupan.' });
            setLoading(false);
            return;
          }

          const isSuperAdmin = userEmail === 'selimovicermin90@gmail.com';
          
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (!docSnap.exists()) {
            console.log("Novi korisnik, provjera whiteliste za:", userEmail);
            
            // Provjera Whiteliste
            let isAllowed = false;
            let whitelistedOrgId = null;
            try {
              const whiteQ = query(collection(db, "whitelisted_emails"), where("email", "==", userEmail));
              const whiteSnap = await getDocs(whiteQ);
              isAllowed = !whiteSnap.empty;
              if (isAllowed) {
                whitelistedOrgId = whiteSnap.docs[0].data()?.organizationId || null;
                console.log("Whitelisted org found:", whitelistedOrgId);
              }
            } catch (whiteErr) {
              console.error("Whitelist check failed:", whiteErr);
              isAllowed = isSuperAdmin;
            }
            
            if (!isSuperAdmin && !isAllowed) {
              console.log("Email nije na listi dozvoljenih.");
              setUserData({ role: 'unauthorized', email: userEmail });
              setLoading(false);
              return;
            }

            console.log("Email dozvoljen, pravim profil...");
            const newUserData = {
              email: userEmail,
              displayName: currentUser.displayName || 'Korisnik',
              role: isSuperAdmin ? 'super_admin' : 'org_admin',
              organizationId: whitelistedOrgId,
              createdAt: new Date()
            };

            await setDoc(docRef, newUserData);
            setUserData(newUserData);
          } else {
            let data = docSnap.data();
            
            // Repair: Ako je org_admin a nema organizationId, provjeri whitelistu ponovo
            if (data.role === 'org_admin' && !data.organizationId) {
              console.log("Repairing org_admin with missing organizationId...");
              const whiteQ = query(collection(db, "whitelisted_emails"), where("email", "==", userEmail));
              const whiteSnap = await getDocs(whiteQ);
              if (!whiteSnap.empty) {
                const whiteData = whiteSnap.docs[0].data();
                if (whiteData.organizationId) {
                  data.organizationId = whiteData.organizationId;
                  await updateDoc(docRef, { organizationId: whiteData.organizationId });
                  console.log("Profil uspješno popravljen.");
                } else {
                  console.warn("Whitelist entry exists but has no organizationId.");
                  // Zadnja linija odbrane: Kreiraj organizaciju ako je nema nigdje
                  const orgRef = await addDoc(collection(db, "organizations"), {
                    name: "Automatska Organizacija",
                    adminEmail: userEmail,
                    plan: 'basic',
                    subscriptionStatus: 'active',
                    createdAt: new Date()
                  });
                  data.organizationId = orgRef.id;
                  await updateDoc(docRef, { organizationId: orgRef.id });
                  // Također update whitelistu
                  await updateDoc(doc(db, "whitelisted_emails", whiteSnap.docs[0].id), { organizationId: orgRef.id });
                  console.log("Kreirana nova organizacija u repair fazi.");
                }
              }
            }

            // Force super_admin role for specific email
            if (isSuperAdmin && data.role !== 'super_admin') {
              data.role = 'super_admin';
              await updateDoc(docRef, { role: 'super_admin' });
            }
            console.log("Profil učitan.");
            setUserData(data);
          }
        } else {
          setUser(null);
          setUserData(null);
        }
      } catch (err) {
        console.error("Firestore Error:", err);
        // Fallback da te barem pusti unutra ako Auth radi a Firestore zeza
        if (currentUser) {
          setUserData({ 
            email: currentUser.email, 
            role: currentUser.email === 'selimovicermin90@gmail.com' ? 'super_admin' : 'org_admin' 
          });
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userData,
    isSuperAdmin: userData?.role === 'super_admin',
    isAdmin: userData?.role === 'org_admin',
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
