import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, addDoc, collection, updateDoc, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext({
  user: null,
  userData: null,
  planDetails: null, // Add planDetails
  isSuperAdmin: false,
  isAdmin: false,
  loading: true,
  logout: () => {},
  loginWithEmail: () => {},
  registerWithEmail: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [planDetails, setPlanDetails] = useState(null); // Add planDetails state
  const [loading, setLoading] = useState(true);

  // Helper function to fetch plan details
  const fetchPlanDetails = async (planId) => {
    if (!planId) return null;
    try {
      const planSnap = await getDoc(doc(db, 'plans', planId));
      if (planSnap.exists()) {
        return { id: planSnap.id, ...planSnap.data() };
      }
    } catch (err) {
      console.error("Error fetching plan details:", err);
    }
    return null;
  };

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
          
          let currentUserData = null;

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
              uid: currentUser.uid,
              email: userEmail,
              displayName: currentUser.displayName || 'Korisnik',
              role: isSuperAdmin ? 'super_admin' : 'org_admin',
              createdAt: new Date()
            };

            await setDoc(docRef, newUserData);
            currentUserData = newUserData;
          } else {
            currentUserData = docSnap.data();
          }

          setUserData(currentUserData);

          // Fetch plan details if user has a plan assigned
          if (currentUserData?.subscriptionPlanId) {
            const plan = await fetchPlanDetails(currentUserData.subscriptionPlanId);
            setPlanDetails(plan);
          } else {
            setPlanDetails(null);
          }
        } else {
          setUser(null);
          setUserData(null);
          setPlanDetails(null);
        }
      } catch (err) {
        console.error("Firestore Error:", err);
        // Fallback da te barem pusti unutra ako Auth radi a Firestore zeza
        if (currentUser) {
          setUserData({ 
            uid: currentUser.uid,
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

  const loginWithEmail = async (email, password) => {
    return signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const registerWithEmail = async (email, password) => {
    return createUserWithEmailAndPassword(auth, email.trim(), password);
  };

  const logout = () => signOut(auth);

  const value = {
    user,
    userData,
    planDetails, // Add planDetails to value
    isSuperAdmin: userData?.role === 'super_admin',
    isAdmin: userData?.role === 'org_admin' || userData?.role === 'super_admin',
    loading,
    logout,
    loginWithEmail,
    registerWithEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
