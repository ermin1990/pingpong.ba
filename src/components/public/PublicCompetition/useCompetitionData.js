import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase/config';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { generateSlug } from './utils';

export const useCompetitionData = () => {
  const { slug, categorySlug } = useParams();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [amaterLeague, setAmaterLeague] = useState(null);
  const [seasonSubCompetitions, setSeasonSubCompetitions] = useState([]);
  const [playerNames, setPlayerNames] = useState({});
  const [allPlayers, setAllPlayers] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [manualOrders, setManualOrders] = useState({});

  useEffect(() => {
    let unsubscribeCats = null;

    const fetchBySlug = async () => {
      try {
        let compDoc = null;
        const q = query(collection(db, "competitions"), where("slug", "==", slug));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          compDoc = snap.docs[0];
        } else {
          try {
            const dSnap = await getDoc(doc(db, "competitions", slug));
            if (dSnap.exists()) compDoc = dSnap;
          } catch (e) {}
        }
        
        if (compDoc) {
          const compData = { id: compDoc.id, ...compDoc.data() };
          setCompetition(compData);

          if (compData.isAmater) {
            try {
              const amRef = doc(db, "amater_leagues", compDoc.id);
              const amSnap = await getDoc(amRef);
              if (amSnap.exists()) {
                const amData = amSnap.data();
                setAmaterLeague({ id: amSnap.id, ...amData });
                if (amData.seasonalTag) {
                   const sQ = query(collection(db, "amater_leagues"), where("seasonalTag", "==", amData.seasonalTag));
                   const sSnap = await getDocs(sQ);
                   setSeasonSubCompetitions(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                }
              }
            } catch (err) {
              console.error("Error loading amater data:", err);
            }
          }

          if (compData.ownerUid) {
            const playersRef = collection(db, "players");
            const pQ = query(playersRef, where("ownerUid", "==", compData.ownerUid));
            getDocs(pQ).then(pSnap => {
              const playersList = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
              setAllPlayers(playersList);
              const names = {};
              playersList.forEach(p => { names[p.id] = p.name; });
              setPlayerNames(names);
            });
          }
          
          const catQ = query(collection(db, "competitions", compDoc.id, "categories"));
          unsubscribeCats = onSnapshot(catQ, (catSnap) => {
            const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() }))
              .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setCategories(cats);

            cats.forEach(async (cat) => {
              const ordersQ = query(collection(db, "competitions", compDoc.id, "categories", cat.id, "manualOrders"));
              const ordersSnap = await getDocs(ordersQ);
              const orders = {};
              ordersSnap.docs.forEach(d => { orders[d.id] = d.data().order; });
              setManualOrders(prev => ({ ...prev, [cat.id]: orders }));
            });
          });
        } else {
          setError("Takmičenje nije pronađeno.");
        }
      } catch (err) {
        console.error("Error fetching:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBySlug();
    return () => unsubscribeCats?.();
  }, [slug]);

  useEffect(() => {
    if (competition) {
      const q = query(collection(db, "matches"), where("competitionId", "==", competition.id));
      const unsubscribe = onSnapshot(q, (snap) => {
        setAllMatches(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [competition]);

  const activeCategory = useMemo(() => {
    if (categories.length === 0 || !categorySlug) return null;
    return categories.find(c => generateSlug(c.name) === categorySlug) || null;
  }, [categories, categorySlug]);

  return {
    competition,
    loading,
    error,
    categories,
    activeCategory,
    amaterLeague,
    seasonSubCompetitions,
    playerNames,
    allPlayers,
    allMatches,
    manualOrders
  };
};
